"use client";

import type { RouterOutputs } from "@acme/api";
import { paths } from "@acme/config";
import { Badge, Button, toast } from "@acme/ui";
import { getMaterial, ORDER_STATUS_LABELS } from "@acme/validators";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { formatDate, formatNumber, formatRub } from "~/lib/format";
import { client } from "~/orpc/react";

type Orders = RouterOutputs["order"]["list"];

/** Список заказов: первая страница приходит с сервера, остальные — по кнопке. */
export function OrderList({
  initialOrders,
  pageSize,
}: {
  initialOrders: Orders;
  pageSize: number;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [hasMore, setHasMore] = useState(initialOrders.length === pageSize);

  const loadMore = useMutation({
    mutationFn: () =>
      client.order.list({ limit: pageSize, offset: orders.length }),
    onSuccess: (page) => {
      // Пока список открыт, мог появиться новый заказ и сдвинуть страницы.
      const known = new Set(orders.map((order) => order.id));
      setOrders([...orders, ...page.filter((order) => !known.has(order.id))]);
      setHasMore(page.length === pageSize);
    },
    onError: (error) => {
      toast.error(error.message || "Не удалось загрузить заказы");
    },
  });

  return (
    <>
      <ul className="flex flex-col gap-3">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              href={paths.orders.byId(order.id)}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border p-4 transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="min-w-0 flex-1 basis-56">
                <p className="font-medium">
                  № {order.number}
                  <span
                    // Часовой пояс сервера и браузера может отличаться.
                    suppressHydrationWarning
                    className="font-normal text-muted-foreground"
                  >
                    {" "}
                    · {formatDate(order.createdAt)}
                  </span>
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {order.items
                    .map(
                      (item) =>
                        `${item.partName} — ${formatNumber(item.quantity)} шт., ${getMaterial(item.materialId).code}`,
                    )
                    .join("; ")}
                </p>
              </div>
              <Badge
                variant={
                  order.status === "cancelled"
                    ? "destructive"
                    : order.status === "ready_for_pickup"
                      ? "default"
                      : "secondary"
                }
              >
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
              <span className="font-mono font-semibold">
                {formatRub(order.totalRub)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {hasMore && (
        <Button
          variant="outline"
          className="mx-auto"
          disabled={loadMore.isPending}
          onClick={() => loadMore.mutate()}
        >
          {loadMore.isPending ? "Загружаем…" : "Показать ещё"}
        </Button>
      )}
    </>
  );
}
