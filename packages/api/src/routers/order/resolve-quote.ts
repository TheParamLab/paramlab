import { logger } from "@paramlab/config";
import type { db } from "@paramlab/db";
import { and, DeliveryPoint, eq, Part } from "@paramlab/db";
import {
  calcPartPrice,
  type MaterialId,
  partMassFor,
} from "@paramlab/validators";

import {
  ozonCheckClient,
  ozonCheckout,
  ozonConfigured,
} from "../../integrations/ozon-delivery";

/** Фиксированный тариф доставки до ПВЗ, когда Ozon API не настроен или недоступен. */
const FLAT_DELIVERY_RUB = 199;

/** Запас картонной упаковки по каждому измерению, мм. */
const PACKAGE_PADDING_MM = 60;

/**
 * Объемно-весовые характеристики посылки, мм/г. Если известны габариты
 * детали, коробка подбирается под них с запасом на упаковку — иначе
 * фиксированный размер по умолчанию. Один и тот же набор используется и
 * в расчете цены доставки, и при создании отправления.
 */
export function packageDimensions(
  massGrams: number,
  quantity: number,
  size?: readonly [number, number, number] | null,
) {
  if (size) {
    const sorted = [...size].sort((a, b) => b - a);
    return {
      weight_g: Math.max(100, massGrams * quantity + 150),
      length_mm: Math.ceil(sorted[0] ?? 0) + PACKAGE_PADDING_MM,
      width_mm: Math.ceil(sorted[1] ?? 0) + PACKAGE_PADDING_MM,
      // Детали партии складываем стопкой по наименьшему измерению.
      height_mm:
        Math.ceil((sorted[2] ?? 0) * Math.min(quantity, 5)) +
        PACKAGE_PADDING_MM,
    };
  }
  return {
    weight_g: Math.max(100, massGrams * quantity + 150),
    length_mm: 300,
    width_mm: 220,
    height_mm: 150,
  };
}

type Db = typeof db;

/**
 * Серверный расчет заказа: печать по тарифу каталога + доставка до ПВЗ Ozon.
 * Единая точка правды для `order.quote` и `order.create` — клиенту нельзя
 * доверять ни цену, ни выбранный пункт.
 */
export async function resolveQuote(
  database: Db,
  input: {
    userId: string;
    partId: string;
    materialId: MaterialId;
    quantity: number;
    recipientPhone: string;
    deliveryPointId: string;
  },
) {
  const [part, point] = await Promise.all([
    database
      .select()
      .from(Part)
      .where(and(eq(Part.id, input.partId), eq(Part.userId, input.userId)))
      .then((rows) => rows[0]),
    database
      .select()
      .from(DeliveryPoint)
      .where(eq(DeliveryPoint.id, input.deliveryPointId))
      .then((rows) => rows[0]),
  ]);
  if (!part) return { error: "NOT_FOUND" as const };
  if (!point?.active) return { error: "POINT_NOT_FOUND" as const };

  const massGrams = partMassFor(part, input.materialId);
  const size =
    part.sizeX != null && part.sizeY != null && part.sizeZ != null
      ? ([part.sizeX, part.sizeY, part.sizeZ] as const)
      : null;
  const price = calcPartPrice({
    massGrams,
    materialId: input.materialId,
    quantity: input.quantity,
    size,
  });

  const parcelDimensions = packageDimensions(massGrams, input.quantity, size);
  let deliveryRub = FLAT_DELIVERY_RUB;
  let etaDays: number | null = null;
  let estimated = true;

  if (ozonConfigured() && point.shipmentMethodIds.length > 0) {
    try {
      // Ozon доставляет только получателям с аккаунтом на этот телефон.
      const canDeliver = await ozonCheckClient(input.recipientPhone);
      if (!canDeliver) return { error: "DELIVERY_UNAVAILABLE" as const };
      const results = await ozonCheckout({
        recipientPhone: input.recipientPhone,
        deliveryPointId: point.id,
        shipmentMethodId: point.shipmentMethodIds[0] ?? "",
        declaredValueRub: price.total,
        dimensions: parcelDimensions,
      });
      const posting = results[0]?.posting;
      const cost = posting?.estimated_delivery_cost;
      if (results[0]?.error) return { error: "DELIVERY_UNAVAILABLE" as const };
      if (cost) {
        deliveryRub = Math.ceil(Number(cost.amount));
        etaDays = posting?.estimated_delivery_days ?? null;
        estimated = false;
      }
    } catch (error) {
      // Ozon недоступен — оформляем по плоскому тарифу, заказ не должен падать,
      // но сбой интеграции фиксируем, иначе его никогда не заметят.
      logger.warn("ozon.quote_failed", {
        error: error instanceof Error ? error.message : String(error),
        deliveryPointId: input.deliveryPointId,
      });
    }
  }

  return {
    part,
    point,
    massGrams,
    parcelDimensions,
    printRub: price.total,
    deliveryRub,
    payableRub: price.total + deliveryRub,
    deliveryEtaDays: etaDays,
    deliveryEstimated: estimated,
    smallPart: price.smallPart,
  };
}
