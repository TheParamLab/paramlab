import { afterAll, describe, expect, test } from "bun:test";
import { createHash, createHmac } from "node:crypto";

import { type PostboxClient, sendViaPostbox } from "./postbox";

/**
 * Runs a local Postbox stub and verifies on the server side that the
 * request we send carries a valid AWS SigV4 signature — recomputed from
 * the method, path, headers and body that actually arrived on the wire —
 * and that the JSON body matches the SESv2 SendEmail shape.
 */

const sha256Hex = (data: string): string =>
  createHash("sha256").update(data, "utf8").digest("hex");

const hmac = (key: Buffer | string, data: string): Buffer =>
  createHmac("sha256", key).update(data, "utf8").digest();

type Verification = { ok: true } | { ok: false; error: string };

/** Recomputes the SigV4 signature from what actually arrived on the wire. */
const verifySignature = (
  request: Request,
  body: string,
  client: PostboxClient,
): Verification => {
  const authorizationPattern =
    "^AWS4-HMAC-SHA256 Credential=([^/]+)/(\\d{8})/([^/]+)/ses/aws4_request" +
    ", SignedHeaders=([^,]+), Signature=([0-9a-f]{64})$";
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(new RegExp(authorizationPattern));
  if (!match) {
    return { ok: false, error: `malformed Authorization: ${authorization}` };
  }
  const keyId = match[1] ?? "";
  const dateStamp = match[2] ?? "";
  const region = match[3] ?? "";
  const signedHeaders = match[4] ?? "";
  const signature = match[5] ?? "";

  const contentType = request.headers.get("content-type");
  const host = request.headers.get("host");
  const amzDate = request.headers.get("x-amz-date");
  if (!contentType || !host || !amzDate) {
    return { ok: false, error: "missing signed headers" };
  }
  if (signedHeaders !== "content-type;host;x-amz-date") {
    return { ok: false, error: `unexpected SignedHeaders: ${signedHeaders}` };
  }

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n`;

  const canonicalRequest = [
    "POST",
    new URL(request.url).pathname,
    "", // canonical query string, empty for SendEmail
    canonicalHeaders,
    signedHeaders,
    sha256Hex(body),
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    `${dateStamp}/${region}/ses/aws4_request`,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmac(`AWS4${client.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "ses");
  const signingKey = hmac(kService, "aws4_request");

  const expectedSignature = createHmac("sha256", signingKey)
    .update(stringToSign, "utf8")
    .digest("hex");

  if (signature !== expectedSignature) {
    return { ok: false, error: `signature mismatch: ${signature}` };
  }
  if (keyId !== client.accessKeyId) {
    return { ok: false, error: `unexpected access key id: ${keyId}` };
  }
  return { ok: true };
};

interface CapturedRequest {
  url: string;
  contentType: string | null;
  body: string;
}

const captured: CapturedRequest[] = [];

let respond: { status: number; body: string } = {
  status: 200,
  body: JSON.stringify({ MessageId: "test-message-id" }),
};

const client: PostboxClient = {
  accessKeyId: "test-access-key-id",
  secretAccessKey: "test-secret-access-key",
  endpoint: "http://127.0.0.1:1", // rewritten once the stub picks its port
  region: "ru-central1",
};

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch: async (request): Promise<Response> => {
    const body = await request.text();
    const verification = verifySignature(request, body, client);
    if (!verification.ok) {
      return Response.json(
        { code: "SignatureDoesNotMatch", message: verification.error },
        { status: 403 },
      );
    }
    captured.push({
      url: request.url,
      contentType: request.headers.get("content-type"),
      body,
    });
    return new Response(respond.body, {
      status: respond.status,
      headers: { "Content-Type": "application/json" },
    });
  },
});

client.endpoint = `http://127.0.0.1:${server.port}`;

afterAll(() => {
  server.stop(true);
});

describe("sendViaPostbox", () => {
  test("sends a validly signed SendEmail request", async () => {
    respond = {
      status: 200,
      body: JSON.stringify({ MessageId: "postbox-message-id" }),
    };
    const messageId = await sendViaPostbox(
      {
        html: "<p>Hello</p>",
        subject: "Test message",
        to: ["to@example.com"],
        from: "from@example.com",
      },
      client,
    );
    // A non-2xx would have thrown, so reaching here means the signature
    // verified against the request as it arrived on the wire.
    expect(messageId).toBe("postbox-message-id");
    const last = captured.at(-1);
    if (!last) {
      throw new Error("no request captured");
    }
    expect(new URL(last.url).pathname).toBe("/v2/email/outbound-emails");
    expect(last.contentType).toBe("application/json");
    expect(JSON.parse(last.body)).toEqual({
      FromEmailAddress: "from@example.com",
      Destination: { ToAddresses: ["to@example.com"] },
      Content: {
        Simple: {
          Subject: { Data: "Test message", Charset: "UTF-8" },
          Body: { Html: { Data: "<p>Hello</p>", Charset: "UTF-8" } },
        },
      },
    });
  });

  test("rejects with the provider error detail", async () => {
    respond = {
      status: 400,
      body: JSON.stringify({
        code: "MessageRejected",
        message: "Email address is not verified",
      }),
    };
    await expect(
      sendViaPostbox(
        {
          html: "<p>Hi</p>",
          subject: "Hello",
          to: ["to@example.com"],
          from: "from@example.com",
        },
        client,
      ),
    ).rejects.toThrow("Postbox API 400: Email address is not verified");
  });

  test("rejects with the raw body when the response is not JSON", async () => {
    respond = { status: 502, body: "Bad gateway" };
    await expect(
      sendViaPostbox(
        {
          html: "<p>Hi</p>",
          subject: "Hello",
          to: ["to@example.com"],
          from: "from@example.com",
        },
        client,
      ),
    ).rejects.toThrow("Postbox API 502: Bad gateway");
  });
});
