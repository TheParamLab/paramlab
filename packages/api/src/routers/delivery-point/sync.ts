import { DeliveryPoint, isNull, lt, or, sql } from "@paramlab/db";

import {
  ozonConfigured,
  ozonDeliveryPointInfo,
  ozonListDeliveryPoints,
} from "../../integrations/ozon-delivery";
import { adminProcedure } from "../../orpc";

const BATCH = 500;
const MAX_PAGES = 400;

/**
 * Инкрементальная синхронизация справочника ПВЗ Ozon в локальную БД.
 * Идем курсором по /v1/delivery-point/list, затем дотягиваем адреса,
 * координаты и ограничения через /v1/delivery-point/info пачками до 1000.
 * Upsert по id — повторный запуск безопасен.
 */
export const sync = adminProcedure
  .errors({
    UNAVAILABLE: { message: "Ozon Delivery API не настроен" },
  })
  .handler(async ({ context, errors }) => {
    if (!ozonConfigured()) throw errors.UNAVAILABLE();

    // Все точки, не обновленные в этом прогоне, в конце деактивируем.
    const syncStartedAt = new Date();
    let cursor: string | undefined;
    let synced = 0;
    for (let page = 0; page < MAX_PAGES; page++) {
      const list = await ozonListDeliveryPoints({ cursor, limit: BATCH });
      const ids = list.delivery_points.map((p) => String(p.delivery_point_id));
      if (ids.length === 0) break;

      const methodById = new Map(
        list.delivery_points.map((p) => [
          String(p.delivery_point_id),
          (Array.isArray(p.shipment_method_ids)
            ? p.shipment_method_ids
            : [p.shipment_method_ids]
          ).map(String),
        ]),
      );

      for (let i = 0; i < ids.length; i += 1000) {
        const chunk = ids.slice(i, i + 1000);
        const info = await ozonDeliveryPointInfo(chunk);
        for (const point of info.delivery_points) {
          const id = String(point.delivery_point_id);
          const addressParts = point.full_address.split(",");
          await context.db
            .insert(DeliveryPoint)
            .values({
              id,
              shipmentMethodIds:
                methodById.get(String(point.delivery_point_id)) ?? [],
              name: point.name,
              type: point.type,
              city: addressParts[1]?.trim().replace(/^г\.\s*/, "") ?? null,
              address: point.full_address,
              latitude: point.coordinates?.latitude ?? null,
              longitude: point.coordinates?.longitude ?? null,
              maxWeightGrams: point.restrictions?.max_weight_g ?? null,
              maxLengthMm: point.restrictions?.max_length_mm ?? null,
              maxWidthMm: point.restrictions?.max_width_mm ?? null,
              maxHeightMm: point.restrictions?.max_height_mm ?? null,
              active: point.is_active,
              raw: point as unknown as Record<string, unknown>,
              syncedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: DeliveryPoint.id,
              set: {
                name: sql`excluded.name`,
                type: sql`excluded.type`,
                city: sql`excluded.city`,
                address: sql`excluded.address`,
                latitude: sql`excluded.latitude`,
                longitude: sql`excluded.longitude`,
                maxWeightGrams: sql`excluded.max_weight_grams`,
                maxLengthMm: sql`excluded.max_length_mm`,
                maxWidthMm: sql`excluded.max_width_mm`,
                maxHeightMm: sql`excluded.max_height_mm`,
                active: sql`excluded.active`,
                raw: sql`excluded.raw`,
                syncedAt: sql`excluded.synced_at`,
                shipmentMethodIds: sql`excluded.shipment_method_ids`,
              },
            });
          synced++;
        }
      }

      if (!list.next_cursor) break;
      cursor = list.next_cursor;
    }

    // Точки, которых Ozon больше не отдает (или закрыл), деактивируем,
    // чтобы их нельзя было выбрать при оформлении заказа.
    const deactivated = await context.db
      .update(DeliveryPoint)
      .set({ active: false })
      .where(
        or(
          lt(DeliveryPoint.syncedAt, syncStartedAt),
          isNull(DeliveryPoint.syncedAt),
        ),
      )
      .returning({ id: DeliveryPoint.id });

    return { synced, deactivated: deactivated.length };
  });
