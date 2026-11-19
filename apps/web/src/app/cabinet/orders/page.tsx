import { paths } from "@acme/config";
import { Skeleton } from "@acme/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SiteHeader } from "~/components/layout";
import { OrderList } from "~/components/orders/order-list";
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

  return <OrderList initialOrders={orders} pageSize={PAGE_SIZE} />;
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
