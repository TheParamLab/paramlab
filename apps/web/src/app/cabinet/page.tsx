import { paths } from "@paramlab/config";
import { Badge, Skeleton } from "@paramlab/ui";
import { getMaterial, ORDER_STATUS_LABELS } from "@paramlab/validators";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SiteHeader } from "~/components/layout";
import { formatDate, formatNumber, formatRub } from "~/lib/format";
import { api } from "~/orpc/server";

export const metadata: Metadata = {
  title: "Пульт производства — ParamLab",
  description:
    "Сводка по заказам, деталям и доставке в личном кабинете параметрической 3D-печати ParamLab.",
};

export default function CabinetPage() {
  return (
    <>
      <SiteHeader title="Обзор" />
      <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Пульт производства
          </h1>
          <p className="text-sm text-muted-foreground">
            Ваши заказы, детали и ближайшие отправления — без демо-данных.
          </p>
        </div>
        {/* Каркас пререндерится; сводка ждёт запроса к API. */}
        <Suspense fallback={<OverviewSkeleton />}>
          <Overview />
        </Suspense>
      </div>
    </>
  );
}

async function Overview() {
  const [summary, orders, parts] = await Promise.all([
    api.order.summary(),
    api.order.list({ limit: 5 }),
    api.part.list(),
  ]);

  const latestOrders = orders;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Заказов в работе"
          value={String(summary.active)}
          hint="оплачены и запущены в производство"
          accent="text-brand"
        />
        <StatCard
          label="Всего заказов"
          value={String(summary.total)}
          hint="за всё время"
          accent="text-lab-text"
        />
        <StatCard
          label="Деталей в библиотеке"
          value={String(parts.length)}
          hint="готовы к повторному заказу"
          accent="text-lab-cyan"
        />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">
            Последние заказы
          </h2>
          <Link
            href={paths.orders.root}
            className="font-mono text-xs text-lab-cyan underline-offset-4 hover:underline"
          >
            Все заказы →
          </Link>
        </div>

        {latestOrders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            Заказов пока нет. Загрузите модель в{" "}
            <Link
              href={paths.parts.root}
              className="text-foreground underline underline-offset-4"
            >
              библиотеке деталей
            </Link>{" "}
            и оформите первый заказ.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {latestOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={paths.orders.byId(order.id)}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border bg-card p-4 transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    № {order.number}
                  </span>
                  <span
                    suppressHydrationWarning
                    className="font-mono text-xs text-muted-foreground tabular-nums"
                  >
                    {formatDate(order.createdAt)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                    {order.items
                      .map(
                        (item) =>
                          `${item.partName} — ${formatNumber(item.quantity)} шт., ${getMaterial(item.materialId).code}`,
                      )
                      .join("; ")}
                  </span>
                  <Badge
                    variant={
                      order.status === "cancelled" ? "destructive" : "secondary"
                    }
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {formatRub(order.totalRub)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink
          href={paths.parts.root}
          title="Библиотека деталей"
          description="Повторить печать сохранённой модели в один клик."
        />
        <QuickLink
          href={paths.settings.root}
          title="Профиль и ПВЗ"
          description="Контакты, пункт выдачи и реквизиты для документов."
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <p className={`mt-1 font-mono text-3xl font-bold tabular-nums ${accent}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: Route;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </Link>
  );
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {["a", "b", "c"].map((key) => (
          <Skeleton key={key} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {["d", "e", "f"].map((key) => (
          <Skeleton key={key} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
