import type { MaterialId, OrderStatus } from "@paramlab/validators";
import { relations, sql } from "drizzle-orm";
import { index, pgTable, uniqueIndex } from "drizzle-orm/pg-core";

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
    /** Стоимость доставки до ПВЗ Ozon, ₽. */
    deliveryRub: t.integer().notNull().default(0),
    /** Полная сумма к оплате: печать + доставка, ₽. */
    payableRub: t.integer().notNull().default(0),
    deliveryMethod: t.text().$type<"ozon_pvz">(),
    /** ID пункта выдачи Ozon передается строкой: это int64, небезопасный для JS number. */
    deliveryPointId: t.text(),
    deliveryPointName: t.varchar({ length: 255 }),
    deliveryPointAddress: t.text(),
    deliveryCity: t.varchar({ length: 120 }),
    /** Телефон строго +7XXXXXXXXXX — его проверяет Ozon перед доставкой. */
    recipientPhone: t.varchar({ length: 16 }),
    recipientName: t.varchar({ length: 120 }),
    deliveryEtaDays: t.integer(),
    /** Габариты и вес посылки, использованные при расчете доставки. */
    parcelDimensions: t.jsonb().$type<{
      weight_g: number;
      length_mm: number;
      width_mm: number;
      height_mm: number;
    }>(),
    paymentProvider: t.text().$type<"yookassa">(),
    paymentId: t.text(),
    paymentUrl: t.text(),
    paidAt: t.timestamp({ withTimezone: true }),
    /** ID заказа в Ozon Delivery API после создания отправления. */
    ozonOrderId: t.text(),
    ozonPostingNumber: t.text(),
    carrier: t.text(),
    trackingNumber: t.text(),
    trackingUrl: t.text(),
    createdAt: t.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .$onUpdateFn(() => sql`now()`),
  }),
  (t) => [
    index("orders_user_id_idx").on(t.userId),
    // Один платеж — один заказ: webhook ищет заказ по paymentId.
    uniqueIndex("orders_payment_id_idx").on(t.paymentId),
  ],
);

/** Локальный справочник пунктов выдачи Ozon. Обновляется фоновой синхронизацией. */
export const DeliveryPoint = pgTable(
  "delivery_points",
  (t) => ({
    /** ID Ozon как строка: 16-значный int64 нельзя безопасно хранить в JS number. */
    id: t.text().primaryKey(),
    /** Методы доставки кабинета Ozon, которыми пункт доступен. */
    shipmentMethodIds: t.jsonb().$type<string[]>().notNull().default([]),
    name: t.varchar({ length: 255 }),
    type: t.varchar({ length: 80 }),
    city: t.varchar({ length: 120 }),
    region: t.varchar({ length: 120 }),
    address: t.text().notNull(),
    postalCode: t.varchar({ length: 20 }),
    latitude: t.real(),
    longitude: t.real(),
    maxWeightGrams: t.integer(),
    maxLengthMm: t.integer(),
    maxWidthMm: t.integer(),
    maxHeightMm: t.integer(),
    active: t.boolean().notNull().default(true),
    raw: t.jsonb().$type<Record<string, unknown>>(),
    syncedAt: t.timestamp({ withTimezone: true }),
    createdAt: t.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .$onUpdateFn(() => sql`now()`),
  }),
  (t) => [
    index("delivery_points_city_idx").on(t.city),
    index("delivery_points_active_idx").on(t.active),
  ],
);

/** Журнал webhook-событий платежного провайдера для аудита и идемпотентности. */
export const PaymentEvent = pgTable(
  "payment_events",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    provider: t.text().$type<"yookassa">().notNull(),
    paymentId: t.text().notNull(),
    event: t.text().notNull(),
    payload: t.jsonb().$type<Record<string, unknown>>().notNull(),
    createdAt: t.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (t) => [
    uniqueIndex("payment_events_provider_payment_event_idx").on(
      t.provider,
      t.paymentId,
      t.event,
    ),
  ],
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
