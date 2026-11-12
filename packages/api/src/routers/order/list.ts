import { protectedProcedure } from "../../orpc";

/**
 * Заказы текущего пользователя с позициями, новые сверху.
 *
 * @example client.order.list()
 */
export const list = protectedProcedure.handler(async ({ context }) => {
  return context.db.query.Order.findMany({
    where: (orders, { eq }) => eq(orders.userId, context.session.user.id),
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    with: { items: { columns: { fileKey: false } } },
  });
});
