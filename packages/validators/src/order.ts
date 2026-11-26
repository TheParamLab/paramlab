import { z } from "zod";

import { MATERIAL_IDS, ORDER_QUANTITY, PART_MASS } from "./catalog";

export const PART_FORMATS = ["stl", "step", "3mf"] as const;
export type PartFormat = (typeof PART_FORMATS)[number];

/** Максимальный размер файла модели — 100 МБ. */
export const PART_FILE_MAX_BYTES = 100 * 1024 * 1024;

/** Максимальный размер PNG-превью — 2 МБ. */
export const PART_PREVIEW_MAX_BYTES = 2 * 1024 * 1024;

/** Формат модели по имени файла; `null` для неподдерживаемых расширений. */
export function partFormatFromFileName(fileName: string): PartFormat | null {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "stl" || extension === "3mf") return extension;
  if (extension === "step" || extension === "stp") return "step";
  return null;
}

export const createPartSchema = z.object({
  name: z.string().trim().min(1, "Укажите название детали").max(120),
  fileKey: z.string().min(1).max(512),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(PART_FILE_MAX_BYTES),
  previewKey: z.string().max(512).nullable().default(null),
  /** Габариты X × Y × Z, мм — если их удалось прочитать из файла. */
  size: z
    .tuple([
      z.number().positive(),
      z.number().positive(),
      z.number().positive(),
    ])
    .nullable()
    .default(null),
  /** Объем модели, см³ — если его удалось прочитать из файла. */
  volumeCm3: z.number().positive().max(1_000_000).nullable().default(null),
  massGrams: z.number().int().min(PART_MASS.min).max(PART_MASS.max),
  materialId: z.enum(MATERIAL_IDS),
});

export type CreatePartInput = z.input<typeof createPartSchema>;

/** Ozon доставляет только на российский мобильный номер +79XXXXXXXXX. */
export const recipientPhoneSchema = z
  .string()
  .trim()
  .regex(/^\+79\d{9}$/, "Укажите мобильный телефон в формате +79XXXXXXXXX");

export function normalizeRecipientPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("9")) return `+7${digits}`;
  if (digits.length === 11 && digits.startsWith("8")) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.length === 11 && digits.startsWith("7")) return `+${digits}`;
  return value.trim();
}

export const createOrderSchema = z.object({
  partId: z.uuid(),
  materialId: z.enum(MATERIAL_IDS),
  quantity: z.number().int().min(ORDER_QUANTITY.min).max(ORDER_QUANTITY.max),
  recipientName: z.string().trim().min(2).max(120),
  recipientPhone: recipientPhoneSchema,
  deliveryPointId: z.string().min(1).max(32),
});

/**
 * Этапы заказа в порядке прохождения. `pending_payment` — до оплаты,
 * дальше пять этапов трекера. `cancelled` стоит вне цепочки.
 */
export const ORDER_STAGES = [
  "pending_payment",
  "paid",
  "printing",
  "quality_check",
  "shipped",
  "ready_for_pickup",
] as const;

export const ORDER_STATUSES = [...ORDER_STAGES, "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Статусы, при которых заказ ещё в производстве или в доставке. */
export const ACTIVE_ORDER_STATUSES = [
  "paid",
  "printing",
  "quality_check",
  "shipped",
] as const satisfies readonly OrderStatus[];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Ожидает оплаты",
  paid: "Оплачен · В очереди на станок",
  printing: "Печатается в термокамере",
  quality_check: "ОТК и фотоконтроль",
  shipped: "Передан в доставку",
  ready_for_pickup: "Готов к выдаче в ПВЗ",
  cancelled: "Отменен",
};
