/**
 * Доступ к файловому хранилищу из процедур — через `context.storage`.
 *
 * `@acme/storage` импортируется лениво: модуль создает S3-клиент при загрузке
 * и бросает ошибку без AWS-ключей, а они нужны только процедурам с файлами.
 * Тесты подменяют `context.storage` заглушкой.
 */
export interface Storage {
  /** Presigned PUT; тело шлется с `Content-Type: application/octet-stream`. */
  uploadUrl(key: string): Promise<string>;
  /** Presigned GET, действует час. */
  downloadUrl(key: string): Promise<string>;
}

export const storage: Storage = {
  async uploadUrl(key) {
    const { createPresignedUrl } = await import("@acme/storage");
    return createPresignedUrl(key);
  },
  async downloadUrl(key) {
    const { getDownloadUrl } = await import("@acme/storage");
    return getDownloadUrl(key);
  },
};
