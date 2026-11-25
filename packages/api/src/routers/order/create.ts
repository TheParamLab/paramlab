import { and, eq, Order, OrderEvent, OrderItem, sql } from "@paramlab/db";
import {
  createOrderSchema,
  normalizeRecipientPhone,
} from "@paramlab/validators";

import {
  createYooKassaPayment,
  yookassaConfigured,
} from "../../integrations/yookassa";
import { protectedProcedure } from "../../orpc";
import { resolveQuote } from "./resolve-quote";

/**
 * Оформить заказ на печать детали из библиотеки с доставкой в ПВЗ Ozon.
 * Цена печати и доставки считается на сервере (`resolveQuote`); заказ
 * создается в статусе «Ожидает оплаты». Если настроена YooKassa, сразу
 * создается платеж и возвращается `paymentUrl` для редиректа клиента.
 *
 * Заказ, позиция и первое событие пишутся одним SQL-запросом (CTE): либо
 * сохраняется все, либо ничего. Транзакции недоступны на драйвере neon-http.
 */
export const create = protectedProcedure
  .errors({
    NOT_FOUND: { message: "Деталь или пункт выдачи не найден" },
    DELIVERY_UNAVAILABLE: {
      message: "Доставка в этот пункт недоступна, выберите другой",
    },
  })
  .input(createOrderSchema)
  .handler(async ({ context, input, errors }) => {
    const userId = context.session.user.id;
    const recipientPhone = normalizeRecipientPhone(input.recipientPhone);
    const resolved = await resolveQuote(context.db, {
      userId,
      ...input,
      recipientPhone,
    });
    if (resolved.error === "DELIVERY_UNAVAILABLE") {
      throw errors.DELIVERY_UNAVAILABLE();
    }
    if (resolved.error) throw errors.NOT_FOUND();

    const { part, point, massGrams, printRub, deliveryRub, payableRub } =
      resolved;

    const { db } = context;
    const created = db.$with("created").as(
      db
        .insert(Order)
        .values({
          userId,
          totalRub: printRub,
          deliveryRub,
          payableRub,
          deliveryMethod: "ozon_pvz",
          deliveryPointId: point.id,
          deliveryPointName: point.name,
          deliveryPointAddress: point.address,
          deliveryCity: point.city,
          recipientPhone,
          recipientName: input.recipientName,
          deliveryEtaDays: resolved.deliveryEtaDays,
        })
        .returning(),
    );
    const item = db.$with("item").as(
      db
        .insert(OrderItem)
        .select(
          db
            .select({
              id: sql<string>`gen_random_uuid()`.as("id"),
              orderId: created.id,
              partId: sql<string>`${part.id}::uuid`.as("part_id"),
              partName: sql<string>`${part.name}::varchar`.as("part_name"),
              fileKey: sql<string>`${part.fileKey}::text`.as("file_key"),
              fileName: sql<string>`${part.fileName}::varchar`.as("file_name"),
              materialId: sql<
                typeof input.materialId
              >`${input.materialId}::text`.as("material_id"),
              quantity: sql<number>`${input.quantity}::int`.as("quantity"),
              massGrams: sql<number>`${massGrams}::int`.as("mass_grams"),
              priceRub: sql<number>`${printRub}::int`.as("price_rub"),
            })
            .from(created),
        )
        .returning({ id: OrderItem.id }),
    );
    const event = db.$with("event").as(
      db
        .insert(OrderEvent)
        .select(
          db
            .select({
              id: sql<string>`gen_random_uuid()`.as("id"),
              orderId: created.id,
              status: created.status,
              note: sql<string | null>`null::text`.as("note"),
              photoKey: sql<string | null>`null::text`.as("photo_key"),
              createdAt: sql<Date>`now()`.as("created_at"),
              seq: sql<number>`nextval('order_events_seq_seq')`.as("seq"),
            })
            .from(created),
        )
        .returning({ id: OrderEvent.id }),
    );

    const [order] = await db.with(created, item, event).select().from(created);
    if (!order) throw new Error("Failed to insert order");

    // Платеж создается после вставки заказа: у YooKassa идемпотентность по
    // ключу заказа, поэтому повторная попытка вернет тот же платеж.
    let paymentUrl: string | null = null;
    if (yookassaConfigured()) {
      const origin = context.headers.get("origin") ?? "https://paramlab.ru";
      const payment = await createYooKassaPayment({
        orderId: order.id,
        orderNumber: order.number,
        amountRub: payableRub,
        returnUrl: `${origin}/cabinet/orders/${order.id}`,
        idempotenceKey: order.id,
      });
      paymentUrl = payment.confirmation?.confirmation_url ?? null;
      await db
        .update(Order)
        .set({
          paymentProvider: "yookassa",
          paymentId: payment.id,
          paymentUrl,
        })
        .where(and(eq(Order.id, order.id), eq(Order.userId, userId)));
    }

    return { ...order, paymentUrl };
  });
