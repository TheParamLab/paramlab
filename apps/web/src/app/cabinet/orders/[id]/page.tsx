import { ORPCError } from "@orpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { OrderTracker } from "~/components/orders/order-tracker";
import { formatDate } from "~/lib/format";
import { api } from "~/orpc/server";

export const metadata: Metadata = { title: "Паспорт заказа — ParamLab" };

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Оболочка пререндерится; параметры и заказ ждут запроса. */}
      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-[16px] border border-[#262B36] bg-[#161920]" />
        }
      >
        <OrderDetails params={params} />
      </Suspense>
    </div>
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
        <h1 className="font-mono text-2xl font-bold tracking-tight text-[#F2F4F7] tabular-nums">
          Заказ № {order.number}
        </h1>
        <p className="font-mono text-xs text-[#8A93A2] tabular-nums">
          Оформлен {formatDate(order.createdAt)}
        </p>
      </div>
      <OrderTracker initialOrder={order} />
    </>
  );
}
