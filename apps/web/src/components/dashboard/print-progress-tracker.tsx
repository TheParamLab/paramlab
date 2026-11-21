"use client";

import { cn } from "@paramlab/ui";
import {
  Check,
  Cpu,
  Flame,
  PackageCheck,
  Ruler,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { STAGE_METADATA, STAGE_ORDER } from "~/lib/mock-dashboard";
import type {
  DashboardOrder,
  PrintStageId,
  PrintStageState,
} from "~/types/dashboard";

const STAGE_ICONS: Record<PrintStageId, typeof ShieldCheck> = {
  manifold: ShieldCheck,
  printing: Flame,
  qc: Ruler,
  shipping: Truck,
  done: PackageCheck,
};

export interface PrintProgressTrackerProps {
  order: DashboardOrder;
  /** Компактный режим для карточки заказа или подробный для шторки */
  variant?: "compact" | "detailed";
  className?: string;
}

function getStageState(
  currentStage: PrintStageId,
  targetStage: PrintStageId,
): PrintStageState {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const targetIndex = STAGE_ORDER.indexOf(targetStage);
  if (currentStage === "done") return "completed";
  if (targetIndex < currentIndex) return "completed";
  if (targetIndex === currentIndex) return "active";
  return "upcoming";
}

export function PrintProgressTracker({
  order,
  variant = "compact",
  className,
}: PrintProgressTrackerProps) {
  const prefersReducedMotion = useReducedMotion();
  const currentIndex = STAGE_ORDER.indexOf(order.currentStage);

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-col gap-2.5", className)}>
        {/* Сегментированная шкала из 5 этапов */}
        <div
          role="progressbar"
          aria-label="Этап производства заказа"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={currentIndex + 1}
          className="grid grid-cols-5 gap-1.5"
        >
          {STAGE_ORDER.map((stageId, index) => {
            const state = getStageState(order.currentStage, stageId);
            const meta = STAGE_METADATA[stageId];
            const fillPercent =
              state === "completed"
                ? 100
                : state === "active"
                  ? Math.max(25, order.stageProgressPercent)
                  : 0;

            return (
              <div key={stageId} className="flex flex-col gap-1.5">
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#262B36]">
                  <motion.div
                    initial={
                      prefersReducedMotion
                        ? { width: `${fillPercent}%` }
                        : { width: 0 }
                    }
                    animate={{ width: `${fillPercent}%` }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.45,
                      delay: prefersReducedMotion ? 0 : index * 0.04,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor:
                        state === "upcoming" ? "#262B36" : meta.accentColor,
                    }}
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      "font-mono text-[10px] tabular-nums",
                      state === "active"
                        ? "font-bold text-[#F2F4F7]"
                        : state === "completed"
                          ? "text-[#8A93A2]"
                          : "text-[#8A93A2]/50",
                    )}
                  >
                    {meta.stepNumber}
                  </span>
                  <span
                    className={cn(
                      "truncate text-[11px]",
                      state === "active"
                        ? "font-semibold text-[#F2F4F7]"
                        : state === "completed"
                          ? "text-[#8A93A2]"
                          : "text-[#8A93A2]/50",
                    )}
                  >
                    {meta.shortTitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Телеметрия слоев для активной печати */}
        {order.currentStage === "printing" && order.layerTelemetry && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[#FF5C1A]/30 bg-[#0E1014] px-3 py-2 font-mono text-xs tabular-nums">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "size-2 rounded-full bg-[#FF5C1A] shadow-[0_0_8px_#FF5C1A]",
                  !prefersReducedMotion && "animate-pulse",
                )}
              />
              <span className="font-semibold text-[#F2F4F7]">
                Слой {order.layerTelemetry.currentLayer} /{" "}
                {order.layerTelemetry.totalLayers}
              </span>
              <span className="text-[#FF5C1A]">
                ({order.stageProgressPercent}%)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#8A93A2]">
              <span className="inline-flex items-center gap-1">
                <Cpu className="size-3 text-[#00D1FF]" />
                {order.layerTelemetry.machineId}
              </span>
              <span className="text-[#262B36]">·</span>
              <span>Сопло {order.layerTelemetry.nozzleTempC} °C</span>
              <span className="hidden sm:inline text-[#262B36]">·</span>
              <span className="hidden sm:inline text-[#F2F4F7]">
                ~{order.layerTelemetry.remainingMinutes} мин
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Подробный вертикальный таймлайн для OrderDrawer
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {order.currentStage === "printing" && order.layerTelemetry && (
        <div className="rounded-[12px] border border-[#FF5C1A]/40 bg-[#0E1014] p-3.5 font-mono tabular-nums">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "size-2.5 rounded-full bg-[#FF5C1A] shadow-[0_0_10px_#FF5C1A]",
                  !prefersReducedMotion && "animate-pulse",
                )}
              />
              <span className="text-xs font-bold tracking-wider text-[#FF5C1A] uppercase">
                {`LIVE TELEMETRY // ${order.layerTelemetry.machineId}`}
              </span>
            </div>
            <span className="text-xs text-[#8A93A2]">
              Осталось ~{order.layerTelemetry.remainingMinutes} мин
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-sm font-bold text-[#F2F4F7]">
              Слой {order.layerTelemetry.currentLayer} /{" "}
              {order.layerTelemetry.totalLayers}
            </span>
            <span className="text-sm font-bold text-[#FF5C1A]">
              {order.stageProgressPercent}%
            </span>
          </div>

          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#262B36]">
            <motion.div
              initial={
                prefersReducedMotion
                  ? { width: `${order.stageProgressPercent}%` }
                  : { width: 0 }
              }
              animate={{ width: `${order.stageProgressPercent}%` }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="h-full rounded-full bg-[#FF5C1A]"
            />
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-[#262B36] pt-2 text-[11px] text-[#8A93A2]">
            <div>
              Экструдер:{" "}
              <strong className="text-[#F2F4F7]">
                {order.layerTelemetry.nozzleTempC} °C
              </strong>
            </div>
            <div>
              Термокамера:{" "}
              <strong className="text-[#F2F4F7]">
                {order.layerTelemetry.chamberTempC} °C
              </strong>
            </div>
            <div className="text-right">
              Шаг Z: <strong className="text-[#00D1FF]">0.20 мм</strong>
            </div>
          </div>
        </div>
      )}

      <ol className="relative flex flex-col">
        {STAGE_ORDER.map((stageId, index) => {
          const state = getStageState(order.currentStage, stageId);
          const meta = STAGE_METADATA[stageId];
          const event = order.stages.find((e) => e.stage === stageId);
          const Icon = STAGE_ICONS[stageId];
          const isLast = index === STAGE_ORDER.length - 1;

          return (
            <li
              key={stageId}
              aria-current={state === "active" ? "step" : undefined}
              className="relative flex gap-3.5 pb-5 last:pb-0"
            >
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="absolute top-8 bottom-0 left-4 w-px -translate-x-1/2"
                  style={{
                    backgroundColor:
                      state === "completed" ? meta.accentColor : "#262B36",
                  }}
                />
              )}

              <span
                aria-hidden="true"
                className={cn(
                  "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-xl border font-mono text-xs transition-colors",
                  state === "completed" &&
                    "border-[#10B981]/50 bg-[#10B981]/15 text-[#10B981]",
                  state === "active" && "bg-[#0E1014] font-bold",
                  state === "upcoming" &&
                    "border-[#262B36] bg-[#0E1014] text-[#8A93A2]/50",
                )}
                style={
                  state === "active"
                    ? {
                        borderColor: meta.accentColor,
                        color: meta.accentColor,
                        boxShadow: `0 0 14px ${meta.accentColor}33`,
                      }
                    : undefined
                }
              >
                {state === "completed" ? (
                  <Check className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </span>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#8A93A2] tabular-nums">
                      {meta.stepNumber}
                    </span>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        state === "upcoming"
                          ? "text-[#8A93A2]/60"
                          : "text-[#F2F4F7]",
                      )}
                    >
                      {event?.title ?? meta.fullTitle}
                    </p>
                  </div>
                  {event?.timestamp && (
                    <span className="font-mono text-[11px] text-[#8A93A2] tabular-nums">
                      {event.timestamp}
                    </span>
                  )}
                </div>

                <p
                  className={cn(
                    "mt-0.5 text-xs leading-relaxed",
                    state === "upcoming"
                      ? "text-[#8A93A2]/50"
                      : "text-[#8A93A2]",
                  )}
                >
                  {event?.subtitle ?? meta.shortTitle}
                </p>

                {event?.telemetry && (
                  <div className="mt-1.5 inline-flex items-center rounded-md border border-[#262B36] bg-[#0E1014] px-2 py-0.5 font-mono text-[11px] text-[#00D1FF] tabular-nums">
                    {event.telemetry}
                  </div>
                )}

                {event?.qcMetrics && (
                  <div className="mt-2.5 rounded-[12px] border border-[#F59E0B]/35 bg-[#0E1014] p-3 font-mono text-xs tabular-nums">
                    <div className="flex items-center justify-between border-b border-[#262B36] pb-2">
                      <span className="font-semibold text-[#F59E0B]">
                        ПРОТОКОЛ ОТК ±0.1 ММ
                      </span>
                      <span className="rounded bg-[#10B981]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#10B981]">
                        ДОПУСК ПРОЙДЕН
                      </span>
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <dt className="text-[#8A93A2]">Номинал CAD:</dt>
                        <dd className="text-[#F2F4F7]">
                          {event.qcMetrics.nominalMm}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[#8A93A2]">Факт (Mitutoyo):</dt>
                        <dd className="text-[#10B981]">
                          {event.qcMetrics.measuredMm}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[#8A93A2]">Отклонение Δ:</dt>
                        <dd className="text-[#F2F4F7]">
                          {event.qcMetrics.deviationMm}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[#8A93A2]">Инженер ОТК:</dt>
                        <dd className="truncate text-[#8A93A2]">
                          {event.qcMetrics.inspectorCode}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
