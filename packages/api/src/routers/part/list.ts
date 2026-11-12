import { desc, eq, Order, OrderItem, Part } from "@acme/db";

import { protectedProcedure } from "../../orpc";

/**
 * Библиотека деталей текущего пользователя, новые сверху. Для каждой детали —
 * ссылка на превью и параметры последнего заказа (для «Повторить в 1 клик»).
 *
 * @example client.part.list()
 */
export const list = protectedProcedure.handler(async ({ context }) => {
  const userId = context.session.user.id;

  const [parts, orderedItems] = await Promise.all([
    context.db
      .select()
      .from(Part)
      .where(eq(Part.userId, userId))
      .orderBy(desc(Part.createdAt)),
    context.db
      .select({
        partId: OrderItem.partId,
        quantity: OrderItem.quantity,
        materialId: OrderItem.materialId,
      })
      .from(OrderItem)
      .innerJoin(Order, eq(OrderItem.orderId, Order.id))
      .where(eq(Order.userId, userId))
      .orderBy(desc(Order.createdAt)),
  ]);

  // Позиции отсортированы от новых к старым: первая встреченная — последняя.
  const lastOrders = new Map<string, (typeof orderedItems)[number]>();
  for (const item of orderedItems) {
    if (item.partId && !lastOrders.has(item.partId)) {
      lastOrders.set(item.partId, item);
    }
  }

  return Promise.all(
    parts.map(async ({ fileKey: _fileKey, previewKey, ...part }) => {
      const last = lastOrders.get(part.id);
      return {
        ...part,
        previewUrl: previewKey
          ? await context.storage.downloadUrl(previewKey)
          : null,
        lastOrder: last
          ? { quantity: last.quantity, materialId: last.materialId }
          : null,
      };
    }),
  );
});
