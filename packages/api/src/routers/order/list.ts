import { z } from "zod";

import { protectedProcedure } from "../../orpc";

/**
 * Заказы текущего пользователя с позициями, новые сверху, постранично.
 *
 * @example client.order.list({ limit: 50, offset: 0 })
 */
export const list = protectedProcedure
  .input(
    z.object({
      /** Заказов на страницу (1–100, по умолчанию 50). */
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }),
  )
  .handler(async ({ context, input }) => {
    return context.db.query.Order.findMany({
      where: (orders, { eq }) => eq(orders.userId, context.session.user.id),
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      limit: input.limit,
      offset: input.offset,
      with: { items: { columns: { fileKey: false } } },
    });
  });
