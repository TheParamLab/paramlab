import type { MaterialId, OrderStatus } from "@acme/validators";
import { relations, sql } from "drizzle-orm";
import { index, pgTable } from "drizzle-orm/pg-core";

import { user } from "../auth";
import { Part } from "./part";

export const Order = pgTable(
  "orders",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    /** Короткий номер заказа для клиента и производства. */
    number: t
      .integer()
      .notNull()
      .generatedAlwaysAsIdentity({ startWith: 1001 }),
    userId: t
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: t.text().$type<OrderStatus>().notNull().default("pending_payment"),
    /** Стоимость печати без доставки, ₽. */
    totalRub: t.integer().notNull(),
    carrier: t.text(),
    trackingNumber: t.text(),
    trackingUrl: t.text(),
    createdAt: t.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .$onUpdateFn(() => sql`now()`),
  }),
  (t) => [index("orders_user_id_idx").on(t.userId)],
);

/**
 * Позиция заказа. Название, файл модели, масса и цена — снимок на момент
 * оформления: производство печатает по нему, даже если деталь удалена.
 */
export const OrderItem = pgTable(
  "order_items",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    orderId: t
      .uuid()
      .notNull()
      .references(() => Order.id, { onDelete: "cascade" }),
    /** `null`, если клиент удалил деталь из библиотеки. */
    partId: t.uuid().references(() => Part.id, { onDelete: "set null" }),
    partName: t.varchar({ length: 120 }).notNull(),
    /** Ключ файла модели в S3. */
    fileKey: t.text().notNull(),
    fileName: t.varchar({ length: 255 }).notNull(),
    materialId: t.text().$type<MaterialId>().notNull(),
    quantity: t.integer().notNull(),
    massGrams: t.integer().notNull(),
    priceRub: t.integer().notNull(),
  }),
  (t) => [
    index("order_items_order_id_idx").on(t.orderId),
    index("order_items_part_id_idx").on(t.partId),
  ],
);

/** История этапов заказа — источник дат и фото для трекера. */
export const OrderEvent = pgTable(
  "order_events",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    orderId: t
      .uuid()
      .notNull()
      .references(() => Order.id, { onDelete: "cascade" }),
    status: t.text().$type<OrderStatus>().notNull(),
    note: t.text(),
    /** Ключ фото в S3 (фотоконтроль на этапе ОТК). */
    photoKey: t.text(),
    createdAt: t.timestamp({ withTimezone: true }).defaultNow().notNull(),
    /**
     * Порядок записи событий. Время может совпасть или сдвинуться назад,
     * поэтому история сортируется по этому номеру.
     */
    seq: t
      .bigint({ mode: "number" })
      .notNull()
      .generatedByDefaultAsIdentity({ name: "order_events_seq_seq" }),
  }),
  (t) => [index("order_events_order_id_idx").on(t.orderId)],
);

export const orderRelations = relations(Order, ({ many }) => ({
  items: many(OrderItem),
  events: many(OrderEvent),
}));

export const orderItemRelations = relations(OrderItem, ({ one }) => ({
  order: one(Order, { fields: [OrderItem.orderId], references: [Order.id] }),
  part: one(Part, { fields: [OrderItem.partId], references: [Part.id] }),
}));

export const orderEventRelations = relations(OrderEvent, ({ one }) => ({
  order: one(Order, { fields: [OrderEvent.orderId], references: [Order.id] }),
}));
