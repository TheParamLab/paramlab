"use client";

import { cn } from "@paramlab/ui";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Minus,
  Plus,
  Scale,
  Settings2,
} from "lucide-react";
import { useRef, useState } from "react";
import { CadViewport3D } from "~/components/landing/cad-viewport";
import { useCalculator } from "~/components/landing/calculator-context";
import {
  type DimensionKey,
  HERO_PART_TYPES,
  MATERIALS,
  PART_TYPES,
  type PartTypeId,
} from "~/components/landing/data";
import { SpringNumber } from "~/components/landing/layer-reveal";
import { OrderSpecModal } from "~/components/landing/order-modal";
import {
  calcPrice,
  clampBore,
  estimateMass,
  SERIES_QUANTITY,
} from "~/components/landing/pricing";

const DIMENSION_KEYS: readonly DimensionKey[] = ["d1", "d2", "h"];

const TEMPLATE_ICONS: Record<PartTypeId, typeof Settings2> = {
  bushing: Layers,
  "din-box": Cpu,
  gear: Settings2,
  adapter: Layers,
  "end-cap": Cpu,
  bracket: Settings2,
  organizer: Layers,
};

const numberFmt = new Intl.NumberFormat("ru-RU");

function formatPrintTime(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

export function Hero() {
  const {
    partType,
    setPartType,
    materialId,
    setMaterialId,
    dimensions,
    setDimension,
    setActiveDimension,
    quantity,
    setQuantity,
    setOrderModalOpen,
  } = useCalculator();

  const [cursorPos, setCursorPos] = useState({ x: 520, y: 320 });

  const part = PART_TYPES.find((p) => p.id === partType) ?? PART_TYPES[0];
  const material = MATERIALS.find((m) => m.id === materialId) ?? MATERIALS[0];

  const massGrams = estimateMass(partType, dimensions, material.density);
  const price = calcPrice({
    massGrams,
    rate: material.rate,
    quantity,
    extras: 0,
  });

  // Инженерная валидация параметров (контроль толщины стенки и посадки)
  const effectiveBore =
    partType === "bushing" || partType === "gear"
      ? clampBore(dimensions.d1, dimensions.d2)
      : dimensions.d2;

  const rawWall =
    partType === "bushing" || partType === "gear"
      ? (dimensions.d1 - effectiveBore) / 2
      : partType === "adapter"
        ? 2.8
        : Math.min(dimensions.d1, dimensions.d2) * 0.08;

  const isWallClamped =
    (partType === "bushing" || partType === "gear") &&
    effectiveBore < dimensions.d2;

  const isThinWallWarning =
    isWallClamped ||
    ((partType === "bushing" ||
      partType === "gear" ||
      partType === "adapter") &&
      rawWall < 3.5);

  const heroTemplates = HERO_PART_TYPES.map(
    (id) => PART_TYPES.find((item) => item.id === id) ?? PART_TYPES[0],
  );

  const templateTabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleTemplateKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const currentIndex = heroTemplates.findIndex((t) => t.id === partType);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex =
      (currentIndex + direction + heroTemplates.length) % heroTemplates.length;
    const nextId = heroTemplates[nextIndex]?.id;
    if (nextId) {
      setPartType(nextId);
      templateTabRefs.current[nextIndex]?.focus();
    }
  }

  return (
    <section
      id="top"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setCursorPos({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }}
      className="relative overflow-hidden border-b border-[#262B36] bg-[#0E1014] text-[#F2F4F7]"
    >
      {/* Базовая чертежная миллиметровка (opacity: 0.06) */}
      <div
        aria-hidden="true"
        className="bg-blueprint pointer-events-none absolute inset-0 opacity-[0.06]"
      />

      {/* Эффект светового стола: радиальная подсветка миллиметровки за курсором */}
      <div
        aria-hidden="true"
        style={{
          maskImage: `radial-gradient(480px circle at ${cursorPos.x}px ${cursorPos.y}px, black 0%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(480px circle at ${cursorPos.x}px ${cursorPos.y}px, black 0%, transparent 100%)`,
        }}
        className="bg-blueprint pointer-events-none absolute inset-0 opacity-[0.18] transition-opacity duration-300"
      />
      <div
        aria-hidden="true"
        style={{
          background: `radial-gradient(560px circle at ${cursorPos.x}px ${cursorPos.y}px, rgba(0, 209, 255, 0.08), rgba(255, 92, 26, 0.03) 45%, transparent 80%)`,
        }}
        className="pointer-events-none absolute inset-0"
      />

      <section
        id="calculator"
        tabIndex={-1}
        aria-label="Параметрический 3D-конфигуратор"
        className="relative mx-auto max-w-7xl scroll-mt-16 px-4 pt-8 pb-16 outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF] sm:px-6 lg:px-8 lg:pt-12 lg:pb-20"
      >
        {/* Верхняя техническая строка состояния лаборатории */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#262B36] bg-[#161920] px-3 py-1 font-mono text-xs text-[#8A93A2]">
            <span className="size-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
            <span>PARAMETRIC CAD ENGINE v4.2</span>
            <span className="text-[#262B36]">·</span>
            <span className="text-[#00D1FF]">ДОПУСК ±0.1 ММ</span>
          </div>
          <div className="hidden items-center gap-4 font-mono text-xs text-[#8A93A2] sm:flex">
            <span>КАМЕРА: 320×320×300 ММ</span>
            <span className="text-[#262B36]">/</span>
            <span>ОТГРУЗКА: OZON</span>
          </div>
        </div>

        {/* 12-колоночная сетка: Левая колонка (Конфигуратор) + Правая колонка (3D CAD-вьюпорт) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* ЛЕВАЯ КОЛОНКА (6 колонок) */}
          <div className="flex flex-col gap-6 lg:col-span-6">
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl leading-[1.08] font-bold tracking-tight text-balance text-[#F2F4F7] sm:text-4xl xl:text-[44px]">
                Детали по вашим размерам.{" "}
                <span className="text-[#8A93A2]">Без 3D-моделирования</span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-[#8A93A2]">
                Задайте габариты в параметрическом конфигураторе — CAD-ядро
                перестроит геометрию в реальном времени, проверит стенки на
                прочность и зафиксирует цену печати с точностью до{" "}
                <span className="font-mono text-[#00D1FF]">0.1 мм</span>.
              </p>
            </div>

            {/* Панель управления параметрами */}
            <div className="flex flex-col gap-5 rounded-[24px] border border-[#262B36] bg-[#161920] p-5 sm:p-6">
              {/* 1. Переключатель 3 базовых шаблонов */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium tracking-wider text-[#8A93A2] uppercase">
                    01 · Базовый CAD-шаблон
                  </span>
                  <span className="font-mono text-[11px] text-[#00D1FF] tabular-nums">
                    {part.code}
                  </span>
                </div>
                <div
                  role="tablist"
                  aria-label="Выбор базового шаблона детали"
                  onKeyDown={handleTemplateKeyDown}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                >
                  {heroTemplates.map((item, idx) => {
                    const Icon = TEMPLATE_ICONS[item.id];
                    const selected = partType === item.id;
                    return (
                      <button
                        key={item.id}
                        ref={(el) => {
                          templateTabRefs.current[idx] = el;
                        }}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => setPartType(item.id)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-[12px] border px-3 py-2.5 text-sm font-medium transition-all duration-240 outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]",
                          selected
                            ? "border-[#FF5C1A] bg-[#FF5C1A]/15 text-[#F2F4F7] shadow-[0_0_20px_rgba(255,92,26,0.16)]"
                            : "border-[#262B36] bg-[#0E1014]/70 text-[#8A93A2] hover:border-[#8A93A2]/50 hover:text-[#F2F4F7]",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-4 shrink-0",
                            selected ? "text-[#FF5C1A]" : "text-[#8A93A2]",
                          )}
                        />
                        <span className="truncate">{item.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Выбор материала: PETG, ABS, PA12 Nylon, PETG-CF */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium tracking-wider text-[#8A93A2] uppercase">
                    02 · Инженерный полимер
                  </span>
                  <span className="font-mono text-[11px] text-[#8A93A2] tabular-nums">
                    ρ = {material.density} г/см³ · {material.temp}
                  </span>
                </div>
                <fieldset
                  aria-label="Выбор материала печати"
                  className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                >
                  {MATERIALS.map((item) => {
                    const selected = materialId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setMaterialId(item.id)}
                        className={cn(
                          "flex flex-col items-start gap-1 rounded-[12px] border p-2.5 text-left transition-all duration-240 outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]",
                          selected
                            ? "border-[#00D1FF] bg-[#00D1FF]/10 text-[#F2F4F7]"
                            : "border-[#262B36] bg-[#0E1014]/60 text-[#8A93A2] hover:border-[#8A93A2]/40 hover:text-[#F2F4F7]",
                        )}
                      >
                        <div className="flex w-full items-center justify-between gap-1">
                          <span className="font-mono text-xs font-semibold text-[#F2F4F7]">
                            {item.code}
                          </span>
                          <span
                            aria-hidden="true"
                            className="size-2.5 rounded-full border border-[#F2F4F7]/30"
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-[#8A93A2] tabular-nums">
                          {item.rate} ₽/г · {item.temp}
                        </span>
                      </button>
                    );
                  })}
                </fieldset>
              </div>

              {/* 3. Три тактильных слайдера параметров (D, T, H) */}
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium tracking-wider text-[#8A93A2] uppercase">
                    03 · Геометрия детали (шаг 1.0 мм)
                  </span>
                  <span className="font-mono text-[11px] text-[#10B981]">
                    Сетка замкнута
                  </span>
                </div>

                {DIMENSION_KEYS.map((key) => {
                  const meta = part.dimensions[key];
                  const val = dimensions[key];
                  const percent = Math.round(
                    ((val - meta.min) / (meta.max - meta.min)) * 100,
                  );

                  return (
                    <div
                      key={key}
                      className="flex flex-col gap-1.5 rounded-[12px] border border-[#262B36] bg-[#0E1014]/75 px-3.5 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor={`param-slider-${key}`}
                          className="flex items-center gap-2 text-xs font-medium text-[#F2F4F7] sm:text-sm"
                        >
                          <span className="inline-flex size-5 items-center justify-center rounded border border-[#00D1FF]/40 bg-[#00D1FF]/10 font-mono text-[11px] font-bold text-[#00D1FF]">
                            {meta.code}
                          </span>
                          <span>{meta.label}</span>
                        </label>
                        <span className="rounded-md border border-[#262B36] bg-[#161920] px-2 py-0.5 font-mono text-xs font-semibold text-[#F2F4F7] tabular-nums">
                          {val}.0 {meta.unit}
                        </span>
                      </div>

                      <input
                        id={`param-slider-${key}`}
                        type="range"
                        min={meta.min}
                        max={meta.max}
                        step={meta.step}
                        value={val}
                        onChange={(e) =>
                          setDimension(key, Number(e.target.value))
                        }
                        onPointerEnter={() => setActiveDimension(key)}
                        onPointerLeave={() => setActiveDimension(null)}
                        onFocus={() => setActiveDimension(key)}
                        onBlur={() => setActiveDimension(null)}
                        style={{
                          background: `linear-gradient(to right, #FF5C1A 0%, #FF5C1A ${percent}%, #262B36 ${percent}%, #262B36 100%)`,
                        }}
                        className="lab-slider my-1 h-1.5 w-full rounded-full"
                      />

                      <div className="flex justify-between font-mono text-[10px] text-[#8A93A2] tabular-nums">
                        <span>min {meta.min} мм</span>
                        <span>max {meta.max} мм</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 4. Валидация параметров в реальном времени */}
              <div
                role="status"
                aria-live="polite"
                className={cn(
                  "flex items-start gap-2.5 rounded-[12px] border px-3.5 py-2.5 text-xs transition-colors duration-240",
                  isThinWallWarning
                    ? "border-[#FF5C1A]/50 bg-[#FF5C1A]/10 text-[#F2F4F7]"
                    : "border-[#10B981]/30 bg-[#10B981]/10 text-[#F2F4F7]",
                )}
              >
                {isThinWallWarning ? (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#FF5C1A]" />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#10B981]" />
                )}
                <div className="font-mono text-xs leading-relaxed tabular-nums">
                  {isWallClamped ? (
                    <span>
                      <strong className="text-[#FF5C1A]">
                        Контроль тонкой стенки:
                      </strong>{" "}
                      внутренний канал автоматически ограничен до{" "}
                      {clampBore(dimensions.d1, dimensions.d2)} мм (минимальная
                      стенка 2.0 мм).
                    </span>
                  ) : isThinWallWarning ? (
                    <span>
                      <strong className="text-[#FF5C1A]">
                        Предупреждение CAD:
                      </strong>{" "}
                      расчетная стенка {rawWall.toFixed(1)} мм тоньше
                      рекомендуемых 3.5 мм для силовых узлов. Рекомендуем
                      полимер PA12 или PETG-CF.
                    </span>
                  ) : (
                    <span>
                      <strong className="text-[#10B981]">
                        Геометрия валидна:
                      </strong>{" "}
                      толщина стенки {rawWall.toFixed(1)} мм гарантирует
                      монолитное спекание периметров без деформации.
                    </span>
                  )}
                </div>
              </div>

              {/* 5. Блок расчета в реальном времени + CTA */}
              <div className="flex flex-col gap-4 rounded-[16px] border border-[#262B36] bg-[#0E1014] p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="font-mono text-[11px] tracking-wider text-[#8A93A2] uppercase">
                      Финальная стоимость
                    </span>
                    <div
                      aria-live="polite"
                      className="mt-0.5 flex items-baseline gap-2"
                    >
                      <SpringNumber
                        value={price.total}
                        suffix=" ₽"
                        className="text-3xl font-bold tracking-tight text-[#F2F4F7] sm:text-4xl"
                      />
                      {price.series && (
                        <span className="rounded border border-[#10B981]/40 bg-[#10B981]/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#10B981]">
                          −20% серия
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Счетчик тиража */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono text-[10px] text-[#8A93A2] uppercase">
                      Партия (от {SERIES_QUANTITY} шт. −20%)
                    </span>
                    <div className="flex h-9 items-center rounded-lg border border-[#262B36] bg-[#161920]">
                      <button
                        type="button"
                        aria-label="Уменьшить количество"
                        disabled={quantity <= 1}
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="flex size-9 items-center justify-center text-[#8A93A2] transition-colors hover:text-[#F2F4F7] disabled:opacity-40"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-10 text-center font-mono text-xs font-semibold text-[#F2F4F7] tabular-nums">
                        {quantity} шт
                      </span>
                      <button
                        type="button"
                        aria-label="Увеличить количество"
                        onClick={() => setQuantity(Math.min(200, quantity + 1))}
                        className="flex size-9 items-center justify-center text-[#8A93A2] transition-colors hover:text-[#F2F4F7]"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Метрики массы и времени печати */}
                <div className="grid grid-cols-2 gap-2.5 border-t border-[#262B36] pt-3 font-mono text-xs tabular-nums">
                  <div className="flex items-center gap-2 rounded-lg border border-[#262B36]/70 bg-[#161920]/60 px-3 py-2">
                    <Scale className="size-4 shrink-0 text-[#00D1FF]" />
                    <div>
                      <p className="text-[10px] text-[#8A93A2]">
                        Расчетная масса
                      </p>
                      <p className="font-semibold text-[#F2F4F7]">
                        {numberFmt.format(price.totalMass)} г ({material.code})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-[#262B36]/70 bg-[#161920]/60 px-3 py-2">
                    <Clock className="size-4 shrink-0 text-[#FF5C1A]" />
                    <div>
                      <p className="text-[10px] text-[#8A93A2]">Время печати</p>
                      <p className="font-semibold text-[#F2F4F7]">
                        ~{formatPrintTime(price.printHours)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Главная CTA-кнопка с border-beam */}
                <button
                  type="button"
                  onClick={() => setOrderModalOpen(true)}
                  className="cta-border-beam flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#FF5C1A] px-6 text-base font-bold text-[#0E1014] shadow-[0_0_25px_rgba(255,92,26,0.3)] transition-transform duration-240 outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF] active:scale-[0.99]"
                >
                  <span>Заказать печать</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ПРАВАЯ КОЛОНКА: Интерактивный 3D CAD-вьюпорт (6 колонок) */}
          <div className="min-w-0 lg:sticky lg:top-20 lg:col-span-6">
            <CadViewport3D />
          </div>
        </div>
      </section>

      {/* Модальное окно спецификации и доставки (Ozon) */}
      <OrderSpecModal />
    </section>
  );
}
