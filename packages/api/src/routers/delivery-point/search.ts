import { DeliveryPoint, sql } from "@paramlab/db";
import { z } from "zod";

import { protectedProcedure } from "../../orpc";

/**
 * Поиск пунктов выдачи Ozon в локальном справочнике. Справочник наполняется
 * синхронизацией `deliveryPoint.sync`; поиск идет по городу и адресу.
 *
 * @example client.deliveryPoint.search({ query: "Москва", limit: 20 })
 */
export const search = protectedProcedure
  .input(
    z.object({
      query: z.string().trim().min(2).max(120),
      limit: z.number().int().min(1).max(50).default(20),
    }),
  )
  .handler(async ({ context, input }) => {
    const pattern = `%${input.query.replaceAll("%", "").replaceAll("_", "")}%`;
    const points = await context.db
      .select({
        id: DeliveryPoint.id,
        name: DeliveryPoint.name,
        type: DeliveryPoint.type,
        city: DeliveryPoint.city,
        address: DeliveryPoint.address,
        latitude: DeliveryPoint.latitude,
        longitude: DeliveryPoint.longitude,
        maxWeightGrams: DeliveryPoint.maxWeightGrams,
        maxLengthMm: DeliveryPoint.maxLengthMm,
        maxWidthMm: DeliveryPoint.maxWidthMm,
        maxHeightMm: DeliveryPoint.maxHeightMm,
      })
      .from(DeliveryPoint)
      .where(
        sql`${DeliveryPoint.active}
          and (${DeliveryPoint.city} ilike ${pattern}
            or ${DeliveryPoint.address} ilike ${pattern}
            or ${DeliveryPoint.name} ilike ${pattern})`,
      )
      .orderBy(DeliveryPoint.city, DeliveryPoint.address)
      .limit(input.limit);
    return { points };
  });
