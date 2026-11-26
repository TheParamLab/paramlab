import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env, logger } from "@paramlab/config";

// Validate Yandex Object Storage config before creating the client
const accessKeyId = env.YANDEX_STORAGE_ACCESS_KEY_ID;
const secretAccessKey = env.YANDEX_STORAGE_SECRET_ACCESS_KEY;
const bucketName = env.YANDEX_STORAGE_BUCKET;
if (!accessKeyId || !secretAccessKey || !bucketName) {
  throw new Error(
    "Yandex Object Storage is not configured: set YANDEX_STORAGE_ACCESS_KEY_ID, " +
      "YANDEX_STORAGE_SECRET_ACCESS_KEY and YANDEX_STORAGE_BUCKET",
  );
}

// После guard'а тип `bucketName` сужен до string — функции ниже рассчитывают на это.
const BUCKET_NAME = bucketName;

const s3Client = new S3Client({
  region: env.YANDEX_STORAGE_REGION,
  // Иначе SDK подписывает в presigned PUT контрольную сумму пустого тела,
  // и загрузка настоящего файла отклоняется хранилищем.
  requestChecksumCalculation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  // Object Storage понимает оба стиля адресации; path-style
  // (storage.yandexcloud.net/<bucket>/<key>) держит хост стабильным.
  endpoint: env.YANDEX_STORAGE_ENDPOINT,
  forcePathStyle: true,
});

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
    logger.error("S3 upload failed", err, { bucket: BUCKET_NAME, key });
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

/** Тело объекта целиком; `null`, если объекта нет. */
export async function downloadObject(key: string): Promise<Uint8Array | null> {
  try {
    const res = await s3Client.send(
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
    );
    if (!res.Body) return null;
    return await res.Body.transformToByteArray();
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;
    if (status === 404) return null;
    throw error;
  }
}
