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
  /** Тело объекта целиком; `null`, если его нет. */
  downloadObject(key: string): Promise<Uint8Array | null>;
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
  async downloadObject(key) {
    const { downloadObject } = await import("@paramlab/storage");
    return downloadObject(key);
  },
};
