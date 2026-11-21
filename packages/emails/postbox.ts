import { createHash, createHmac } from "node:crypto";
import { logger } from "@paramlab/config";

import { env } from "./env";

/**
 * Yandex Cloud Postbox sender over its REST API (AWS SESv2-compatible):
 * `POST {endpoint}/v2/email/outbound-emails` with a JSON body. Requests
 * are signed with AWS Signature V4 (service `ses`) using the static
 * access keys of a service account with the `postbox.sender` role — no
 * AWS SDK involved.
 *
 * https://yandex.cloud/en/docs/postbox/operations/send-email
 * https://yandex.cloud/en/docs/postbox/aws-compatible-api/signing-requests
 */

const SERVICE = "ses";
const ALGORITHM = "AWS4-HMAC-SHA256";
const SEND_EMAIL_PATH = "/v2/email/outbound-emails";
const SIGNED_HEADERS = "content-type;host;x-amz-date";
const REQUEST_TIMEOUT_MS = 10_000;

export interface PostboxEmail {
  html: string;
  subject: string;
  to: string[];
  from?: string;
}

/** Credentials + endpoint of a Postbox service account. */
export interface PostboxClient {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  region: string;
}

/** True when the env carries Postbox static keys (primary provider). */
export const postboxConfigured = Boolean(
  env.YANDEX_POSTBOX_ACCESS_KEY_ID && env.YANDEX_POSTBOX_SECRET_ACCESS_KEY,
);

const defaultClient = (): PostboxClient | null => {
  const accessKeyId = env.YANDEX_POSTBOX_ACCESS_KEY_ID;
  const secretAccessKey = env.YANDEX_POSTBOX_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    return null;
  }
  return {
    accessKeyId,
    secretAccessKey,
    endpoint: env.YANDEX_POSTBOX_ENDPOINT,
    region: env.YANDEX_POSTBOX_REGION,
  };
};

const sha256Hex = (data: string): string =>
  createHash("sha256").update(data, "utf8").digest("hex");

const hmac = (key: Buffer | string, data: string): Buffer =>
  createHmac("sha256", key).update(data, "utf8").digest();

/**
 * AWS Signature V4 `Authorization` header for a Postbox request. Follows
 * the canonical form from the Yandex docs (same as botocore's debug
 * output): POST, path, empty query string, then the content-type, host
 * and x-amz-date headers.
 */
const signV4 = (
  client: PostboxClient,
  request: {
    path: string;
    host: string;
    amzDate: string;
    payload: string;
  },
): string => {
  const dateStamp = request.amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${client.region}/${SERVICE}/aws4_request`;

  const canonicalHeaders =
    `content-type:application/json\n` +
    `host:${request.host}\n` +
    `x-amz-date:${request.amzDate}\n`;

  const canonicalRequest = [
    "POST",
    request.path,
    "", // canonical query string, empty for SendEmail
    canonicalHeaders,
    SIGNED_HEADERS,
    sha256Hex(request.payload),
  ].join("\n");

  const stringToSign = [
    ALGORITHM,
    request.amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmac(`AWS4${client.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, client.region);
  const kService = hmac(kRegion, SERVICE);
  const signingKey = hmac(kService, "aws4_request");

  const signature = createHmac("sha256", signingKey)
    .update(stringToSign, "utf8")
    .digest("hex");

  return (
    `${ALGORITHM} Credential=${client.accessKeyId}/${credentialScope}` +
    `, SignedHeaders=${SIGNED_HEADERS}, Signature=${signature}`
  );
};

/** Best-effort human-readable detail from a non-2xx JSON body. */
const errorDetail = (body: string): string => {
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    const detail =
      parsed.message ?? parsed.Message ?? parsed.code ?? parsed.__type;
    if (typeof detail === "string" && detail !== "") {
      return detail;
    }
  } catch {
    // Not JSON — fall back to the raw body.
  }
  return body;
};

/** Sends one email via the Postbox REST API; resolves with its MessageId. */
export const sendViaPostbox = async (
  email: PostboxEmail,
  clientOptions?: PostboxClient,
): Promise<string> => {
  const client = clientOptions ?? defaultClient();
  if (!client) {
    throw new Error("Yandex Cloud Postbox is not configured");
  }

  const payload = JSON.stringify({
    FromEmailAddress: email.from ?? env.EMAIL_FROM,
    Destination: { ToAddresses: email.to },
    Content: {
      Simple: {
        Subject: { Data: email.subject, Charset: "UTF-8" },
        Body: { Html: { Data: email.html, Charset: "UTF-8" } },
      },
    },
  });

  const endpoint = new URL(client.endpoint);
  // Preserve a non-empty base path, if a custom endpoint ever has one.
  const path = `${endpoint.pathname.replace(/\/+$/, "")}${SEND_EMAIL_PATH}`;

  const iso = new Date().toISOString();
  const amzDate =
    `${iso.slice(0, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}` +
    `T${iso.slice(11, 13)}${iso.slice(14, 16)}${iso.slice(17, 19)}Z`;

  const response = await fetch(new URL(path, endpoint), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Amz-Date": amzDate,
      Authorization: signV4(client, {
        path,
        host: endpoint.host,
        amzDate,
        payload,
      }),
    },
    body: payload,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Postbox API ${response.status}: ${errorDetail(text)}`);
  }

  const result =
    text === "" ? {} : (JSON.parse(text) as { MessageId?: string });
  logger.info("email.sent_via_postbox", { messageId: result.MessageId });
  return result.MessageId ?? "";
};
