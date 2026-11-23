export function normalizeAuthCallback(
  callback: string | null,
  origin: string,
): string | null {
  if (!callback?.trim()) return null;

  try {
    const url = new URL(callback, origin);
    if (
      url.origin !== origin ||
      !url.pathname.startsWith("/") ||
      url.pathname.startsWith("//")
    ) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
