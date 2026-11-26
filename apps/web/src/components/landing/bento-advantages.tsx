"use client";

import { CheckCircle2, ShieldCheck, Truck } from "lucide-react";
import { MATERIALS } from "~/components/landing/data";
import { LayerReveal } from "~/components/landing/layer-reveal";

/**
 * 1. Микро-визуализация шкалы нониусного штангенциркуля / допусков 0.1 мм.
 */
function VernierCaliperVisual() {
  const ticks = Array.from({ length: 25 }, (_, i) => i);
  return (
    <div className="relative overflow-hidden rounded-[12px] border border-lab-border bg-lab-bg p-4">
      <div className="mb-2.5 flex items-center justify-between font-mono text-[11px] tabular-nums">
        <span className="text-lab-muted">VERNIER SCALE · ISO 2768-mK</span>
        <span className="rounded border border-lab-cyan/40 bg-lab-cyan/10 px-1.5 py-0.5 font-semibold text-lab-cyan">
          Δ = ±0.10 мм
        </span>
      </div>
      <svg
        viewBox="0 0 320 74"
        role="img"
        aria-label="Шкала штангенциркуля с точностью 0.1 мм"
        className="h-auto w-full"
      >
        {/* Основная линейка */}
        <rect
          x="4"
          y="6"
          width="312"
          height="32"
          rx="4"
          fill="var(--lab-surface)"
          stroke="var(--lab-border)"
        />
        {ticks.map((t) => {
          const x = 14 + t * 12;
          const isMajor = t % 5 === 0;
          return (
            <g key={t}>
              <line
                x1={x}
                y1={38}
                x2={x}
                y2={isMajor ? 18 : 26}
                stroke={t === 15 ? "var(--lab-cyan)" : "var(--lab-muted)"}
                strokeWidth={isMajor ? 1.5 : 1}
              />
              {isMajor && (
                <text
                  x={x}
                  y={15}
                  textAnchor="middle"
                  className="fill-lab-text font-mono text-[8px]"
                >
                  {t * 2}
                </text>
              )}
            </g>
          );
        })}

        {/* Рамка нониуса с совпадением на отметке 30.1 мм */}
        <rect
          x="166"
          y="38"
          width="112"
          height="28"
          rx="4"
          fill="var(--lab-bg)"
          stroke="var(--brand)"
          strokeWidth="1.2"
        />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => {
          const nx = 178 + n * 12;
          const active = n === 1;
          return (
            <g key={n}>
              <line
                x1={nx}
                y1={38}
                x2={nx}
                y2={active ? 54 : 49}
                stroke={active ? "var(--brand)" : "var(--lab-muted)"}
                strokeWidth={active ? 1.8 : 1}
              />
            </g>
          );
        })}
        {/* Линия лазерного совпадения 0.1 мм */}
        <line
          x1="190"
          y1="8"
          x2="190"
          y2="64"
          stroke="var(--lab-cyan)"
          strokeWidth="1.2"
          strokeDasharray="2 2"
        />
        <circle cx="190" cy="38" r="3" fill="var(--brand)" />
        <text
          x="222"
          y="59"
          textAnchor="middle"
          className="fill-brand font-mono text-[9px] font-bold"
        >
          30.1 мм · H8
        </text>
      </svg>
    </div>
  );
}

/**
 * 2. Мини-сравнение прочности и термостойкости инженерных пластиков.
 */
