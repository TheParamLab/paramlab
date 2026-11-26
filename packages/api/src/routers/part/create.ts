import { logger } from "@paramlab/config";
import { Part } from "@paramlab/db";
import {
  createPartSchema,
  estimateMassFromVolume,
  parseStl,
  partFormatFromFileName,
  STL_SERVER_PARSE_MAX_BYTES,
} from "@paramlab/validators";

import { protectedProcedure } from "../../orpc";
import { partKeyPrefix } from "./request-upload";

/**
 * Сохранить загруженную модель в библиотеке деталей пользователя.
 * Ключи файлов должны быть получены из `part.requestUpload`, а сам файл —
 * уже загружен: наличие и размер объекта проверяются в хранилище.
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
    // Расширение ключа задает `requestUpload` — оно должно совпасть с именем.
    if (
      !format ||
      !input.fileKey.startsWith(prefix) ||
      !input.fileKey.endsWith(`.${format}`) ||
      (input.previewKey &&
        !(
          input.previewKey.startsWith(prefix) &&
          input.previewKey.endsWith(".png")
        ))
    ) {
      throw errors.BAD_REQUEST();
    }

    let fileKey = input.fileKey;
    const [fileSize, previewSize] = await Promise.all([
      context.storage.objectSize(input.fileKey),
      input.previewKey ? context.storage.objectSize(input.previewKey) : null,
    ]);
    if (fileSize == null || fileSize !== input.fileSize) {
      throw errors.BAD_REQUEST();
    }

    // Объем храним, только если масса совпадает с расчетом по нему: массу,
    // исправленную вручную, под другой материал не пересчитываем.
    // Для STL ниже перезаписывается расчетом из самого файла.
    let size = input.size;
    let volumeCm3 =
      input.volumeCm3 != null &&
      estimateMassFromVolume(input.volumeCm3, input.materialId) ===
        input.massGrams
        ? input.volumeCm3
        : null;
    let massGrams = input.massGrams;

    // Цена STL зависит только от измерений, полученных из самого файла.
    if (format === "stl") {
      if (fileSize > STL_SERVER_PARSE_MAX_BYTES) throw errors.BAD_REQUEST();

      let bytes: Uint8Array | null;
      try {
        bytes = await context.storage.downloadObject(fileKey, fileSize);
      } catch (error) {
        logger.warn("part.analyze_failed", {
          error: error instanceof Error ? error.message : String(error),
          fileKey,
          fileSize,
          userId: context.session.user.id,
        });
        throw errors.BAD_REQUEST();
      }
      if (!bytes || bytes.byteLength !== fileSize) throw errors.BAD_REQUEST();
      const mesh = parseStl(toArrayBuffer(bytes));
      if (!mesh) throw errors.BAD_REQUEST();

      // Ссылку для загрузки можно использовать повторно. Заказ ссылается
      // на проверенные байты под ключом, для которого PUT-ссылок нет.
      fileKey = `verified-parts/${crypto.randomUUID()}.stl`;
      await context.storage.storeObject(fileKey, bytes);
      size = mesh.size;
      volumeCm3 = mesh.volumeCm3;
      massGrams = estimateMassFromVolume(mesh.volumeCm3, input.materialId);
    }

    const [part] = await context.db
      .insert(Part)
      .values({
        userId: context.session.user.id,
        name: input.name,
        source: "upload",
        fileKey,
        fileName: input.fileName,
        fileSize,
        format,
        // Превью необязательно: если оно не загрузилось, деталь без картинки.
        previewKey: previewSize == null ? null : input.previewKey,
        sizeX: size?.[0],
        sizeY: size?.[1],
        sizeZ: size?.[2],
        volumeCm3,
        massGrams,
        materialId: input.materialId,
      })
      .returning();

    if (!part) throw new Error("Failed to insert part");
    return part;
  });

/** `transformToByteArray` может вернуть вид на больший пул — отрезаем точно. */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}
