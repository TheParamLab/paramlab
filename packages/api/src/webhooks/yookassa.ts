import { logger } from "@paramlab/config";
import { and, eq, Order, OrderEvent, PaymentEvent } from "@paramlab/db";

import { getYooKassaPayment } from "../integrations/yookassa";

type Db = typeof import("@paramlab/db").db;

export interface YooKassaNotification {
  type: "notification";
  event: "payment.succeeded" | "payment.canceled" | string;
  object: {
    id: string;
    status: string;
    metadata?: { order_id?: string };
  };
}

/**
 * Обработать webhook YooKassa. Доверять телу нельзя: платеж всегда
 * перезапрашивается в API YooKassa серверным ключом, а заказ ищется по
 * metadata.order_id. Идемпотентность — уникальный индекс PaymentEvent
 * (provider, paymentId, event): повторные доставки webhook отбрасываются.
 *
 * Возвращает true, если событие обработано (или уже было обработано).
 */
export async function handleYooKassaNotification(
  db: Db,
  notification: YooKassaNotification,
): Promise<boolean> {
  const paymentId = notification.object?.id;
  if (!paymentId || !notification.event?.startsWith("payment.")) return false;

  let payment: Awaited<ReturnType<typeof getYooKassaPayment>>;
  try {
    payment = await getYooKassaPayment(paymentId);
  } catch (error) {
    logger.error("yookassa.webhook_verify_failed", error);
    return false;
  }

  const orderId = payment.metadata?.order_id;
  if (typeof orderId !== "string") {
    logger.error("yookassa.webhook_no_order", new Error(paymentId));
    return false;
  }
  if (payment.status !== notification.object.status) {
    logger.error(
      "yookassa.webhook_status_mismatch",
      new Error(
        `${paymentId}: ${payment.status} vs ${notification.object.status}`,
      ),
    );
    return false;
  }

  // Идемпотентность: гонка двух webhook разрешается уникальным индексом.
  const inserted = await db
    .insert(PaymentEvent)
    .values({
      provider: "yookassa",
      paymentId,
      event: notification.event,
      payload: notification as unknown as Record<string, unknown>,
    })
    .onConflictDoNothing()
    .returning({ id: PaymentEvent.id });
  if (inserted.length === 0) return true;

  const [order] = await db
    .select()
    .from(Order)
    .where(and(eq(Order.id, orderId), eq(Order.paymentId, paymentId)));
  if (order?.status !== "pending_payment") return true;

  if (notification.event === "payment.succeeded" && payment.paid) {
    await db
      .update(Order)
      .set({ status: "paid", paidAt: new Date() })
      .where(eq(Order.id, order.id));
    await db.insert(OrderEvent).values({
      orderId: order.id,
      status: "paid",
      note: "Оплата подтверждена YooKassa",
    });
    return true;
  }

  if (notification.event === "payment.canceled") {
    await db
      .update(Order)
      .set({ status: "cancelled" })
      .where(eq(Order.id, order.id));
    await db.insert(OrderEvent).values({
      orderId: order.id,
      status: "cancelled",
      note: "Платеж отменен или истек",
    });
    return true;
  }
  return true;
}
