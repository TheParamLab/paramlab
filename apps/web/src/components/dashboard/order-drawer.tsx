"use client";

import {
  cn,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  toast,
} from "@paramlab/ui";
import {
  FileText,
  Layers,
  MapPin,
  Repeat,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  X,
} from "lucide-react";
import { STAGE_METADATA } from "~/lib/mock-dashboard";
import type { DashboardOrder } from "~/types/dashboard";
import { CopyableChip } from "./copyable-chip";
import { PartSchematicPreview } from "./part-schematic-preview";
import { PrintProgressTracker } from "./print-progress-tracker";

const numberFmt = new Intl.NumberFormat("ru-RU");

export interface OrderDrawerProps {
  order: DashboardOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRepeatOrder: (order: DashboardOrder) => void;
}

export function OrderDrawer({
  order,
  open,
  onOpenChange,
  onRepeatOrder,
}: OrderDrawerProps) {
  if (!order) return null;

  const primaryItem = order.items[0];
  const stageMeta = STAGE_METADATA[order.currentStage];

  function handleDownloadInvoice() {
    if (!order) return;
    toast.success(
      `Счет и закрывающий документ ${order.updNumber ?? order.orderNumber} сформированы (PDF)`,
    );
  }

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="inset-y-0 right-0 h-full w-full border-l border-[#262B36] bg-[#161920] p-0 text-[#F2F4F7] data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-xl">
        <div className="flex h-full flex-col overflow-hidden">
          {/* Верхняя шапка шторки */}
          <DrawerHeader className="relative border-b border-[#262B36] bg-[#0E1014]/80 px-6 py-4 text-left">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Закрыть паспорт заказа"
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-lg border border-[#262B36] bg-[#161920] text-[#8A93A2] transition-colors hover:border-[#8A93A2] hover:text-[#F2F4F7]"
            >
              <X className="size-4" />
            </button>

            <div className="flex flex-wrap items-center justify-between gap-2 pr-10">
              <div className="flex items-center gap-2">
                <CopyableChip
                  value={order.orderNumber}
                  prefix="ПАСПОРТ № "
                  size="md"
                />
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums",
                    stageMeta.badgeBg,
                    stageMeta.badgeBorder,
                    stageMeta.badgeText,
                  )}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: stageMeta.accentColor }}
                  />
                  {stageMeta.shortTitle}
                </span>
              </div>
            </div>

            <DrawerTitle className="mt-1.5 text-lg font-bold tracking-tight text-[#F2F4F7]">
              {primaryItem?.title ?? `Заказ ${order.orderNumber}`}
            </DrawerTitle>
            <DrawerDescription className="font-mono text-xs text-[#8A93A2] tabular-nums">
              Создан: {order.createdAt} · Обновлен: {order.updatedAt}
            </DrawerDescription>
          </DrawerHeader>

          {/* Прокручиваемый контент паспорта заказа */}
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            {/* 1. CAD-чертеж и параметрическая спецификация */}
            {primaryItem && (
              <section className="rounded-[16px] border border-[#262B36] bg-[#0E1014] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="size-4 text-[#00D1FF]" />
                    <h4 className="font-mono text-xs font-bold tracking-wider text-[#F2F4F7] uppercase">
                      Параметрическая спецификация CAD
                    </h4>
                  </div>
                  <CopyableChip
                    value={primaryItem.parametricSpec.dimensionLabel}
                    tooltipText="Скопировать габаритную формулу"
                  />
                </div>

                <PartSchematicPreview
                  partType={primaryItem.parametricSpec.partType}
                  dimensionLabel={primaryItem.parametricSpec.dimensionLabel}
                  materialCode={primaryItem.materialCode}
                  hovered
                />

                <dl className="mt-3 grid grid-cols-3 gap-2.5 font-mono tabular-nums">
                  {Object.values(primaryItem.parametricSpec.dimensions).map(
                    (dim) => (
                      <div
                        key={dim.code}
                        className="rounded-[12px] border border-[#262B36] bg-[#161920] px-3 py-2"
                      >
                        <dt className="text-[11px] text-[#8A93A2]">
                          <strong className="text-[#00D1FF]">{dim.code}</strong>{" "}
                          · {dim.label}
                        </dt>
                        <dd className="mt-0.5 text-sm font-bold text-[#F2F4F7]">
                          {dim.value} мм
                        </dd>
                      </div>
                    ),
                  )}
                </dl>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#262B36] pt-3 font-mono text-xs text-[#8A93A2] tabular-nums sm:grid-cols-4">
                  <div>
                    Полимер:{" "}
                    <strong className="text-[#00D1FF]">
                      {primaryItem.materialCode}
                    </strong>
                  </div>
                  <div>
                    Шаг слоя:{" "}
                    <strong className="text-[#F2F4F7]">
                      {primaryItem.parametricSpec.layerHeightMm.toFixed(2)} мм
                    </strong>
                  </div>
                  <div>
                    Заполнение:{" "}
                    <strong className="text-[#F2F4F7]">
                      {primaryItem.parametricSpec.infillPercent}%
                    </strong>
                  </div>
                  <div>
                    Масса партии:{" "}
                    <strong className="text-[#F2F4F7]">
                      {numberFmt.format(primaryItem.totalMassGrams)} г
                    </strong>
                  </div>
                </div>
              </section>
            )}

            {/* 2. Полный 5-этапный конвейер производства и телеметрия ОТК */}
            <section className="rounded-[16px] border border-[#262B36] bg-[#0E1014] p-4">
              <div className="mb-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-[#FF5C1A]" />
                  <h4 className="font-mono text-xs font-bold tracking-wider text-[#F2F4F7] uppercase">
                    Трекер производственного цикла
                  </h4>
                </div>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#10B981]">
                  <ShieldCheck className="size-3.5" />
                  Допуск ±0.1 мм
                </span>
              </div>

              <PrintProgressTracker order={order} variant="detailed" />
            </section>

            {/* 3. Логистика и ПВЗ */}
            <section className="rounded-[16px] border border-[#262B36] bg-[#0E1014] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Truck className="size-4 text-[#10B981]" />
                  <h4 className="font-mono text-xs font-bold tracking-wider text-[#F2F4F7] uppercase">
                    Логистика и пункт выдачи
                  </h4>
                </div>
                <CopyableChip
                  value={order.delivery.trackingNumber}
                  prefix={`${order.delivery.carrierLabel} · `}
                  tooltipText="Скопировать трек-номер"
                />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 text-[#F2F4F7]">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#FF5C1A]" />
                  <div>
                    <p className="font-medium">{order.delivery.pvzAddress}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[#8A93A2]">
                      Код ПВЗ: {order.delivery.pvzCode} ·{" "}
                      {order.delivery.etaText}
                    </p>
                  </div>
                </div>
                {order.delivery.barcodeCode && (
                  <div className="flex items-center justify-between rounded-lg border border-[#262B36] bg-[#161920] px-3 py-2 font-mono">
                    <span className="text-[#8A93A2]">Код получения ПВЗ:</span>
                    <CopyableChip value={order.delivery.barcodeCode} />
                  </div>
                )}
              </div>
            </section>

            {/* 4. Финансовая калькуляция и ЭДО */}
            <section className="rounded-[16px] border border-[#262B36] bg-[#0E1014] p-4 font-mono text-xs tabular-nums">
              <div className="space-y-1.5 text-[#8A93A2]">
                <div className="flex justify-between">
                  <span>
                    Производство партии ({primaryItem?.quantity ?? 1} шт.):
                  </span>
                  <span className="text-[#F2F4F7]">
                    {numberFmt.format(order.subtotalRub)} ₽
                  </span>
                </div>
                {order.discountPercent > 0 && (
                  <div className="flex justify-between text-[#10B981]">
                    <span>Серийный коэффициент (от 10 шт.):</span>
                    <span>−{order.discountPercent}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Доставка ({order.delivery.carrierLabel}):</span>
                  <span className="text-[#F2F4F7]">
                    {numberFmt.format(order.deliveryRub)} ₽
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between border-t border-[#262B36] pt-3">
                <span className="text-xs font-semibold text-[#F2F4F7] uppercase">
                  Итого по спецификации:
                </span>
                <span className="text-xl font-bold text-[#F2F4F7]">
                  {numberFmt.format(order.totalRub)} ₽
                </span>
              </div>
            </section>
          </div>

          {/* Нижний бар быстрых действий */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#262B36] bg-[#0E1014] px-6 py-4">
            <button
              type="button"
              onClick={handleDownloadInvoice}
              className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-[#262B36] bg-[#161920] px-3.5 font-mono text-xs font-medium text-[#F2F4F7] transition-colors hover:border-[#00D1FF]/60 hover:text-[#00D1FF]"
            >
              <FileText className="size-3.5 text-[#00D1FF]" />
              {order.updNumber ? `Скачать ${order.updNumber}` : "Счет PDF"}
            </button>

            <button
              type="button"
              onClick={() => {
                onRepeatOrder(order);
                onOpenChange(false);
              }}
              className="cta-border-beam inline-flex h-10 items-center gap-2 rounded-[12px] bg-[#FF5C1A] px-5 text-xs font-semibold text-[#0E1014] transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]"
            >
              <Repeat className="size-3.5" />
              Запустить партию повторно
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
