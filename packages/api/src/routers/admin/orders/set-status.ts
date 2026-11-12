import { eq, Order, OrderEvent, sql } from "@acme/db";
import { ORDER_STATUSES } from "@acme/validators";
import { z } from "zod";

import { adminProcedure } from "../../../orpc";

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
  .errors({ NOT_FOUND: { message: "Заказ не найден" } })
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
    const updated = context.db.$with("updated").as(
      context.db
        .update(Order)
        .set({
          status: input.status,
          carrier: input.carrier,
          trackingNumber: input.trackingNumber,
          trackingUrl: input.trackingUrl,
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
