import type { Session } from "@paramlab/auth";
import { type Database, user } from "@paramlab/db";
import { createTestDb } from "@paramlab/db/testing";

import { createORPCContext } from "../src/orpc";

export const ADMIN_EMAIL = "admin@test.local";

/** Inserts a user row and returns a matching Better Auth session. */
export async function createSession(
  db: Database,
  overrides: { email?: string; name?: string; role?: string } = {},
): Promise<Session> {
  const now = new Date();
  const [row] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: overrides.name ?? "Test User",
      email: overrides.email ?? `${crypto.randomUUID()}@test.local`,
      role: overrides.role ?? "user",
    })
    .returning();
  if (!row) throw new Error("Failed to insert test user");

  return {
    user: row,
    session: {
      id: crypto.randomUUID(),
      userId: row.id,
      token: crypto.randomUUID(),
      expiresAt: new Date(now.getTime() + 60_000),
      createdAt: now,
      updatedAt: now,
    },
  };
}

/** Fresh PGlite database plus a context factory bound to it. */
export async function setupTestApi() {
  const { db, close } = await createTestDb();

  /** «Загруженные» объекты: ключ → размер. Тест кладет их через `upload`. */
  const objects = new Map<string, number>();
  /** Тела объектов для серверного разбора: ключ → байты. */
  const contents = new Map<string, Uint8Array>();
  const upload = (key: string, size: number, content?: Uint8Array) => {
    objects.set(key, size);
    if (content) contents.set(key, content);
    else contents.delete(key);
  };

  const context = (session: Session | null = null) => ({
    ...createORPCContext({ headers: new Headers(), session }),
    db,
    // Хранилище без S3: ссылки-заглушки и объекты в памяти.
    storage: {
      uploadUrl: async (key: string, size: number) =>
        `https://s3.test/put/${key}?size=${size}`,
      objectSize: async (key: string) => objects.get(key) ?? null,
      downloadUrl: async (key: string) => `https://s3.test/get/${key}`,
      downloadObject: async (key: string, maxBytes: number) => {
        const bytes = contents.get(key);
        return bytes && bytes.byteLength <= maxBytes ? bytes : null;
      },
      storeObject: async (key: string, bytes: Uint8Array) => {
        upload(key, bytes.byteLength, bytes.slice());
      },
    },
  });

  return { db, close, context, upload };
}
