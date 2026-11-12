import { and, eq, Order, OrderEvent, OrderItem, Part, sql } from "@acme/db";
import {
  calcPartPrice,
  createOrderSchema,
  partMassFor,
} from "@acme/validators";

import { protectedProcedure } from "../../orpc";

/**
 * Оформить заказ на печать детали из библиотеки. Цена считается на сервере
 * по массе детали в выбранном материале и его тарифу; заказ создается в
 * статусе «Ожидает оплаты».
 *
 * Заказ, позиция и первое событие пишутся одним SQL-запросом (CTE): либо
 * сохраняется все, либо ничего. Транзакции недоступны на драйвере neon-http.
 *
 * @example client.order.create({ partId, materialId: "petg", quantity: 10 })
 */
export const create = protectedProcedure
  .errors({ NOT_FOUND: { message: "Деталь не найдена" } })
  .input(createOrderSchema)
  .handler(async ({ context, input, errors }) => {
    const userId = context.session.user.id;
    const [part] = await context.db
      .select()
      .from(Part)
      .where(and(eq(Part.id, input.partId), eq(Part.userId, userId)));

    if (!part) throw errors.NOT_FOUND();

    const massGrams = partMassFor(part, input.materialId);
    const price = calcPartPrice({
      massGrams,
      materialId: input.materialId,
      quantity: input.quantity,
    });

    const { db } = context;
    const created = db
      .$with("created")
      .as(
        db.insert(Order).values({ userId, totalRub: price.total }).returning(),
      );
    // Порядок полей совпадает с порядком столбцов таблиц.
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
              priceRub: sql<number>`${price.total}::int`.as("price_rub"),
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

    return order;
  });
