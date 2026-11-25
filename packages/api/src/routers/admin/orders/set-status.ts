import { logger } from "@paramlab/config";
import {
  DeliveryPoint,
  eq,
  Order,
  OrderEvent,
  OrderItem,
  sql,
} from "@paramlab/db";
import { ORDER_STATUSES } from "@paramlab/validators";
import { z } from "zod";

import {
  ozonApprovePosting,
  ozonConfigured,
  ozonCreateOrder,
} from "../../../integrations/ozon-delivery";
import { adminProcedure } from "../../../orpc";
import { packageDimensions } from "../../order/resolve-quote";

/**
 * Перевести заказ на другой этап и записать событие в историю трекера.
 * При передаче в доставку можно указать перевозчика и трек-номер.
 *
 * Статус и событие пишутся одним SQL-запросом (CTE): либо сохраняются оба,
 * либо ни одного. Транзакции недоступны на драйвере neon-http.
 *
 * @example client.admin.orders.setStatus({ id, status: "printing" })
 */
export const setStatus = adminProcedure
  .errors({
    NOT_FOUND: { message: "Заказ не найден" },
    OZON_FAILED: {
      message:
        "Не удалось создать отправление в Ozon — проверьте интеграцию и повторите",
    },
  })
  .input(
    z.object({
      id: z.uuid(),
      status: z.enum(ORDER_STATUSES),
      note: z.string().trim().max(500).optional(),
      carrier: z.string().trim().max(60).optional(),
      trackingNumber: z.string().trim().max(60).optional(),
      // Только HTTPS: в адресе отслеживания есть номер отправления.
      trackingUrl: z
        .url({ protocol: /^https$/ })
        .max(500)
        .optional(),
    }),
  )
  .handler(async ({ context, input, errors }) => {
    // При передаче заказа с доставкой Ozon в работу логистики отправление
    // создается в Ozon Delivery API: сначала заказ, затем подтверждение
    // сборки. Трек-номером становится номер отправления Ozon.
    let carrier = input.carrier;
    let trackingNumber = input.trackingNumber;
    let trackingUrl = input.trackingUrl;
    let ozonOrderId: string | undefined;
    let ozonPostingNumber: string | undefined;

    if (input.status === "shipped") {
      const [existing] = await context.db
        .select()
        .from(Order)
        .where(eq(Order.id, input.id));
      if (
        existing?.deliveryMethod === "ozon_pvz" &&
        !existing.ozonPostingNumber &&
        ozonConfigured() &&
        existing.deliveryPointId &&
        existing.recipientPhone &&
        existing.recipientName
      ) {
        const items = await context.db
          .select()
          .from(OrderItem)
          .where(eq(OrderItem.orderId, existing.id));
        const totalMass = items.reduce(
          (sum, item) => sum + item.massGrams * item.quantity,
          0,
        );
        const [point] = await context.db
          .select()
          .from(DeliveryPoint)
          .where(eq(DeliveryPoint.id, existing.deliveryPointId));
        const shipmentMethodId = point?.shipmentMethodIds[0];
        if (!shipmentMethodId) {
          throw new Error(
            "У пункта выдачи нет метода доставки — синхронизируйте справочник ПВЗ",
          );
        }
        // ID точек и методов Ozon — int64 и хранятся строками: передаем как есть.
        try {
          const created = await ozonCreateOrder({
            idempotencyKey: existing.id,
            orderExternalId: `paramlab-${existing.number}`,
            recipientPhone: existing.recipientPhone,
            recipientName: existing.recipientName,
            deliveryPointId: existing.deliveryPointId,
            shipmentMethodId,
            postingExternalId: `paramlab-${existing.number}-1`,
            description: items
              .map((item) => `${item.partName} × ${item.quantity}`)
              .join(", ")
              .slice(0, 200),
            declaredValueRub: existing.totalRub,
            dimensions: packageDimensions(totalMass, 1),
          });
          const posting = created.postings?.[0];
          if (!posting) throw new Error("Ozon не вернул отправление");
          await ozonApprovePosting(posting.posting_number);
          ozonOrderId = created.order_number;
          ozonPostingNumber = posting.posting_number;
        } catch (error) {
          logger.error("ozon.order_create_failed", error, {
            orderId: existing.id,
          });
          throw errors.OZON_FAILED();
        }
        carrier = carrier ?? "Ozon";
        trackingNumber = trackingNumber ?? ozonPostingNumber;
        trackingUrl =
          trackingUrl ??
          `https://ozon.ru/my/orderdetails?order=${ozonPostingNumber}`;
      }
    }

    const updated = context.db.$with("updated").as(
      context.db
        .update(Order)
        .set({
          status: input.status,
          carrier,
          trackingNumber,
          trackingUrl,
          ...(ozonOrderId ? { ozonOrderId } : {}),
          ...(ozonPostingNumber ? { ozonPostingNumber } : {}),
        })
        .where(eq(Order.id, input.id))
        .returning(),
    );
    const event = context.db.$with("event").as(
      context.db
        .insert(OrderEvent)
        .select(
          context.db
            .select({
              id: sql<string>`gen_random_uuid()`.as("id"),
              orderId: updated.id,
              status: sql<typeof input.status>`${input.status}`.as("status"),
              note: sql<string | null>`${input.note ?? null}`.as("note"),
              photoKey: sql<string | null>`null`.as("photo_key"),
              // Не now(): нужно время записи, а не начала запроса — тогда
              // параллельные смены этапа идут в порядке захвата заказа.
              createdAt: sql<Date>`clock_timestamp()`.as("created_at"),
              seq: sql<number>`nextval('order_events_seq_seq')`.as("seq"),
            })
            .from(updated),
        )
        .returning({ id: OrderEvent.id }),
    );

    const [order] = await context.db
      .with(updated, event)
      .select()
      .from(updated);

    if (!order) throw errors.NOT_FOUND();
    return order;
  });
