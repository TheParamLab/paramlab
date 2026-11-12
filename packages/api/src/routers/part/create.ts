import { Part } from "@acme/db";
import {
  createPartSchema,
  estimateMassFromVolume,
  partFormatFromFileName,
} from "@acme/validators";

import { protectedProcedure } from "../../orpc";
import { partKeyPrefix } from "./request-upload";

/**
 * Сохранить загруженную модель в библиотеке деталей пользователя.
 * Ключи файлов должны быть получены из `part.requestUpload`.
 *
 * @example client.part.create({ name, fileKey, fileName, fileSize, massGrams, materialId })
 */
export const create = protectedProcedure
  .errors({
    BAD_REQUEST: { message: "Файл модели не найден или не поддерживается" },
  })
  .input(createPartSchema)
  .handler(async ({ context, input, errors }) => {
    const prefix = partKeyPrefix(context.session.user.id);
    const format = partFormatFromFileName(input.fileName);
    // Чужие ключи не принимаем: иначе можно привязать к себе чужой файл.
    if (
      !format ||
      !input.fileKey.startsWith(prefix) ||
      (input.previewKey && !input.previewKey.startsWith(prefix))
    ) {
      throw errors.BAD_REQUEST();
    }

    // Объем храним, только если масса совпадает с расчетом по нему: массу,
    // исправленную вручную, под другой материал не пересчитываем.
    const volumeCm3 =
      input.volumeCm3 != null &&
      estimateMassFromVolume(input.volumeCm3, input.materialId) ===
        input.massGrams
        ? input.volumeCm3
        : null;

    const [part] = await context.db
      .insert(Part)
      .values({
        userId: context.session.user.id,
        name: input.name,
        source: "upload",
        fileKey: input.fileKey,
        fileName: input.fileName,
        fileSize: input.fileSize,
        format,
        previewKey: input.previewKey,
        sizeX: input.size?.[0],
        sizeY: input.size?.[1],
        sizeZ: input.size?.[2],
        volumeCm3,
        massGrams: input.massGrams,
        materialId: input.materialId,
      })
      .returning();

    if (!part) throw new Error("Failed to insert part");
    return part;
  });
