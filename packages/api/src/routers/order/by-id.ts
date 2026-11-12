import { z } from "zod";

import { protectedProcedure } from "../../orpc";

/**
 * Заказ текущего пользователя с позициями и историей этапов для трекера.
 * У событий с фото (фотоконтроль ОТК) возвращается ссылка `photoUrl`.
 *
 * @example client.order.byId({ id })
 */
export const byId = protectedProcedure
  .errors({ NOT_FOUND: { message: "Заказ не найден" } })
  .input(z.object({ id: z.uuid() }))
  .handler(async ({ context, input, errors }) => {
    const order = await context.db.query.Order.findFirst({
      where: (orders, { and, eq }) =>
        and(
          eq(orders.id, input.id),
          eq(orders.userId, context.session.user.id),
        ),
      with: {
        items: { columns: { fileKey: false } },
        events: { orderBy: (events, { asc }) => [asc(events.seq)] },
      },
    });

    if (!order) throw errors.NOT_FOUND();

    return {
      ...order,
      events: await Promise.all(
        order.events.map(async ({ photoKey, ...event }) => ({
          ...event,
          photoUrl: photoKey
            ? await context.storage.downloadUrl(photoKey)
            : null,
        })),
      ),
    };
  });
