import { handleYooKassaNotification } from "@paramlab/api";
import { logger } from "@paramlab/config";
import { db } from "@paramlab/db";

/**
 * Webhook YooKassa: уведомления о статусах платежей. Всегда отвечаем 200 —
 * иначе YooKassa будет повторять доставку; подлинность проверяется
 * перезапросом платежа в API внутри handleYooKassaNotification.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Parameters<
      typeof handleYooKassaNotification
    >[1];
    await handleYooKassaNotification(db, body);
  } catch (error) {
    logger.error("yookassa.webhook_error", error);
  }
  return Response.json({ ok: true });
}
