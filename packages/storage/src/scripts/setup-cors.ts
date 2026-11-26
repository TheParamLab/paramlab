import type { GetBucketCorsCommandOutput } from "@aws-sdk/client-s3";
import {
  GetBucketCorsCommand,
  PutBucketCorsCommand,
  S3Client,
} from "@aws-sdk/client-s3";

/**
 * `bun storage:cors`: применяет CORS-конфигурацию к бакету Object Storage.
 *
 * Без нее браузер блокирует прямые загрузки по presigned PUT: preflight
 * OPTIONS приходит без `Access-Control-Allow-Origin`, и fetch с paramlab.ru
 * не проходит. CORS живет на стороне бакета, а не в коде приложения, поэтому
 * это разовая операция — как миграции для схемы БД.
 *
 * Plain console output и `process.env` — как в `packages/db/src/scripts`:
 * это CLI для человека, он не должен требовать сборки `@paramlab/config`.
 */
const accessKeyId = process.env.YANDEX_STORAGE_ACCESS_KEY_ID;
const secretAccessKey = process.env.YANDEX_STORAGE_SECRET_ACCESS_KEY;
const bucket = process.env.YANDEX_STORAGE_BUCKET;
const endpoint =
  process.env.YANDEX_STORAGE_ENDPOINT ?? "https://storage.yandexcloud.net";
const region = process.env.YANDEX_STORAGE_REGION ?? "ru-central1";

if (!accessKeyId || !secretAccessKey || !bucket) {
  console.error(
    "Set YANDEX_STORAGE_ACCESS_KEY_ID, YANDEX_STORAGE_SECRET_ACCESS_KEY " +
      "and YANDEX_STORAGE_BUCKET first (see .env.example).",
  );
  process.exit(1);
}

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

const cors = {
  CORSRules: [
    {
      // Продовые origin'ы плюс локальная разработка. Другие домены
      // объект не скачают и не загрузят из браузера, но серверные
      // запросы CORS не ограничивает — это только браузерная политика.
      AllowedOrigins: [
        "https://paramlab.ru",
        "https://www.paramlab.ru",
        "http://localhost:3000",
      ],
      // PUT — presigned-загрузка файлов из браузера; GET/HEAD — скачивание
      // по presigned URL (превью моделей, вложения).
      AllowedMethods: ["PUT", "GET", "HEAD"],
      // Браузер сам выставляет Content-Length / Content-Type, а они входят
      // в подпись presigned URL — отклонять их нельзя.
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3600,
    },
  ],
};

async function main() {
  console.log(`Applying CORS to bucket '${bucket}' at ${endpoint} ...`);
  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: cors,
      ChecksumAlgorithm: "MD5",
    }),
  );
  // Object Storage консистентен не сразу: GET сразу после PUT может еще
  // отвечать NoSuchCORSConfiguration — дочитываем с ретраями.
  let current: GetBucketCorsCommandOutput;
  for (let attempt = 0; ; attempt++) {
    try {
      current = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
      break;
    } catch (err) {
      // Ретраим только гонку консистентности: ошибки доступа и сети
      // должны падать сразу, а не после пяти попыток.
      const name = (err as { name?: string }).name;
      if (name !== "NoSuchCORSConfiguration" || attempt === 4) throw err;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  console.log("CORS applied. Current configuration:");
  console.log(JSON.stringify(current.CORSRules, null, 2));
}

main().catch((err: unknown) => {
  const e = err as Error;
  console.error(`Failed to apply CORS: ${e?.message ?? String(err)}`);
  process.exit(1);
});
