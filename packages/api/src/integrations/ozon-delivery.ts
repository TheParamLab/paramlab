import { env } from "@paramlab/config";

const TOKEN_URL = "https://xapi.ozon.ru/oauth/token";
const API_URL = "https://api-delivery.ozon.ru";

interface OzonMoney {
  amount: string;
  currency_code: string;
}

export interface OzonDimensions {
  weight_g: number;
  length_mm: number;
  width_mm: number;
  height_mm: number;
}

export interface OzonDeliveryPoint {
  delivery_point_id: number;
  name: string;
  delivery_point_number?: string | null;
  type: "unknown" | "pvz" | "postamat" | string;
  full_address: string;
  coordinates?: { latitude: number; longitude: number };
  schedule?: unknown;
  is_active: boolean;
  storage_period_days?: number | null;
  is_bulky?: boolean;
  restrictions?: {
    min_weight_g?: number;
    max_weight_g?: number;
    max_width_mm?: number;
    max_length_mm?: number;
    max_height_mm?: number;
    min_price?: OzonMoney;
    max_price?: OzonMoney;
  };
}

export interface OzonCheckoutResult {
  request_id: number;
  posting?: {
    estimated_delivery_cost?: OzonMoney;
    estimated_insurance_cost?: OzonMoney;
    estimated_delivery_days?: number;
    cutoff_at?: string;
  };
  error?: { code: string; message: string };
}

export interface OzonOrderCreateResult {
  order_number: string;
  order_external_id?: string | null;
  postings: Array<{
    request_id: number;
    posting_number: string;
    posting_external_id?: string;
    estimated_delivery_days?: number;
    cutoff_at?: string;
  }>;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export function ozonConfigured() {
  return Boolean(
    env.OZON_DELIVERY_CLIENT_ID && env.OZON_DELIVERY_CLIENT_SECRET,
  );
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  if (!ozonConfigured()) throw new Error("Ozon Delivery is not configured");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    redirect: "follow",
    body: JSON.stringify({
      client_id: env.OZON_DELIVERY_CLIENT_ID,
      client_secret: env.OZON_DELIVERY_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await response.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  } | null;
  if (!response.ok || !body?.access_token) {
    throw new Error(
      body?.error_description ||
        `Ozon token request failed with ${response.status}`,
    );
  }
  // Ozon returns expires_in as an absolute Unix timestamp on some tenants;
  // treat small values as relative seconds and cap the cache at one hour.
  const nowSec = Math.floor(Date.now() / 1000);
  const exp = body.expires_in ?? nowSec + 3600;
  const expiresAtMs =
    exp > nowSec + 120 ? exp * 1000 : Date.now() + Math.min(exp, 3600) * 1000;
  cachedToken = { token: body.access_token, expiresAt: expiresAtMs };
  return body.access_token;
}

async function ozonFetch<T>(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    redirect: "follow",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await response.json().catch(() => null)) as T & {
    error?: { code?: string; message?: string };
  };
  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        `Ozon Delivery ${path} failed with ${response.status}`,
    );
  }
  return data;
}

export async function ozonCheckClient(phone: string): Promise<boolean> {
  const data = await ozonFetch<{ can_be_delivered: boolean }>(
    "/v1/delivery/check-client",
    { phone_number: phone },
  );
  return data.can_be_delivered;
}

export async function ozonListDeliveryPoints(input: {
  cursor?: string;
  limit?: number;
}): Promise<{
  delivery_points: Array<{
    delivery_point_id: number;
    shipment_method_ids: number[] | number;
  }>;
  next_cursor?: string | null;
}> {
  return ozonFetch("/v1/delivery-point/list", {
    pagination: { cursor: input.cursor, limit: input.limit ?? 100 },
  });
}

export async function ozonDeliveryPointInfo(
  ids: number[],
): Promise<{ delivery_points: OzonDeliveryPoint[] }> {
  return ozonFetch("/v1/delivery-point/info", {
    delivery_point_ids: ids,
  });
}

export async function ozonCheckout(input: {
  recipientPhone: string;
  deliveryPointId: number;
  shipmentMethodId: number;
  declaredValueRub: number;
  dimensions: OzonDimensions;
}): Promise<OzonCheckoutResult[]> {
  const data = await ozonFetch<{ results: OzonCheckoutResult[] }>(
    "/v1/order/checkout",
    {
      recipient: { phone_number: input.recipientPhone },
      postings: [
        {
          request_id: 1,
          shipment_method_id: input.shipmentMethodId,
          declared_value: {
            amount: input.declaredValueRub.toFixed(2),
            currency_code: "RUB",
          },
          dimensions: input.dimensions,
        },
      ],
      delivery: {
        delivery_point: { delivery_point_id: input.deliveryPointId },
      },
    },
  );
  return data.results;
}

export async function ozonCreateOrder(input: {
  idempotencyKey: string;
  orderExternalId: string;
  recipientPhone: string;
  recipientName: string;
  deliveryPointId: number;
  shipmentMethodId: number;
  postingExternalId: string;
  description: string;
  declaredValueRub: number;
  dimensions: OzonDimensions;
}): Promise<OzonOrderCreateResult> {
  return ozonFetch(
    "/v1/order/create",
    {
      order_external_id: input.orderExternalId,
      recipient: {
        phone_number: input.recipientPhone,
        full_name: input.recipientName,
      },
      delivery: {
        delivery_point: { delivery_point_id: input.deliveryPointId },
      },
      postings: [
        {
          request_id: 1,
          posting_external_id: input.postingExternalId,
          shipment_method_id: input.shipmentMethodId,
          description: input.description,
          declared_value: {
            amount: input.declaredValueRub.toFixed(2),
            currency_code: "RUB",
          },
          dimensions: input.dimensions,
        },
      ],
    },
    { "Idempotency-Key": input.idempotencyKey },
  );
}

export async function ozonApprovePosting(postingNumber: string) {
  return ozonFetch("/v1/posting/approve", {
    posting_number: postingNumber,
  });
}
