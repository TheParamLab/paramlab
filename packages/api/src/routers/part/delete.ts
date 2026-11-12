import { and, eq, Part } from "@acme/db";
import { z } from "zod";

import { protectedProcedure } from "../../orpc";

/**
 * Удалить деталь из своей библиотеки. Оформленные заказы сохраняются:
 * в позициях остается снимок названия, массы и цены.
 *
 * @example client.part.delete({ id })
 */
export const deletePart = protectedProcedure
  .errors({ NOT_FOUND: { message: "Деталь не найдена" } })
  .input(z.object({ id: z.uuid() }))
  .handler(async ({ context, input, errors }) => {
    const [deleted] = await context.db
      .delete(Part)
      .where(
        and(eq(Part.id, input.id), eq(Part.userId, context.session.user.id)),
      )
      .returning({ id: Part.id });

    if (!deleted) throw errors.NOT_FOUND();
    return { success: true, id: deleted.id };
  });
