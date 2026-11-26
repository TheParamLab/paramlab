import { logger } from "@paramlab/config";
import { and, eq, Order, OrderEvent, PaymentEvent, sql } from "@paramlab/db";
import { z } from "zod";

import { getYooKassaPayment } from "../integrations/yookassa";
import { notifyOrderStatus } from "../notifications/order-status";

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
 * metadata.order_id. Переход и запись истории применяются только к
 * pending_payment; уникальный индекс PaymentEvent убирает дубли аудита.
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
    throw error;
  }

  if (payment?.id !== paymentId) return false;
  const orderId = payment.metadata?.order_id;
  if (typeof orderId !== "string" || !z.uuid().safeParse(orderId).success) {
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

  const transition =
    payment.status === "succeeded" &&
    payment.paid === true &&
    notification.event === "payment.succeeded"
      ? ({ status: "paid", note: "Оплата подтверждена YooKassa" } as const)
      : payment.status === "canceled" &&
          notification.event === "payment.canceled"
        ? ({ status: "cancelled", note: "Платеж отменен или истек" } as const)
        : null;

  if (transition) {
    const updated = db.$with("updated").as(
      db
        .update(Order)
        .set({
          status: transition.status,
          paidAt: transition.status === "paid" ? new Date() : undefined,
        })
        .where(
          and(
            eq(Order.id, orderId),
            eq(Order.paymentId, paymentId),
            eq(Order.status, "pending_payment"),
          ),
        )
        .returning({
          id: Order.id,
          number: Order.number,
          userId: Order.userId,
          status: Order.status,
          trackingUrl: Order.trackingUrl,
        }),
    );
    const event = db.$with("event").as(
      db
        .insert(OrderEvent)
        .select(
          db
            .select({
              id: sql<string>`gen_random_uuid()`.as("id"),
              orderId: updated.id,
              status: updated.status,
              note: sql<string>`${transition.note}`.as("note"),
              photoKey: sql<null>`null`.as("photo_key"),
              createdAt: sql<Date>`clock_timestamp()`.as("created_at"),
              seq: sql<number>`nextval('order_events_seq_seq')`.as("seq"),
            })
            .from(updated),
        )
        .returning({ orderId: OrderEvent.orderId }),
    );
    const [order] = await db
      .with(updated, event)
      .select({
        id: updated.id,
        number: updated.number,
        userId: updated.userId,
        status: updated.status,
        trackingUrl: updated.trackingUrl,
      })
      .from(updated)
      .innerJoin(event, eq(event.orderId, updated.id));

    // Переход применился — сообщаем клиенту о новом этапе заказа.
    if (order) await notifyOrderStatus(db, order, transition.note);
  }

  // Журнал webhook-событий — аудит. Уникальный индекс гасит дубликаты.
  await db
    .insert(PaymentEvent)
    .values({
      provider: "yookassa",
      paymentId,
      event: notification.event,
      payload: notification as unknown as Record<string, unknown>,
    })
    .onConflictDoNothing();
  return true;
}
