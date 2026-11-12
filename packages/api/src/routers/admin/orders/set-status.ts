import { eq, Order, OrderEvent } from "@acme/db";
import { ORDER_STATUSES } from "@acme/validators";
import { z } from "zod";

import { adminProcedure } from "../../../orpc";

/**
 * Перевести заказ на другой этап и записать событие в историю трекера.
 * При передаче в доставку можно указать перевозчика и трек-номер.
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
      trackingUrl: z.url().max(500).optional(),
    }),
  )
  .handler(async ({ context, input, errors }) => {
    const [order] = await context.db
      .update(Order)
      .set({
        status: input.status,
        carrier: input.carrier,
        trackingNumber: input.trackingNumber,
        trackingUrl: input.trackingUrl,
      })
      .where(eq(Order.id, input.id))
      .returning();

    if (!order) throw errors.NOT_FOUND();

    await context.db
      .insert(OrderEvent)
      .values({ orderId: order.id, status: input.status, note: input.note });

    return order;
  });
