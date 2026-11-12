import type { MaterialId, PartFormat } from "@acme/validators";
import { sql } from "drizzle-orm";
import { index, pgTable } from "drizzle-orm/pg-core";

import { user } from "../auth";

/** Деталь в библиотеке клиента: загруженный файл или модель из генератора. */
export const Part = pgTable(
  "parts",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    userId: t
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: t.varchar({ length: 120 }).notNull(),
    source: t.text().$type<"upload" | "generator">().notNull(),
    /** Ключ файла модели в S3. */
    fileKey: t.text().notNull(),
    fileName: t.varchar({ length: 255 }).notNull(),
    fileSize: t.integer().notNull(),
    format: t.text().$type<PartFormat>().notNull(),
    /** Ключ PNG-превью в S3. */
    previewKey: t.text(),
    /** Габариты, мм. */
    sizeX: t.real(),
    sizeY: t.real(),
    sizeZ: t.real(),
    /** Расчетная масса одной детали, г. */
    massGrams: t.integer().notNull(),
    /** Материал по умолчанию для новых заказов. */
    materialId: t.text().$type<MaterialId>().notNull(),
    /** Параметры генератора (тип детали и размеры) для source = generator. */
    generatorParams: t.jsonb().$type<Record<string, unknown>>(),
    createdAt: t.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .$onUpdateFn(() => sql`now()`),
  }),
  (t) => [index("parts_user_id_idx").on(t.userId)],
);
