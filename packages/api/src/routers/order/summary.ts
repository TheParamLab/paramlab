import { and, eq, inArray, Order, sql } from "@paramlab/db";
import { ACTIVE_ORDER_STATUSES } from "@paramlab/validators";

import { protectedProcedure } from "../../orpc";

/**
 * Счётчики заказов текущего пользователя: всего и в работе. Отдельная
 * агрегация нужна, чтобы обзор кабинета не считал только последнюю страницу
 * `order.list` (там не больше 100 записей).
 *
 * @example client.order.summary()
 */
export const summary = protectedProcedure.handler(async ({ context }) => {
  const userId = context.session.user.id;

  const [[totalRow], [activeRow]] = await Promise.all([
    context.db
      .select({ count: sql<number>`count(*)::int` })
      .from(Order)
      .where(eq(Order.userId, userId)),
    context.db
      .select({ count: sql<number>`count(*)::int` })
      .from(Order)
      .where(
        and(
          eq(Order.userId, userId),
          inArray(Order.status, [...ACTIVE_ORDER_STATUSES]),
        ),
      ),
  ]);

  return {
    total: totalRow?.count ?? 0,
    active: activeRow?.count ?? 0,
  };
});