function MaterialsBenchmarkVisual() {
  return (
    <div className="flex flex-col gap-2.5 rounded-[12px] border border-lab-border bg-lab-bg p-4">
      <div className="flex items-center justify-between font-mono text-[11px] text-lab-muted">
        <span>ПРОЧНОСТЬ (МПа)</span>
        <span>ТЕРМОСТОЙКОСТЬ (°C)</span>
      </div>
      {MATERIALS.map((mat) => {
        const strengthPct = Math.round((mat.strengthMpa / 95) * 100);
        const tempPct = Math.round((mat.maxTempC / 150) * 100);
        return (
          <div key={mat.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between font-mono text-xs tabular-nums">
              <span className="font-semibold text-lab-text">{mat.code}</span>
              <span className="text-[11px] text-lab-muted">
                {mat.strengthMpa} МПа ·{" "}
                <strong className="text-lab-cyan">{mat.maxTempC} °C</strong>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="h-1.5 overflow-hidden rounded-full bg-lab-surface">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${strengthPct}%` }}
                />
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-lab-surface">
                <div
                  className="h-full rounded-full bg-lab-cyan"
                  style={{ width: `${tempPct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 3. Визуализация проверки геометрии и замкнутости сетки (Manifold OK).
 */
function ManifoldCheckVisual() {
  return (
    <div className="flex flex-col gap-3 rounded-[12px] border border-lab-border bg-lab-bg p-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-lab-ready/40 bg-lab-ready/10 px-2.5 py-1 font-mono text-xs font-semibold text-lab-ready">
          <ShieldCheck className="size-3.5" />
          Manifold OK
        </span>
        <span className="font-mono text-[11px] text-lab-muted tabular-nums">
          0 open edges
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 font-mono text-[11px] tabular-nums">
        <div className="rounded-lg border border-lab-border bg-lab-surface p-2">
          <p className="text-lab-muted">Нормали</p>
          <p className="mt-0.5 flex items-center gap-1 font-semibold text-lab-ready">
            <CheckCircle2 className="size-3" /> 100%
          </p>
        </div>
        <div className="rounded-lg border border-lab-border bg-lab-surface p-2">
          <p className="text-lab-muted">Стенка min</p>
          <p className="mt-0.5 font-semibold text-lab-text">≥ 2.0 мм</p>
        </div>
        <div className="rounded-lg border border-lab-border bg-lab-surface p-2">
          <p className="text-lab-muted">Нависания</p>
          <p className="mt-0.5 font-semibold text-lab-cyan">&lt; 45° OK</p>
        </div>
      </div>
    </div>
  );
}

/**
 * 4. Визуализация доставки по РФ через Ozon.
 */
function LogisticsVisual() {
  return (
    <div className="flex flex-col gap-3 rounded-[12px] border border-lab-border bg-lab-bg p-4">
      <div className="flex items-center justify-between font-mono text-[11px]">
        <span className="text-lab-muted">DISPATCH HUB · RU</span>
        <span className="text-lab-ready">ОТГРУЗКА ЗА 24–48 Ч</span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 font-mono text-xs tabular-nums">
        <div className="flex flex-col gap-1 rounded-lg border border-lab-cyan/30 bg-lab-cyan/5 p-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-lab-cyan">OZON ПВЗ</span>
            <Truck className="size-3.5 text-lab-cyan" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-lab-muted">
              18 000+ точек · 2–3 дня
            </span>
            <span className="font-semibold text-lab-text">от 199 ₽</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BentoAdvantages() {
  return (
    <section
      id="advantages"
      className="scroll-mt-14 border-b border-lab-border bg-lab-bg py-16 text-lab-text lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-xs tracking-widest text-lab-cyan uppercase">
            01 · Инженерный стандарт лаборатории
          </p>
          <h2 className="max-w-3xl text-2xl font-bold tracking-tight text-balance sm:text-3xl lg:text-4xl">
            Метрологическая точность и контроль каждого слоя
          </h2>
          <p className="max-w-2xl text-base text-lab-muted">
            Никаких бытовых принтеров на открытом воздухе: печатаем в закрытых
            термокамерах 65 °C с прямой подачей филамента из сушильных станций.
          </p>
        </div>

        {/* 12-колоночная Bento-сетка из 4 модульных карточек с микро-визуализациями */}
        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Карточка 1: Точность до 0.1 мм */}
          <LayerReveal delay={0} className="lg:col-span-7">
            <article className="flex h-full flex-col justify-between gap-6 rounded-[24px] border border-lab-border bg-lab-surface p-6 sm:p-7">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-lab-muted">
                    METROLOGY · 01
                  </span>
                  <span className="rounded-md border border-lab-border bg-lab-bg px-2 py-0.5 font-mono text-xs text-lab-cyan tabular-nums">
                    CoreXY · 1.5GT
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-lab-text">
                  Точность посадок до <span className="font-mono">0.1 мм</span>
                </h3>
                <p className="text-sm leading-relaxed text-lab-muted">
                  Индивидуальная компенсация тепловой усадки полимера позволяет
                  печатать посадочные гнезда под подшипники и валы без доработки
                  напильником.
                </p>
              </div>
              <VernierCaliperVisual />
            </article>
          </LayerReveal>

          {/* Карточка 2: Инженерные пластики */}
          <LayerReveal delay={0.08} className="lg:col-span-5">
            <article className="flex h-full flex-col justify-between gap-6 rounded-[24px] border border-lab-border bg-lab-surface p-6 sm:p-7">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-lab-muted">
                    POLYMERS · 02
                  </span>
                  <span className="rounded-md border border-lab-border bg-lab-bg px-2 py-0.5 font-mono text-xs text-brand">
                    Сушка 80 °C
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-lab-text">
                  Инженерные пластики: PETG, ABS, Nylon, CF
                </h3>
                <p className="text-sm leading-relaxed text-lab-muted">
                  Конструкционные и угленаполненные композиты для замены
                  алюминиевых и капролоновых деталей в механизмах.
                </p>
              </div>
              <MaterialsBenchmarkVisual />
            </article>
          </LayerReveal>

          {/* Карточка 3: Автоматическая проверка геометрии (Manifold OK) */}
          <LayerReveal delay={0.14} className="lg:col-span-6">
            <article className="flex h-full flex-col justify-between gap-6 rounded-[24px] border border-lab-border bg-lab-surface p-6 sm:p-7">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-lab-muted">
                    MESH VALIDATION · 03
                  </span>
                  <span className="font-mono text-xs text-lab-ready">
                    Auto-Slice Check
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-lab-text">
                  Автоматическая проверка геометрии перед печатью
                </h3>
                <p className="text-sm leading-relaxed text-lab-muted">
                  Алгоритм проверяет замкнутость полигональной сетки,
                  минимальную толщину стенок и концентраторы напряжений еще на
                  этапе конфигурации.
                </p>
              </div>
              <ManifoldCheckVisual />
            </article>
          </LayerReveal>

          {/* Карточка 4: Доставка по РФ через Ozon */}
          <LayerReveal delay={0.2} className="lg:col-span-6">
            <article className="flex h-full flex-col justify-between gap-6 rounded-[24px] border border-lab-border bg-lab-surface p-6 sm:p-7">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-lab-muted">
                    LOGISTICS · 04
                  </span>
                  <span className="font-mono text-xs text-lab-cyan tabular-nums">
                    РФ · 11 часовых поясов
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-lab-text">
                  Доставка по РФ через Ozon
                </h3>
                <p className="text-sm leading-relaxed text-lab-muted">
                  Перед упаковкой присылаем реальное фото детали со
                  штангенциркулем, затем отправляем заказ в удобный пункт выдачи
                  рядом с вашим домом или цехом.
                </p>
              </div>
              <LogisticsVisual />
            </article>
          </LayerReveal>
        </div>
      </div>
    </section>
  );
}
