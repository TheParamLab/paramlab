import { and, eq, Order, OrderEvent, OrderItem, Part } from "@acme/db";
import {
  calcPartPrice,
  createOrderSchema,
  partMassFor,
} from "@acme/validators";

import { protectedProcedure } from "../../orpc";

/**
 * Оформить заказ на печать детали из библиотеки. Цена считается на сервере
 * по массе детали в выбранном материале и его тарифу; заказ создается в статусе
 * «Ожидает оплаты».
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

    const [order] = await context.db
      .insert(Order)
      .values({ userId, totalRub: price.total })
      .returning();
    if (!order) throw new Error("Failed to insert order");

    // Драйвер neon-http не поддерживает транзакции, поэтому при сбое
    // убираем заказ без позиций вручную.
    try {
      await context.db.insert(OrderItem).values({
        orderId: order.id,
        partId: part.id,
        partName: part.name,
        fileKey: part.fileKey,
        fileName: part.fileName,
        materialId: input.materialId,
        quantity: input.quantity,
        massGrams,
        priceRub: price.total,
      });
      await context.db
        .insert(OrderEvent)
        .values({ orderId: order.id, status: order.status });
    } catch (error) {
      await context.db.delete(Order).where(eq(Order.id, order.id));
      throw error;
    }

    return order;
  });
