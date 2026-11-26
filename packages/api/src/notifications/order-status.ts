import { env, logger } from "@paramlab/config";
import type { Database } from "@paramlab/db";
import { eq, user } from "@paramlab/db";
import { dispatchEmail } from "@paramlab/jobs";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@paramlab/validators";

/**
 * Письмо клиенту о переходе заказа на новый этап. Ошибки отправки глушим:
 * смена статуса уже зафиксирована. Hatchet повторяет только задания в очереди.
 * При ошибке отправки в текущем процессе автоматического повтора нет;
 * необходимость повтора определяет команда.
 */
export async function notifyOrderStatus(
  db: Database,
  order: {
    id: string;
    number: number;
    userId: string;
    status: OrderStatus;
    trackingUrl?: string | null;
  },
  note?: string | null,
): Promise<void> {
  // Начальный этап не уведомляем: он ставится при создании заказа,
  // а не при переходе.
  if (order.status === "pending_payment") return;
  try {
    const [account] = await db
      .select({ email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, order.userId));
    if (!account) return;

    const statusLabel = ORDER_STATUS_LABELS[order.status];
    await dispatchEmail({
      template: "order-status",
      to: [account.email],
      subject: `Заказ №${order.number}: ${statusLabel}`,
      props: {
        customerName: account.name,
        orderNumber: order.number,
        statusLabel,
        note,
        trackingUrl: order.trackingUrl,
        orderUrl: `${env.APP_URL}/cabinet/orders/${order.id}`,
      },
    });
  } catch (error) {
    logger.error("order.notify_failed", error, { orderId: order.id });
  }
}
