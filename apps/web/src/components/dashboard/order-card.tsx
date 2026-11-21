"use client";

import { cn } from "@paramlab/ui";
import {
  ChevronRight,
  MapPin,
  Package,
  Repeat,
  Scale,
  Truck,
} from "lucide-react";
import { useReducedMotion } from "motion/react";
import { STAGE_METADATA } from "~/lib/mock-dashboard";
import type { DashboardOrder } from "~/types/dashboard";
import { CopyableChip } from "./copyable-chip";
import { PartSchematicPreview } from "./part-schematic-preview";
import { PrintProgressTracker } from "./print-progress-tracker";

const numberFmt = new Intl.NumberFormat("ru-RU");

export interface OrderCardProps {
  order: DashboardOrder;
  onInspect: (order: DashboardOrder) => void;
  onRepeatOrder: (order: DashboardOrder) => void;
  className?: string;
}

export function OrderCard({
  order,
  onInspect,
  onRepeatOrder,
  className,
}: OrderCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const primaryItem = order.items[0];
  const stageMeta = STAGE_METADATA[order.currentStage];
  const isPrinting = order.currentStage === "printing";

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 rounded-[16px] border bg-[#161920] p-4 transition-all duration-200 sm:p-5",
        isPrinting
          ? "border-[#FF5C1A]/40 hover:border-[#FF5C1A]/75"
          : "border-[#262B36] hover:border-[#00D1FF]/50",
        className,
      )}
    >
      {/* Верхняя шапка карточки: номер заказа, дата, бейдж статуса и итоговая сумма */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#262B36] pb-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <CopyableChip
            value={order.orderNumber}
            prefix="№ "
            tooltipText="Скопировать номер заказа"
            size="md"
          />
          <span className="font-mono text-xs text-[#8A93A2] tabular-nums">
            · {order.createdAt}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Статусный бейдж по палитре Dark Engineering Theme */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-semibold tabular-nums",
              stageMeta.badgeBg,
              stageMeta.badgeBorder,
              stageMeta.badgeText,
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                isPrinting && !prefersReducedMotion && "animate-pulse",
              )}
              style={{ backgroundColor: stageMeta.accentColor }}
            />
            {stageMeta.shortTitle}
          </span>

          <span className="font-mono text-lg font-bold text-[#F2F4F7] tabular-nums">
            {numberFmt.format(order.totalRub)} ₽
          </span>
        </div>
      </div>

      {/* Основной блок спецификации детали */}
      {primaryItem && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <PartSchematicPreview
            partType={primaryItem.parametricSpec.partType}
            size="sm"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-[#00D1FF] tabular-nums">
                {primaryItem.parametricSpec.templateCode}
              </span>
              <span className="text-[#262B36]">·</span>
              <span className="font-mono text-[11px] text-[#8A93A2]">
                {primaryItem.parametricSpec.tolerance}
              </span>
            </div>

            <h3 className="mt-1 text-base font-bold tracking-tight text-[#F2F4F7]">
              {primaryItem.title}
            </h3>

            {/* Инженерные чипы параметров: Размеры, Полимер, Партия, Масса */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2 font-mono text-xs tabular-nums">
              <CopyableChip
                value={primaryItem.parametricSpec.dimensionLabel}
                tooltipText="Скопировать формулу размеров"
              />

              <span className="inline-flex items-center gap-1 rounded-lg border border-[#262B36] bg-[#0E1014] px-2.5 py-0.5 text-[#00D1FF]">
                {primaryItem.materialCode}
              </span>

              <span className="inline-flex items-center gap-1 rounded-lg border border-[#262B36] bg-[#0E1014] px-2.5 py-0.5 text-[#F2F4F7]">
                <Package className="size-3 text-[#8A93A2]" />
                {numberFmt.format(primaryItem.quantity)} шт.
              </span>

              <span className="inline-flex items-center gap-1 rounded-lg border border-[#262B36] bg-[#0E1014] px-2.5 py-0.5 text-[#8A93A2]">
                <Scale className="size-3" />
                {numberFmt.format(primaryItem.totalMassGrams)} г
              </span>

              {order.discountPercent > 0 && (
                <span className="inline-flex items-center rounded-lg border border-[#10B981]/40 bg-[#10B981]/10 px-2 py-0.5 text-[11px] font-semibold text-[#10B981]">
                  Серия −{order.discountPercent}%
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5-этапный трекер прогресса */}
      <div className="rounded-[12px] border border-[#262B36] bg-[#0E1014]/65 p-3">
        <PrintProgressTracker order={order} variant="compact" />
      </div>

      {/* Нижняя панель: логистика (ПВЗ + трек-номер) и быстрые действия */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="inline-flex items-center gap-1.5 text-[#8A93A2]">
            <Truck className="size-3.5 text-[#00D1FF]" />
            {order.delivery.carrierLabel}:
          </span>
          <CopyableChip
            value={order.delivery.trackingNumber}
            tooltipText="Скопировать трек-номер"
          />
          <span className="hidden items-center gap-1 text-[#8A93A2] md:inline-flex">
            <MapPin className="size-3.5 text-[#FF5C1A]" />
            <span className="max-w-[260px] truncate">
              {order.delivery.pvzAddress}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRepeatOrder(order)}
            className="inline-flex h-9 items-center gap-1.5 rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3 font-mono text-xs font-medium text-[#F2F4F7] transition-colors hover:border-[#FF5C1A]/60 hover:bg-[#FF5C1A]/10 hover:text-[#F2F4F7] focus-visible:ring-2 focus-visible:ring-[#00D1FF] focus-visible:outline-none"
          >
            <Repeat className="size-3.5 text-[#FF5C1A]" />
            Повторить заказ
          </button>

          <button
            type="button"
            onClick={() => onInspect(order)}
            className="inline-flex h-9 items-center gap-1 rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3 font-mono text-xs font-medium text-[#00D1FF] transition-colors hover:border-[#00D1FF]/60 hover:bg-[#00D1FF]/10 focus-visible:ring-2 focus-visible:ring-[#00D1FF] focus-visible:outline-none"
          >
            Паспорт и ОТК
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
