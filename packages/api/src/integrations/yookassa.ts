import { env } from "@paramlab/config";

const API_URL = "https://api.yookassa.ru/v3";

export interface YooKassaPayment {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled" | string;
  paid: boolean;
  amount: { value: string; currency: string };
  confirmation?: { type?: string; confirmation_url?: string };
  metadata?: Record<string, unknown>;
  description?: string;
}

export function yookassaConfigured() {
  return Boolean(env.YOOKASSA_SHOP_ID && env.YOOKASSA_SECRET_KEY);
}

function authorization() {
  if (!env.YOOKASSA_SHOP_ID || !env.YOOKASSA_SECRET_KEY) {
    throw new Error("YooKassa is not configured");
  }
  return `Basic ${Buffer.from(`${env.YOOKASSA_SHOP_ID}:${env.YOOKASSA_SECRET_KEY}`).toString("base64")}`;
}

async function parsePayment(response: Response): Promise<YooKassaPayment> {
  const body = (await response.json().catch(() => null)) as
    | (YooKassaPayment & { code?: string; description?: string })
    | null;
  if (!response.ok || !body?.id) {
    throw new Error(
      body?.description || `YooKassa request failed with ${response.status}`,
    );
  }
  return body;
}

export async function createYooKassaPayment(input: {
  orderId: string;
  description: string;
  amountRub: number;
  returnUrl: string;
  idempotenceKey: string;
}): Promise<YooKassaPayment> {
  const response = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: {
      Authorization: authorization(),
      "Content-Type": "application/json",
      "Idempotence-Key": input.idempotenceKey,
    },
    body: JSON.stringify({
      amount: {
        value: input.amountRub.toFixed(2),
        currency: "RUB",
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: input.returnUrl,
      },
      description: input.description,
      metadata: {
        order_id: input.orderId,
      },
    }),
    signal: AbortSignal.timeout(10_000),
  });
  return parsePayment(response);
}

export async function getYooKassaPayment(
  paymentId: string,
): Promise<YooKassaPayment> {
  const response = await fetch(
    `${API_URL}/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: { Authorization: authorization() },
      signal: AbortSignal.timeout(10_000),
    },
  );
  return parsePayment(response);
}
