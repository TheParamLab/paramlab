"use client";

import { cn, Tabs, TabsList, TabsTrigger, toast } from "@paramlab/ui";
import {
  CheckCircle2,
  Flame,
  Package,
  Ruler,
  Search,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import {
  MOCK_SUMMARY_METRICS,
  repeatDashboardOrder,
  STAGE_METADATA,
  useDashboardOrders,
} from "~/lib/mock-dashboard";
import type { DashboardOrder, PrintStageId } from "~/types/dashboard";
import { EmptyBlueprintState } from "./empty-blueprint-state";
import { OrderCard } from "./order-card";
import { OrderDrawer } from "./order-drawer";

const STAGE_FILTERS: readonly {
  id: "all" | PrintStageId;
  label: string;
}[] = [
  { id: "all", label: "Все этапы" },
  { id: "manifold", label: "Проверка (Manifold)" },
  { id: "printing", label: "В печати" },
  { id: "qc", label: "ОТК и упаковка" },
  { id: "shipping", label: "В пути" },
  { id: "done", label: "Готово" },
];

export function OrdersView() {
  const prefersReducedMotion = useReducedMotion();
  const orders = useDashboardOrders();
  const [categoryTab, setCategoryTab] = useState<
    "active" | "completed" | "all"
  >("active");
  const [stageFilter, setStageFilter] = useState<"all" | PrintStageId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeCount = orders.filter((o) => o.category === "active").length;
  const completedCount = orders.filter(
    (o) => o.category === "completed",
  ).length;

  const filteredOrders = orders.filter((order) => {
    if (categoryTab !== "all" && order.category !== categoryTab) return false;
    if (stageFilter !== "all" && order.currentStage !== stageFilter)
      return false;

    if (searchQuery.trim() !== "") {
      const q = searchQuery.trim().toLowerCase();
      const matchNumber = order.orderNumber.toLowerCase().includes(q);
      const matchTrack = (order.delivery.trackingNumber ?? "")
        .toLowerCase()
        .includes(q);
      const matchItem = order.items.some(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.materialCode.toLowerCase().includes(q) ||
          item.parametricSpec.dimensionLabel.toLowerCase().includes(q) ||
          item.parametricSpec.templateCode.toLowerCase().includes(q),
      );
      return matchNumber || matchTrack || matchItem;
    }

    return true;
  });

  function handleInspectOrder(order: DashboardOrder) {
    setSelectedOrder(order);
    setDrawerOpen(true);
  }

  function handleRepeatOrder(source: DashboardOrder) {
    const repeatedOrder = repeatDashboardOrder(source);
    setCategoryTab("active");
    setStageFilter("all");
    setSearchQuery("");
    toast.success(
      `Заказ № ${repeatedOrder.orderNumber} создан и передан на этап «Проверка (Manifold)»`,
    );
  }

  function resetFilters() {
    setCategoryTab("all");
    setStageFilter("all");
    setSearchQuery("");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Сводная панель телеметрии заказов (4 карточки) */}
      <section
        aria-label="Сводка производственного цикла"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <div className="rounded-[16px] border border-[#262B36] bg-[#161920] p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#8A93A2]">
              Активно в работе
            </span>
            <Flame className="size-4 text-[#FF5C1A]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#F2F4F7] tabular-nums">
            {activeCount}
          </p>
          <p className="mt-1 font-mono text-[11px] text-[#FF5C1A] tabular-nums">
            Печать: слой {MOCK_SUMMARY_METRICS.printingLayersNow}
          </p>
        </div>

        <div className="rounded-[16px] border border-[#262B36] bg-[#161920] p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#8A93A2]">
              Контроль ОТК
            </span>
            <Ruler className="size-4 text-[#F59E0B]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#F2F4F7] tabular-nums">
            {MOCK_SUMMARY_METRICS.averageAccuracyMm}
          </p>
          <p className="mt-1 font-mono text-[11px] text-[#8A93A2]">
            Штангенциркуль ISO 2768-m
          </p>
        </div>

        <div className="rounded-[16px] border border-[#262B36] bg-[#161920] p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#8A93A2]">
              В логистике ПВЗ
            </span>
            <Truck className="size-4 text-[#10B981]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#F2F4F7] tabular-nums">
            Ozon / СДЭК
          </p>
          <p className="mt-1 font-mono text-[11px] text-[#10B981]">
            Авто-трекинг накладных
          </p>
        </div>

        <div className="rounded-[16px] border border-[#262B36] bg-[#161920] p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#8A93A2]">
              Выпущено деталей
            </span>
            <ShieldCheck className="size-4 text-[#00D1FF]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-[#F2F4F7] tabular-nums">
            {MOCK_SUMMARY_METRICS.totalPartsPrinted} шт.
          </p>
          <p className="mt-1 font-mono text-[11px] text-[#00D1FF]">
            100% замкнутый Manifold
          </p>
        </div>
      </section>

      {/* Панель управления списком: табы Активные / Завершенные, поиск и фильтр этапов */}
      <section className="flex flex-col gap-3 rounded-[16px] border border-[#262B36] bg-[#161920] p-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <Tabs
            value={categoryTab}
            onValueChange={(val) =>
              setCategoryTab(val as "active" | "completed" | "all")
            }
          >
            <TabsList className="h-10 rounded-[12px] border border-[#262B36] bg-[#0E1014] p-1">
              <TabsTrigger
                value="active"
                className="rounded-lg px-3.5 font-mono text-xs data-[selected]:bg-[#161920] data-[selected]:text-[#FF5C1A]"
              >
                <Package className="size-3.5" />
                Активные ({activeCount})
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="rounded-lg px-3.5 font-mono text-xs data-[selected]:bg-[#161920] data-[selected]:text-[#10B981]"
              >
                <CheckCircle2 className="size-3.5" />
                Завершённые ({completedCount})
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="rounded-lg px-3.5 font-mono text-xs data-[selected]:bg-[#161920] data-[selected]:text-[#00D1FF]"
              >
                Все ({orders.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Поле быстрого поиска по номеру заказа, размеру D×T×H или трек-номеру */}
          <div className="relative flex-1 md:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8A93A2]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск: PL-2604, D56 × d32, PA12, трек..."
              aria-label="Поиск заказов по номеру, размеру или трек-номеру"
              className="h-10 w-full rounded-[12px] border border-[#262B36] bg-[#0E1014] pr-9 pl-9 font-mono text-xs text-[#F2F4F7] placeholder:text-[#8A93A2] focus:border-[#00D1FF] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Очистить поиск"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-[#8A93A2] hover:text-[#F2F4F7]"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Быстрые чипы фильтрации по 5 этапам конвейера */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-[#262B36] pt-3">
          <span className="mr-1 font-mono text-[11px] text-[#8A93A2]">
            Этап:
          </span>
          {STAGE_FILTERS.map((item) => {
            const active = stageFilter === item.id;
            const meta =
              item.id !== "all" ? STAGE_METADATA[item.id] : undefined;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setStageFilter(item.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]",
                  active
                    ? "border-[#00D1FF] bg-[#00D1FF]/15 font-semibold text-[#00D1FF]"
                    : "border-[#262B36] bg-[#0E1014] text-[#8A93A2] hover:border-[#8A93A2]/50 hover:text-[#F2F4F7]",
                )}
              >
                {meta && (
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: meta.accentColor }}
                  />
                )}
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Список заказов или EmptyBlueprintState */}
      {filteredOrders.length === 0 ? (
        <EmptyBlueprintState
          code="ORDER_QUERY // NO_RESULTS"
          title="Заказы по выбранному фильтру не найдены"
          description="Сбросьте фильтр этапов или запустите новый параметрический расчет детали в 3D-конфигураторе с точностью ±0.1 мм."
          secondaryLabel="Сбросить фильтры"
          onSecondaryAction={resetFilters}
          actionLabel="Открыть 3D-конфигуратор"
          actionHref="/#calculator"
        />
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order, idx) => (
              <motion.div
                key={order.id}
                layout={!prefersReducedMotion}
                initial={
                  prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }
                }
                animate={{ opacity: 1, y: 0 }}
                exit={
                  prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }
                }
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.24,
                  delay: prefersReducedMotion ? 0 : idx * 0.03,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <OrderCard
                  order={order}
                  onInspect={handleInspectOrder}
                  onRepeatOrder={handleRepeatOrder}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Боковая шторка паспорта заказа и протокола ОТК */}
      <OrderDrawer
        order={selectedOrder}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onRepeatOrder={handleRepeatOrder}
      />
    </div>
  );
}
