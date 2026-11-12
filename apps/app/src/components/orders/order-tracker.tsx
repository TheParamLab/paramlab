"use client";

import type { RouterOutputs } from "@acme/api";
import { cn } from "@acme/ui";
import {
  getMaterial,
  ORDER_STAGES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@acme/validators";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";

import { formatDateTime, formatNumber, formatRub } from "~/lib/format";
import { orpc } from "~/orpc/react";

type Order = RouterOutputs["order"]["byId"];

/** Пять этапов трекера: всё, что идёт после оплаты. */
const TRACKER_STAGES = ORDER_STAGES.filter(
  (stage) => stage !== "pending_payment",
);

const STAGE_HINTS: Partial<Record<OrderStatus, string>> = {
  paid: "Заказ в очереди печати.",
  printing: "Деталь печатается в закрытой прогретой камере.",
  quality_check:
    "Перед упаковкой измеряем деталь штангенциркулем и присылаем фото.",
  shipped: "Заказ едет в выбранный пункт выдачи.",
  ready_for_pickup: "Заказ ждёт вас в пункте выдачи.",
};

export function OrderTracker({ initialOrder }: { initialOrder: Order }) {
  const {
    data: order,
    isRefetchError,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    ...orpc.order.byId.queryOptions({ input: { id: initialOrder.id } }),
    initialData: initialOrder,
    // Этапы меняет производство — подтягиваем без перезагрузки страницы.
    refetchInterval: 30_000,
  });

  const cancelled = order.status === "cancelled";
  // У отменённого заказа текущего этапа нет: пройденные берём из истории.
  const current = cancelled
    ? TRACKER_STAGES.reduce(
        (reached, stage, index) =>
          order.events.some((event) => event.status === stage)
            ? index + 1
            : reached,
        0,
      )
    : TRACKER_STAGES.indexOf(order.status as (typeof TRACKER_STAGES)[number]);
  const material = order.items[0]
    ? getMaterial(order.items[0].materialId).code
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <section
        aria-labelledby="tracker-title"
        className="rounded-xl border p-4"
      >
        <h2 id="tracker-title" className="font-medium">
          Этапы заказа
        </h2>

        {isRefetchError && (
          <div
            role="alert"
            className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-destructive/10 px-3 py-2 text-sm"
          >
            <span suppressHydrationWarning>
              Не удалось обновить статус. Показаны данные на{" "}
              {formatDateTime(new Date(dataUpdatedAt))}.
            </span>
            <button
              type="button"
              disabled={isFetching}
              onClick={() => void refetch()}
              className="font-medium underline underline-offset-4 disabled:opacity-50"
            >
              Повторить
            </button>
          </div>
        )}
        {order.status === "pending_payment" && (
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm">
            Заказ оформлен и ожидает оплаты. После оплаты он попадёт в очередь
            печати.
          </p>
        )}
        {order.status === "cancelled" && (
          <p
            role="status"
            className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            Заказ отменён.
          </p>
        )}

        <ol className="mt-4 flex flex-col">
          {TRACKER_STAGES.map((stage, index) => {
            const done = current > index;
            const active = !cancelled && current === index;
            // Последнее событие этапа: дата, комментарий и фото ОТК.
            const event = order.events.filter((e) => e.status === stage).at(-1);
            const last = index === TRACKER_STAGES.length - 1;

            return (
              <li
                key={stage}
                aria-current={active ? "step" : undefined}
                className="relative flex gap-3 pb-6 last:pb-0"
              >
                {!last && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-7 bottom-0 left-3.5 w-px -translate-x-1/2",
                      done ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
                <span
                  aria-hidden
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs",
                    done && "border-primary bg-primary text-primary-foreground",
                    active &&
                      "border-primary text-primary ring-3 ring-primary/20",
                    !done && !active && "text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-4" /> : index + 1}
                </span>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      !done && !active && "text-muted-foreground",
                    )}
                  >
                    {ORDER_STATUS_LABELS[stage]}
                    {stage === "printing" && material ? ` · ${material}` : ""}
                    <span className="sr-only">
                      {done
                        ? " — завершён"
                        : active
                          ? " — текущий этап"
                          : " — впереди"}
                    </span>
                  </p>
                  {event && (
                    <time
                      dateTime={event.createdAt.toISOString()}
                      // Часовой пояс сервера и браузера может отличаться.
                      suppressHydrationWarning
                      className="font-mono text-xs text-muted-foreground"
                    >
                      {formatDateTime(event.createdAt)}
                    </time>
                  )}
                  {active && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {STAGE_HINTS[stage]}
                    </p>
                  )}
                  {event?.note && <p className="mt-1 text-sm">{event.note}</p>}
                  {event?.photoUrl && (
                    <a
                      href={event.photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block w-fit"
                    >
                      {/* biome-ignore lint/performance/noImgElement: presigned-ссылка S3 */}
                      <img
                        src={event.photoUrl}
                        alt="Фото готовой детали со штангенциркулем"
                        loading="lazy"
                        className="max-h-56 rounded-lg border"
                      />
                    </a>
                  )}
                  {stage === "shipped" &&
                    (done || active) &&
                    order.trackingNumber && (
                      <p className="mt-1 text-sm">
                        {order.carrier ? `${order.carrier} · ` : ""}
                        {order.trackingUrl ? (
                          <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono underline underline-offset-4"
                          >
                            {order.trackingNumber}
                          </a>
                        ) : (
                          <span className="font-mono">
                            {order.trackingNumber}
                          </span>
                        )}
                      </p>
                    )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section
        aria-labelledby="items-title"
        className="h-fit rounded-xl border p-4"
      >
        <h2 id="items-title" className="font-medium">
          Состав заказа
        </h2>
        <ul className="mt-3 flex flex-col gap-3">
          {order.items.map((item) => (
            <li key={item.id} className="text-sm">
              <p className="font-medium">{item.partName}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {formatNumber(item.quantity)} шт. ·{" "}
                {getMaterial(item.materialId).code} ·{" "}
                {formatNumber(item.massGrams * item.quantity)} г
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between border-t pt-3">
          <span className="text-sm text-muted-foreground">Печать</span>
          <span className="font-mono text-lg font-semibold">
            {formatRub(order.totalRub)}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Доставка в пункт выдачи рассчитывается отдельно.
        </p>
      </section>
    </div>
  );
}
