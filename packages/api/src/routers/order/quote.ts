import { createOrderSchema } from "@paramlab/validators";

import { protectedProcedure } from "../../orpc";
import { resolveQuote } from "./resolve-quote";

/**
 * Предварительный расчет заказа до оплаты: стоимость печати на сервере,
 * стоимость и срок доставки до выбранного ПВЗ. Если Ozon Delivery API не
 * настроен, применяется плоский тариф 199 ₽ — он честно показывается как
 * оценка.
 */
export const quote = protectedProcedure
  .errors({
    NOT_FOUND: { message: "Деталь или пункт выдачи не найден" },
    DELIVERY_UNAVAILABLE: {
      message: "Доставка в этот пункт недоступна, выберите другой",
    },
  })
  .input(createOrderSchema)
  .handler(async ({ context, input, errors }) => {
    const resolved = await resolveQuote(context.db, {
      userId: context.session.user.id,
      ...input,
    });
    if (resolved.error === "DELIVERY_UNAVAILABLE") {
      throw errors.DELIVERY_UNAVAILABLE();
    }
    if (resolved.error) throw errors.NOT_FOUND();

    return {
      printRub: resolved.printRub,
      deliveryRub: resolved.deliveryRub,
      payableRub: resolved.payableRub,
      deliveryEtaDays: resolved.deliveryEtaDays,
      deliveryEstimated: resolved.deliveryEstimated,
      smallPart: resolved.smallPart,
      point: {
        id: resolved.point.id,
        name: resolved.point.name,
        address: resolved.point.address,
        city: resolved.point.city,
      },
    };
  });
