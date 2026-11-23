"use client";

import { cn } from "@paramlab/ui";
import { ArrowUpRight, RotateCcw } from "lucide-react";

export interface EmptyBlueprintStateProps {
  code?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyBlueprintState({
  code = "CAD_VIEWPORT // ZERO_MATCH",
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  secondaryLabel,
  onSecondaryAction,
  className,
}: EmptyBlueprintStateProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[16px] border border-dashed border-[#262B36] bg-[#161920]/75 p-8 text-center sm:p-12",
        className,
      )}
    >
      {/* Миллиметровая CAD-сетка на фоне */}
      <div
        aria-hidden="true"
        className="bg-blueprint-fine pointer-events-none absolute inset-0 opacity-60"
      />

      <div className="relative z-10 mx-auto flex max-w-md flex-col items-center">
        {/* Изометрическая векторная иллюстрация чертежа */}
        <div className="relative mb-5 flex size-24 items-center justify-center rounded-2xl border border-[#262B36] bg-[#0E1014] shadow-inner">
          <svg
            viewBox="0 0 96 96"
            aria-hidden="true"
            className="size-16"
            fill="none"
          >
            {/* Оси координат */}
            <line
              x1="12"
              y1="48"
              x2="84"
              y2="48"
              stroke="#262B36"
              strokeDasharray="3 3"
            />
            <line
              x1="48"
              y1="12"
              x2="48"
              y2="84"
              stroke="#262B36"
              strokeDasharray="3 3"
            />
            {/* Изометрический контур втулки / детали */}
            <polygon
              points="48,18 76,34 76,62 48,78 20,62 20,34"
              stroke="#00D1FF"
              strokeWidth="1.5"
              fill="rgba(0, 209, 255, 0.06)"
            />
            <polyline
              points="20,34 48,50 76,34"
              stroke="#00D1FF"
              strokeWidth="1.3"
            />
            <line
              x1="48"
              y1="50"
              x2="48"
              y2="78"
              stroke="#00D1FF"
              strokeWidth="1.3"
            />
            {/* Внутренний посадочный канал */}
            <ellipse
              cx="48"
              cy="34"
              rx="11"
              ry="6"
              stroke="#FF5C1A"
              strokeWidth="1.5"
            />
            {/* Выносные размерные метки */}
            <circle cx="48" cy="18" r="2.2" fill="#00D1FF" />
            <circle cx="76" cy="34" r="2.2" fill="#00D1FF" />
            <circle cx="20" cy="62" r="2.2" fill="#FF5C1A" />
          </svg>
          <span className="absolute -bottom-2 rounded border border-[#00D1FF]/40 bg-[#0E1014] px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-[#00D1FF] uppercase">
            ±0.1 MM
          </span>
        </div>

        <span className="font-mono text-[11px] tracking-widest text-[#00D1FF] uppercase">
          {code}
        </span>

        <h3 className="mt-2 text-lg font-bold tracking-tight text-[#F2F4F7]">
          {title}
        </h3>

        <p className="mt-1.5 text-sm leading-relaxed text-[#8A93A2]">
          {description}
        </p>

        {(actionLabel || secondaryLabel) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {secondaryLabel && onSecondaryAction && (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-[#262B36] bg-[#0E1014] px-4 font-mono text-xs font-medium text-[#F2F4F7] transition-colors hover:border-[#8A93A2] hover:text-[#F2F4F7]"
              >
                <RotateCcw className="size-3.5 text-[#00D1FF]" />
                {secondaryLabel}
              </button>
            )}

            {actionLabel && actionHref && (
              <a
                href={actionHref}
                className="cta-border-beam inline-flex h-10 items-center gap-2 rounded-[12px] bg-[#FF5C1A] px-4 text-xs font-semibold text-[#0E1014] transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]"
              >
                {actionLabel}
                <ArrowUpRight className="size-4" />
              </a>
            )}

            {actionLabel && !actionHref && onAction && (
              <button
                type="button"
                onClick={onAction}
                className="cta-border-beam inline-flex h-10 items-center gap-2 rounded-[12px] bg-[#FF5C1A] px-4 text-xs font-semibold text-[#0E1014] transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]"
              >
                {actionLabel}
                <ArrowUpRight className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
