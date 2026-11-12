import { Skeleton } from "@acme/ui";
import { ORPCError } from "@orpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SiteHeader } from "~/components/layout";
import { OrderTracker } from "~/components/orders/order-tracker";
import { formatDate } from "~/lib/format";
import { api } from "~/orpc/server";

export const metadata: Metadata = { title: "Заказ" };

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <SiteHeader title="Заказ" />
      <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
        {/* Оболочка пререндерится; параметры и заказ ждут запроса. */}
        <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
          <OrderDetails params={params} />
        </Suspense>
      </div>
    </>
  );
}

async function OrderDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await api.order.byId({ id }).catch((error: unknown) => {
    // Чужой, несуществующий заказ или не-UUID в адресе — одна и та же 404.
    if (
      error instanceof ORPCError &&
      (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST")
    ) {
      notFound();
    }
    throw error;
  });

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Заказ № {order.number}
        </h1>
        <p className="text-sm text-muted-foreground">
          Оформлен {formatDate(order.createdAt)}
        </p>
      </div>
      <OrderTracker initialOrder={order} />
    </>
  );
}
