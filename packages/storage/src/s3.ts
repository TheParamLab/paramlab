import { env } from "@acme/config";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Endpoint = env.AWS_S3_ENDPOINT;
const s3ForcePathStyle = env.AWS_S3_FORCE_PATH_STYLE !== "false";

// Validate AWS credentials before creating the client
const accessKeyId = env.AWS_ACCESS_KEY_ID;
const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;
if (!accessKeyId || !secretAccessKey) {
  throw new Error(
    "AWS credentials (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY) are required",
  );
}

const s3Client = new S3Client({
  region: env.AWS_REGION,
  // Иначе SDK подписывает в presigned PUT контрольную сумму пустого тела,
  // и загрузка настоящего файла отклоняется хранилищем.
  requestChecksumCalculation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  ...(s3Endpoint
    ? {
        endpoint: s3Endpoint,
        forcePathStyle: s3ForcePathStyle, // MinIO-friendly by default when endpoint provided
      }
    : {}),
});

const BUCKET_NAME = env.AWS_S3_BUCKET;

/**
 * Presigned PUT. С `contentLength` размер тела входит в подпись: хранилище
 * отклонит загрузку другого размера. Ссылка живет 15 минут — до ее
 * истечения по ней можно записать объект повторно.
 */
export async function createPresignedUrl(
  key: string,
  contentLength?: number,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: "application/octet-stream",
    ContentLength: contentLength,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes
}

export function generateS3Key(originalKey: string, temporary = false): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const prefix = temporary ? "temp" : "uploads";

  return `${prefix}/${timestamp}-${randomId}-${originalKey}`;
}

export async function uploadBufferToS3(
  key: string,
  body: Buffer | Uint8Array,
  contentType?: string,
): Promise<{ key: string; bucket: string; etag?: string }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType ?? "application/octet-stream",
  });
  try {
    const res = await s3Client.send(command);
    return { key, bucket: BUCKET_NAME, etag: res.ETag };
  } catch (err) {
    const e = err as Error;
    console.error("S3 upload failed", {
      bucket: BUCKET_NAME,
      key,
      error: e?.message ?? String(err),
      stack: e?.stack,
    });
    throw new Error(
      `Failed to upload to S3 bucket '${BUCKET_NAME}' key '${key}': ${e?.message ?? String(err)}`,
    );
  }
}

export async function getDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
}

/** Размер объекта в байтах; `null`, если объекта нет. */
export async function getObjectSize(key: string): Promise<number | null> {
  try {
    const head = await s3Client.send(
      new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
    );
    return head.ContentLength ?? null;
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;
    if (status === 404) return null;
    throw error;
  }
}
