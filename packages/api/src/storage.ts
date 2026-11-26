/**
 * Доступ к файловому хранилищу из процедур — через `context.storage`.
 *
 * `@paramlab/storage` импортируется лениво: модуль создает S3-клиент при
 * загрузке и бросает ошибку без ключей Yandex Object Storage, а они нужны
 * только процедурам с файлами.
 * Тесты подменяют `context.storage` заглушкой.
 */
export interface Storage {
  /**
   * Presigned PUT ровно на `size` байт; тело шлется с
   * `Content-Type: application/octet-stream`.
   */
  uploadUrl(key: string, size: number): Promise<string>;
  /** Размер загруженного объекта в байтах; `null`, если его нет. */
  objectSize(key: string): Promise<number | null>;
  /** Presigned GET, действует час. */
  downloadUrl(key: string): Promise<string>;
  /** Тело объекта; `null`, если его нет или он больше указанного размера. */
  downloadObject(key: string, maxBytes: number): Promise<Uint8Array | null>;
  /** Запись серверного объекта без выдачи ссылки на загрузку. */
  storeObject(key: string, bytes: Uint8Array): Promise<void>;
}

export const storage: Storage = {
  async uploadUrl(key, size) {
    const { createPresignedUrl } = await import("@paramlab/storage");
    return createPresignedUrl(key, size);
  },
  async objectSize(key) {
    const { getObjectSize } = await import("@paramlab/storage");
    return getObjectSize(key);
  },
  async downloadUrl(key) {
    const { getDownloadUrl } = await import("@paramlab/storage");
    return getDownloadUrl(key);
  },
  async downloadObject(key, maxBytes) {
    const { downloadObject } = await import("@paramlab/storage");
    return downloadObject(key, maxBytes);
  },
  async storeObject(key, bytes) {
    const { uploadBufferToS3 } = await import("@paramlab/storage");
    await uploadBufferToS3(key, bytes);
  },
};
