import { handleYooKassaNotification } from "@paramlab/api";
import { logger } from "@paramlab/config";
import { db } from "@paramlab/db";

/**
 * Webhook YooKassa: уведомления о статусах платежей. Подлинность
 * проверяется перезапросом платежа в API внутри
 * handleYooKassaNotification — телу webhook не доверяем.
 * Битые payload отвечаем 200 (повторять их бессмысленно), а сбой обработки —
 * 500, чтобы YooKassa повторила доставку.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: true });
  }

  // Структурная валидация до любой работы: отсекает мусор и часть флуда.
  const notification = body as {
    type?: unknown;
    event?: unknown;
    object?: { id?: unknown; status?: unknown };
  } | null;
  if (
    notification?.type !== "notification" ||
    typeof notification.event !== "string" ||
    !notification.event.startsWith("payment.") ||
    typeof notification.object?.id !== "string" ||
    typeof notification.object.status !== "string"
  ) {
    return Response.json({ ok: true });
  }

  try {
    await handleYooKassaNotification(
      db,
      notification as Parameters<typeof handleYooKassaNotification>[1],
    );
  } catch (error) {
    logger.error("yookassa.webhook_error", error);
    return Response.json({ ok: false }, { status: 500 });
  }
  return Response.json({ ok: true });
}
