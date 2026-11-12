import {
  PART_FILE_MAX_BYTES,
  PART_PREVIEW_MAX_BYTES,
  partFormatFromFileName,
} from "@acme/validators";
import { z } from "zod";

import { protectedProcedure } from "../../orpc";

/** Префикс ключей S3, в который пользователь может загружать свои модели. */
export function partKeyPrefix(userId: string) {
  return `parts/${userId}/`;
}

/**
 * Выдать presigned-ссылки для загрузки файла модели (и PNG-превью) в S3.
 * Файл отправляется методом PUT с `Content-Type: application/octet-stream`,
 * затем ключи передаются в `part.create`.
 *
 * Размеры ограничены здесь и входят в подпись ссылки: хранилище отклонит
 * тело другого размера, поэтому лимит нельзя обойти прямой загрузкой.
 *
 * @example client.part.requestUpload({ fileName: "bushing.stl", fileSize })
 */
export const requestUpload = protectedProcedure
  .errors({
    BAD_REQUEST: { message: "Поддерживаются файлы STL, STEP и 3MF" },
  })
  .input(
    z.object({
      fileName: z.string().min(1).max(255),
      fileSize: z.number().int().positive().max(PART_FILE_MAX_BYTES),
      /** Размер PNG-превью; без него ссылка на превью не выдается. */
      previewSize: z
        .number()
        .int()
        .positive()
        .max(PART_PREVIEW_MAX_BYTES)
        .optional(),
    }),
  )
  .handler(async ({ context, input, errors }) => {
    const format = partFormatFromFileName(input.fileName);
    if (!format) throw errors.BAD_REQUEST();

    const base = partKeyPrefix(context.session.user.id) + crypto.randomUUID();
    const fileKey = `${base}.${format}`;
    const previewKey = `${base}.png`;

    return {
      file: {
        key: fileKey,
        url: await context.storage.uploadUrl(fileKey, input.fileSize),
      },
      preview: input.previewSize
        ? {
            key: previewKey,
            url: await context.storage.uploadUrl(previewKey, input.previewSize),
          }
        : null,
    };
  });
