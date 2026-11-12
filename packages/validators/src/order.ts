import { z } from "zod";

import { MATERIAL_IDS, ORDER_QUANTITY, PART_MASS } from "./catalog";

export const PART_FORMATS = ["stl", "step", "3mf"] as const;
export type PartFormat = (typeof PART_FORMATS)[number];

/** Максимальный размер файла модели — 100 МБ. */
export const PART_FILE_MAX_BYTES = 100 * 1024 * 1024;

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
  massGrams: z.number().int().min(PART_MASS.min).max(PART_MASS.max),
  materialId: z.enum(MATERIAL_IDS),
});

export type CreatePartInput = z.input<typeof createPartSchema>;

export const createOrderSchema = z.object({
  partId: z.uuid(),
  materialId: z.enum(MATERIAL_IDS),
  quantity: z.number().int().min(ORDER_QUANTITY.min).max(ORDER_QUANTITY.max),
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

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Ожидает оплаты",
  paid: "Оплачен · В очереди на станок",
  printing: "Печатается в термокамере",
  quality_check: "ОТК и фотоконтроль",
  shipped: "Передан в доставку",
  ready_for_pickup: "Готов к выдаче в ПВЗ",
  cancelled: "Отменен",
};
