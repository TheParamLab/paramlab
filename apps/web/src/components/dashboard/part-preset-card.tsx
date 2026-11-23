"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  cn,
  toast,
} from "@paramlab/ui";
import {
  AlertTriangle,
  Check,
  Clock,
  Minus,
  Plus,
  Repeat,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { MATERIALS, type MaterialId } from "~/components/landing/data";
import { clampBore } from "~/components/landing/pricing";
import {
  calculateMinWallMm,
  calculatePresetPricing,
  formatDimensionFormula,
  isManifoldWallValid,
} from "~/lib/mock-dashboard";
import type { SavedPartPreset } from "~/types/dashboard";
import { CopyableChip } from "./copyable-chip";
import { PartSchematicPreview } from "./part-schematic-preview";

const numberFmt = new Intl.NumberFormat("ru-RU");

export interface PartPresetCardProps {
  preset: SavedPartPreset;
  onOrderPreset: (
    preset: SavedPartPreset,
    payload: {
      materialId: MaterialId;
      quantity: number;
      dimensions: { d1: number; d2: number; h: number };
      totalPriceRub: number;
    },
  ) => void;
  onUpdatePreset?: (
    presetId: string,
    updated: {
      materialId: MaterialId;
      dimensions: { d1: number; d2: number; h: number };
    },
  ) => void;
  onDeletePreset?: (presetId: string) => void;
  className?: string;
}

export function PartPresetCard({
  preset,
  onOrderPreset,
  onUpdatePreset,
  onDeletePreset,
  className,
}: PartPresetCardProps) {
  const [hovered, setHovered] = useState(false);
  const [materialId, setMaterialId] = useState<MaterialId>(preset.materialId);
  const [quantity, setQuantity] = useState<number>(preset.defaultQuantity);
  const [isEditingDims, setIsEditingDims] = useState(false);
  const [dims, setDims] = useState({
    d1: preset.dimensions.d1.value,
    d2: preset.dimensions.d2.value,
    h: preset.dimensions.h.value,
  });

  const isBorePart =
    preset.partType === "bushing" || preset.partType === "gear";
  const effectiveDims = isBorePart
    ? {
        ...dims,
        d2: Math.max(preset.dimensions.d2.min, clampBore(dims.d1, dims.d2)),
      }
    : dims;

  const safeQuantity = Math.max(1, Math.min(500, Math.round(quantity) || 1));
  const pricing = calculatePresetPricing(
    preset,
    materialId,
    safeQuantity,
    effectiveDims,
  );
  const formula = formatDimensionFormula(preset.partType, effectiveDims);
  const currentMinWallMm = calculateMinWallMm(preset.partType, effectiveDims);
  const wallValid = isManifoldWallValid(preset.partType, effectiveDims);

  function handleSaveDims() {
    if (!wallValid) {
      toast.error(
        `Недопустимая толщина стенки (${currentMinWallMm.toFixed(1)} мм). Минимум 2.0 мм.`,
      );
      return;
    }
    setDims(effectiveDims);
    setIsEditingDims(false);
    onUpdatePreset?.(preset.id, { materialId, dimensions: effectiveDims });
    toast.success(
      `Параметры пресета ${preset.presetCode} обновлены: ${formula}`,
    );
  }

  return (
    <article
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={cn(
        "group relative flex h-full flex-col justify-between gap-4 rounded-[16px] border bg-[#161920] p-4 transition-all duration-200 sm:p-5",
        hovered
          ? "border-[#00D1FF]/60 shadow-[0_0_24px_rgba(0,209,255,0.08)]"
          : "border-[#262B36]",
        className,
      )}
    >
      <div className="flex flex-col gap-3.5">
        {/* Верхняя мета-строка: код пресета, категория, кнопка удаления */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CopyableChip
              value={preset.presetCode}
              tooltipText="Скопировать код пресета"
            />
            <span className="font-mono text-[11px] text-[#8A93A2]">
              {preset.categoryLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsEditingDims((v) => !v)}
              aria-pressed={isEditingDims}
              aria-label="Настроить размеры пресета"
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-lg border px-2 font-mono text-[11px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]",
                isEditingDims
                  ? "border-[#00D1FF] bg-[#00D1FF]/15 text-[#00D1FF]"
                  : "border-[#262B36] bg-[#0E1014] text-[#8A93A2] hover:border-[#00D1FF]/50 hover:text-[#F2F4F7]",
              )}
            >
              <SlidersHorizontal className="size-3" />
              CAD
            </button>

            {onDeletePreset && (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <button
                      type="button"
                      aria-label={`Удалить пресет ${preset.title}`}
                      className="inline-flex size-7 items-center justify-center rounded-lg border border-[#262B36] bg-[#0E1014] text-[#8A93A2] transition-colors hover:border-red-500/50 hover:text-red-400"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  }
                />
                <AlertDialogContent className="border border-[#262B36] bg-[#161920] text-[#F2F4F7]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Удалить параметрический пресет?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[#8A93A2]">
                      Пресет «{preset.title}» ({preset.presetCode}) будет удален
                      из библиотеки. История прошлых заказов сохранится.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-[#262B36] bg-[#0E1014] text-[#F2F4F7]">
                      Отмена
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDeletePreset(preset.id)}
                      className="bg-[#FF5C1A] text-[#0E1014] hover:bg-[#FF6A2E]"
                    >
                      Удалить пресет
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Интерактивный CAD-чертеж */}
        <PartSchematicPreview
          partType={preset.partType}
          dimensionLabel={formula}
          materialCode={pricing.material.code}
          hovered={hovered || isEditingDims}
        />

        {/* Название и техническая заметка */}
        <div>
          <h3 className="text-base font-bold tracking-tight text-[#F2F4F7]">
            {preset.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#8A93A2]">
            {preset.notes}
          </p>
        </div>

        {/* Габаритная формула + копирование + бейдж Manifold */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3 py-2 font-mono text-xs tabular-nums">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#8A93A2]">Габарит:</span>
            <CopyableChip value={formula} tooltipText="Скопировать размеры" />
          </div>
          {wallValid ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#10B981]">
              <ShieldCheck className="size-3.5" />
              Стенка ≥{currentMinWallMm.toFixed(1)} мм
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#F59E0B]">
              <AlertTriangle className="size-3.5" />
              Стенка {currentMinWallMm.toFixed(1)} мм &lt; 2.0 мм
            </span>
          )}
        </div>

        {/* Быстрая корректировка размеров D1 / D2 / H без ухода со страницы */}
        {isEditingDims && (
          <div className="space-y-2.5 rounded-[12px] border border-[#00D1FF]/40 bg-[#0E1014] p-3 font-mono text-xs tabular-nums">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#00D1FF] uppercase">
                Корректировка параметров (мм)
              </span>
              <button
                type="button"
                disabled={!wallValid}
                onClick={handleSaveDims}
                className="inline-flex items-center gap-1 rounded bg-[#10B981]/15 px-2 py-0.5 text-[11px] font-semibold text-[#10B981] hover:bg-[#10B981]/25 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check className="size-3" />
                Фиксировать
              </button>
            </div>

            {(["d1", "d2", "h"] as const).map((key) => {
              const meta = preset.dimensions[key];
              const maxAllowed =
                key === "d2" && isBorePart
                  ? Math.max(
                      meta.min,
                      Math.min(meta.max, clampBore(effectiveDims.d1, meta.max)),
                    )
                  : meta.max;
              return (
                <div key={key} className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#8A93A2]">{meta.label}</span>
                    <span className="font-bold text-[#F2F4F7]">
                      {effectiveDims[key]} мм
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label={meta.label}
                    min={meta.min}
                    max={maxAllowed}
                    value={effectiveDims[key]}
                    onChange={(e) => {
                      const nextVal = Number(e.target.value);
                      setDims((prev) => {
                        const updated = {
                          ...prev,
                          [key]: nextVal,
                        };
                        if (isBorePart) {
                          updated.d2 = Math.max(
                            preset.dimensions.d2.min,
                            clampBore(updated.d1, updated.d2),
                          );
                        }
                        return updated;
                      });
                    }}
                    className="lab-slider w-full"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Нижний пульт: выбор материала, тираж, цена и заказ в 1 клик */}
      <div className="flex flex-col gap-3 border-t border-[#262B36] pt-3.5">
        {/* Переключатель полимера */}
        <div className="grid grid-cols-4 gap-1 rounded-[10px] border border-[#262B36] bg-[#0E1014] p-1 font-mono text-[11px]">
          {MATERIALS.map((mat) => {
            const active = mat.id === materialId;
            return (
              <button
                key={mat.id}
                type="button"
                onClick={() => setMaterialId(mat.id)}
                aria-pressed={active}
                className={cn(
                  " truncate rounded-md px-1.5 py-1 text-center font-medium transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[#00D1FF]",
                  active
                    ? "bg-[#161920] text-[#00D1FF] shadow-xs"
                    : "text-[#8A93A2] hover:text-[#F2F4F7]",
                )}
              >
                {mat.code.replace(" Nylon", "")}
              </button>
            );
          })}
        </div>

        {/* Метрики веса и времени + выбор количества */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col font-mono text-[11px] text-[#8A93A2] tabular-nums">
            <span className="inline-flex items-center gap-1">
              <Scale className="size-3 text-[#00D1FF]" />
              {numberFmt.format(pricing.unitMassGrams)} г/шт. · Всего{" "}
              <strong className="text-[#F2F4F7]">
                {numberFmt.format(pricing.totalMassGrams)} г
              </strong>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3 text-[#FF5C1A]" />
              Цикл ~{pricing.printHours} ч · Заказов: {preset.totalOrdersCount}
            </span>
          </div>

          {/* Счетчик партии */}
          <div className="flex h-9 items-center rounded-[10px] border border-[#262B36] bg-[#0E1014] font-mono tabular-nums">
            <button
              type="button"
              aria-label="Уменьшить партию"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex size-9 items-center justify-center text-[#8A93A2] transition-colors hover:text-[#F2F4F7] disabled:opacity-40"
            >
              <Minus className="size-3.5" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              step={1}
              aria-label="Количество деталей в партии"
              min={1}
              max={500}
              value={safeQuantity}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                if (!Number.isFinite(parsed)) {
                  setQuantity(1);
                  return;
                }
                setQuantity(
                  Math.max(1, Math.min(500, Math.round(parsed) || 1)),
                );
              }}
              className="w-11 [appearance:textfield] bg-transparent text-center text-xs font-bold text-[#F2F4F7] outline-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              aria-label="Увеличить партию"
              onClick={() => setQuantity((q) => Math.min(500, q + 1))}
              className="flex size-9 items-center justify-center text-[#8A93A2] transition-colors hover:text-[#F2F4F7]"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Цена и CTA запуска в печать */}
        <div className="flex items-end justify-between gap-3 pt-1">
          <div className="font-mono tabular-nums">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-[#F2F4F7]">
                {numberFmt.format(pricing.totalPriceRub)} ₽
              </span>
              {pricing.discountApplied && (
                <span className="rounded border border-[#10B981]/40 bg-[#10B981]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#10B981]">
                  −20% серия
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#8A93A2]">
              {numberFmt.format(pricing.unitPriceRub)} ₽ / шт. ·{" "}
              {pricing.discountApplied
                ? "Серийный тариф активен"
                : "от 10 шт. скидка −20%"}
            </p>
          </div>

          <button
            type="button"
            disabled={!wallValid}
            onClick={() => {
              if (!Number.isInteger(safeQuantity) || safeQuantity < 1) {
                toast.error(
                  "Укажите целое количество деталей (от 1 до 500 шт.)",
                );
                return;
              }
              if (!wallValid) {
                toast.error(
                  "Невозможно отправить в печать: толщина стенки меньше 2.0 мм",
                );
                return;
              }
              onOrderPreset(preset, {
                materialId,
                quantity: safeQuantity,
                dimensions: effectiveDims,
                totalPriceRub: pricing.totalPriceRub,
              });
            }}
            className="cta-border-beam inline-flex h-10 items-center gap-1.5 rounded-[12px] bg-[#FF5C1A] px-4 font-mono text-xs font-semibold text-[#0E1014] transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Repeat className="size-3.5" />В печать
          </button>
        </div>
      </div>
    </article>
  );
}
