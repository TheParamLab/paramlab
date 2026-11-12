import { paths } from "@acme/config";
import { Badge, Skeleton } from "@acme/ui";
import { getMaterial, ORDER_STATUS_LABELS } from "@acme/validators";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SiteHeader } from "~/components/layout";
import { formatDate, formatNumber, formatRub } from "~/lib/format";
import { api } from "~/orpc/server";

const PAGE_SIZE = 50;

export const metadata: Metadata = { title: "Заказы" };

export default function OrdersPage() {
  return (
    <>
      <SiteHeader title="Заказы" />
      <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Заказы</h1>
        {/* Оболочка пререндерится; список заказов ждёт запроса. */}
        <Suspense fallback={<OrdersSkeleton />}>
          <Orders />
        </Suspense>
      </div>
    </>
  );
}

async function Orders() {
  const orders = await api.order.list({ limit: PAGE_SIZE });

  if (orders.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        Заказов пока нет. Выберите деталь в{" "}
        <Link
          href={paths.parts.root}
          className="text-foreground underline underline-offset-4"
        >
          библиотеке
        </Link>{" "}
        и нажмите «Заказать».
      </p>
    );
  }

  return (
    <>
      <OrderList orders={orders} />
      {orders.length === PAGE_SIZE && (
        <p className="text-center text-sm text-muted-foreground">
          Показаны последние {PAGE_SIZE} заказов.
        </p>
      )}
    </>
  );
}

function OrderList({
  orders,
}: {
  orders: Awaited<ReturnType<typeof api.order.list>>;
}) {
  return (
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
                <span className="font-normal text-muted-foreground">
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
  );
}

function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {["a", "b", "c"].map((key) => (
        <Skeleton key={key} className="h-20 rounded-xl" />
      ))}
    </div>
  );
}
