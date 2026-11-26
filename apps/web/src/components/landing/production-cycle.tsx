"use client";

import { cn } from "@paramlab/ui";
import { CheckCircle2, PackageCheck, SlidersHorizontal } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { PRODUCTION_CYCLE } from "~/components/landing/data";
import { LayerReveal } from "~/components/landing/layer-reveal";

const STEP_ICONS = [SlidersHorizontal, CheckCircle2, PackageCheck];

export function ProductionCycle() {
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const progressPercent =
    activeIndex === 0 ? 33.33 : activeIndex === 1 ? 66.66 : 100;

  return (
    <section
      id="workflow"
      className="scroll-mt-14 border-b border-lab-border bg-lab-bg py-16 text-lab-text lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-xs tracking-widest text-lab-ready uppercase">
            03 · Автоматизированный цикл производства
          </p>
          <h2 className="max-w-3xl text-2xl font-bold tracking-tight text-balance sm:text-3xl lg:text-4xl">
            От параметров в браузере до готовой детали в ПВЗ
          </h2>
          <p className="max-w-2xl text-base text-lab-muted">
            Прямой конвейер CAD → G-Code → Термокамера без переписки с
            менеджерами и ожидания ручного просчета.
          </p>
        </div>

        {/* Горизонтальная линия прогресса */}
        <div className="mt-10 rounded-[24px] border border-lab-border bg-lab-surface p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-2">
            <div className="flex items-center justify-between font-mono text-xs text-lab-muted tabular-nums">
              <span>PIPELINE STATUS · ACTIVE</span>
              <span className="text-lab-cyan">
                ЭТАП {activeIndex + 1} ИЗ {PRODUCTION_CYCLE.length}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-lab-bg">
              <motion.div
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.36, ease: [0.22, 1, 0.36, 1] }
                }
                className="h-full rounded-full bg-gradient-to-r from-brand via-brand to-lab-cyan shadow-[0_0_14px_var(--brand)]"
              />
            </div>
          </div>

          <ol className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {PRODUCTION_CYCLE.map((item, idx) => {
              const Icon = STEP_ICONS[idx] ?? SlidersHorizontal;
              const isActive = idx <= activeIndex;
              return (
                <LayerReveal
                  as="li"
                  key={item.step}
                  delay={idx * 0.08}
                  onPointerEnter={() => setActiveIndex(idx)}
                  className={cn(
                    "flex h-full flex-col justify-between gap-5 rounded-[16px] border p-5 transition-all duration-360 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    idx === activeIndex
                      ? "border-brand bg-lab-bg"
                      : "border-lab-border bg-lab-bg/60 hover:border-lab-muted/50",
                  )}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          aria-current={
                            idx === activeIndex ? "step" : undefined
                          }
                          onClick={() => setActiveIndex(idx)}
                          className={cn(
                            "flex size-9 items-center justify-center rounded-lg border font-mono text-sm font-bold tabular-nums transition-colors duration-240",
                            isActive
                              ? "border-brand bg-brand text-brand-foreground"
                              : "border-lab-border bg-lab-surface text-lab-muted",
                          )}
                        >
                          {item.step}
                        </button>
                        <Icon
                          className={cn(
                            "size-5",
                            idx === activeIndex
                              ? "text-brand"
                              : "text-lab-cyan",
                          )}
                        />
                      </div>
                      <span className="rounded-md border border-lab-border bg-lab-surface px-2.5 py-1 font-mono text-xs font-semibold text-lab-cyan tabular-nums">
                        {item.metric}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="font-mono text-[11px] text-lab-muted">
                        {item.code}
                      </span>
                      <h3 className="text-lg font-bold tracking-tight text-lab-text">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-lab-muted">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-lab-border pt-3 font-mono text-[11px] tabular-nums">
                    <span className="text-lab-muted">Контроль этапа</span>
                    <span
                      className={cn(
                        "font-semibold",
                        idx === activeIndex ? "text-brand" : "text-lab-ready",
                      )}
                    >
                      {idx === 0
                        ? "CAD → Mesh 0.1 мм"
                        : idx === 1
                          ? "Manifold OK"
                          : "Ozon РФ"}
                    </span>
                  </div>
                </LayerReveal>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
