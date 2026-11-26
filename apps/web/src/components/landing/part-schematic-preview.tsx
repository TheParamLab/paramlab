"use client";

import { cn } from "@paramlab/ui";
import type { PartTypeId } from "~/components/landing/data";

export interface PartSchematicPreviewProps {
  partType: PartTypeId;
  dimensionLabel?: string;
  materialCode?: string;
  hovered?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function PartSchematicPreview({
  partType,
  dimensionLabel,
  materialCode,
  hovered = false,
  size = "md",
  className,
}: PartSchematicPreviewProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[12px] border border-lab-border bg-lab-bg",
        size === "sm" ? "h-24 w-28 shrink-0" : "h-36 w-full",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="bg-blueprint-fine pointer-events-none absolute inset-0 opacity-70"
      />

      {size === "md" && (
        <div className="absolute top-2 left-2.5 z-10 flex items-center gap-1.5 rounded border border-lab-border bg-lab-surface/90 px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase">
          <span
            className={cn(
              "size-1.5 rounded-full transition-colors duration-200",
              hovered
                ? "bg-lab-cyan shadow-[0_0_6px_var(--lab-cyan)]"
                : "bg-lab-ready",
            )}
          />
          <span className={hovered ? "text-lab-cyan" : "text-lab-muted"}>
            {hovered ? "CAD // WIREFRAME" : "MANIFOLD // OK"}
          </span>
        </div>
      )}

      {size === "md" && materialCode && (
        <div className="absolute top-2 right-2.5 z-10 rounded border border-lab-border bg-lab-surface/90 px-1.5 py-0.5 font-mono text-[10px] font-medium text-lab-text">
          {materialCode}
        </div>
      )}

      <svg
        viewBox="0 0 240 136"
        aria-hidden="true"
        className="relative z-0 h-full w-full"
        fill="none"
      >
        {(partType === "bushing" || partType === "end-cap") && (
          <g>
            {/* Фланец */}
            <ellipse
              cx="120"
              cy="98"
              rx="52"
              ry="15"
              fill="color-mix(in srgb, var(--lab-cyan) 8%, transparent)"
              stroke="var(--lab-cyan)"
              strokeWidth="1.4"
            />
            {/* Цилиндр */}
            <path
              d="M84,42 L84,92 A36,11 0 0,0 156,92 L156,42"
              fill="var(--lab-elevated)"
              stroke="var(--lab-cyan)"
              strokeWidth="1.4"
            />
            <ellipse
              cx="120"
              cy="42"
              rx="36"
              ry="11"
              fill="color-mix(in srgb, var(--lab-cyan) 14%, transparent)"
              stroke="var(--lab-cyan)"
              strokeWidth="1.4"
            />
            {/* Внутренний канал d */}
            <ellipse
              cx="120"
              cy="42"
              rx="18"
              ry="6"
              fill="var(--lab-bg)"
              stroke="var(--brand)"
              strokeWidth="1.6"
            />
            <line
              x1="102"
              y1="42"
              x2="102"
              y2="96"
              stroke="var(--brand)"
              strokeDasharray="3 2"
              strokeOpacity="0.7"
            />
            <line
              x1="138"
              y1="42"
              x2="138"
              y2="96"
              stroke="var(--brand)"
              strokeDasharray="3 2"
              strokeOpacity="0.7"
            />
          </g>
        )}

        {partType === "spacer-ring" && (
          <g>
            {/* Нижний контур прямого цилиндра без буртика */}
            <path
              d="M84,44 L84,92 A36,11 0 0,0 156,92 L156,44"
              fill="var(--lab-elevated)"
              stroke="var(--lab-cyan)"
              strokeWidth="1.4"
            />
            <ellipse
              cx="120"
              cy="92"
              rx="36"
              ry="11"
              fill="none"
              stroke="var(--lab-cyan)"
              strokeDasharray="3 2"
              strokeOpacity="0.55"
            />
            <ellipse
              cx="120"
              cy="44"
              rx="36"
              ry="11"
              fill="color-mix(in srgb, var(--lab-cyan) 14%, transparent)"
              stroke="var(--lab-cyan)"
              strokeWidth="1.4"
            />
            {/* Внутренний канал d */}
            <ellipse
              cx="120"
              cy="44"
              rx="18"
              ry="6"
              fill="var(--lab-bg)"
              stroke="var(--brand)"
              strokeWidth="1.6"
            />
            <line
              x1="102"
              y1="44"
              x2="102"
              y2="92"
              stroke="var(--brand)"
              strokeDasharray="3 2"
              strokeOpacity="0.7"
            />
            <line
              x1="138"
              y1="44"
              x2="138"
              y2="92"
              stroke="var(--brand)"
              strokeDasharray="3 2"
              strokeOpacity="0.7"
            />
          </g>
        )}

        {(partType === "din-box" || partType === "junction-box") && (
          <g>
            <polygon
              points="64,46 122,26 180,48 122,68"
              fill="color-mix(in srgb, var(--lab-cyan) 14%, transparent)"
              stroke="var(--lab-cyan)"
              strokeWidth="1.4"
            />
            <polygon
              points="64,46 122,68 122,108 64,86"
              fill="var(--lab-elevated)"
              stroke="var(--lab-cyan)"
              strokeWidth="1.4"
            />
            <polygon
              points="122,68 180,48 180,88 122,108"
              fill="var(--lab-inset)"
              stroke="var(--lab-cyan)"
              strokeWidth="1.4"
            />
            {/* Стойки PCB */}
            <circle
              cx="88"
              cy="47"
              r="3"
              fill="var(--lab-bg)"
              stroke="var(--brand)"
            />
            <circle
              cx="122"
              cy="36"
              r="3"
              fill="var(--lab-bg)"
              stroke="var(--brand)"
            />
            <circle
              cx="156"
              cy="48"
              r="3"
              fill="var(--lab-bg)"
              stroke="var(--brand)"
            />
            <circle
              cx="122"
              cy="59"
              r="3"
              fill="var(--lab-bg)"
              stroke="var(--brand)"
            />
          </g>
        )}

        {(partType === "gear" || partType === "belt-pulley") && (
          <g transform="translate(120,68)">
            <circle
              r="42"
              fill="color-mix(in srgb, var(--lab-cyan) 9%, transparent)"
              stroke="var(--lab-cyan)"
              strokeWidth="1.4"
              strokeDasharray="6 3"
            />
            <circle
              r="34"
              fill="var(--lab-elevated)"
              stroke="var(--lab-cyan)"
              strokeWidth="1.4"
            />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
              (deg) => (
                <line
                  key={deg}
                  x1="0"
                  y1="-14"
                  x2="0"
                  y2="-42"
                  transform={`rotate(${deg})`}
                  stroke="var(--lab-cyan)"
                  strokeOpacity="0.45"
                />
              ),
            )}
            <circle
              r="14"
              fill="var(--lab-bg)"
              stroke="var(--brand)"
              strokeWidth="1.6"
            />
          </g>
        )}

        {partType === "bracket" && (
          <g>
            <rect
              x="64"
              y="84"
              width="112"
              height="20"
              rx="3"
              fill="color-mix(in srgb, var(--lab-cyan) 10%, transparent)"
              stroke="var(--lab-cyan)"
              strokeWidth="1.4"
            />
            <rect
              x="92"
              y="32"
              width="56"
              height="52"
              rx="3"
              fill="var(--lab-elevated)"
              stroke="var(--lab-cyan)"
              strokeWidth="1.4"
            />
            <polygon
              points="92,84 114,84 92,62"
              fill="color-mix(in srgb, var(--lab-cyan) 18%, transparent)"
              stroke="var(--lab-cyan)"
            />
            <polygon
              points="148,84 126,84 148,62"
              fill="color-mix(in srgb, var(--lab-cyan) 18%, transparent)"
              stroke="var(--lab-cyan)"
            />
            <circle
              cx="120"
              cy="56"
              r="11"
              fill="var(--lab-bg)"
              stroke="var(--brand)"
              strokeWidth="1.6"
            />
          </g>
        )}

        {partType === "pipe-clamp" && (
          <g>
            {/* Боковые уши основания */}
            <rect
              x="56"
              y="82"
              width="36"
              height="16"
              rx="2"
              fill="color-mix(in srgb, var(--lab-cyan) 10%, transparent)"
              stroke="var(--lab-cyan)"
              strokeWidth="1.4"
            />
            <rect
              x="148"
              y="82"
              width="36"
              height="16"
              rx="2"
              fill="color-mix(in srgb, var(--lab-cyan) 10%, transparent)"
              stroke="var(--lab-cyan)"
              strokeWidth="1.4"
            />
            {/* Наружная арка хомута и полукруглый ложемент */}
            <path
              d="M 80 82 A 40 40 0 0 1 160 82 L 144 82 A 24 24 0 0 0 96 82 Z"
              fill="var(--lab-inset)"
              stroke="var(--lab-cyan)"
              strokeWidth="1.4"
            />
            {/* Внутренняя посадочная дуга под трубу / вал */}
            <path
              d="M 96 82 A 24 24 0 0 1 144 82"
              fill="none"
              stroke="var(--brand)"
              strokeWidth="1.8"
            />
            <circle
              cx="72"
              cy="90"
              r="3"
              fill="var(--lab-bg)"
              stroke="var(--brand)"
            />
            <circle
              cx="168"
              cy="90"
              r="3"
              fill="var(--lab-bg)"
              stroke="var(--brand)"
            />
          </g>
        )}

        {(partType === "adapter" || partType === "flange-nozzle") && (
          <g>
            <polygon
              points="76,104 164,104 164,80 144,58 144,32 96,32 96,58 76,80"
              fill="color-mix(in srgb, var(--lab-cyan) 10%, transparent)"
              stroke="var(--lab-cyan)"
              strokeWidth="1.4"
            />
            <ellipse
              cx="120"
              cy="32"
              rx="24"
              ry="7"
              fill="var(--lab-bg)"
              stroke="var(--brand)"
              strokeWidth="1.5"
            />
            <ellipse
              cx="120"
              cy="104"
              rx="44"
              ry="10"
              fill="none"
              stroke="var(--lab-cyan)"
              strokeDasharray="3 2"
            />
          </g>
        )}

        {partType === "organizer" && (
          <g>
            <rect
              x="58"
              y="32"
              width="124"
              height="74"
              rx="6"
              fill="var(--lab-elevated)"
              stroke="var(--lab-cyan)"
              strokeWidth="1.4"
            />
            <line
              x1="99"
              y1="38"
              x2="99"
              y2="100"
              stroke="var(--lab-cyan)"
              strokeOpacity="0.7"
            />
            <line
              x1="141"
              y1="38"
              x2="141"
              y2="100"
              stroke="var(--lab-cyan)"
              strokeOpacity="0.7"
            />
            <line
              x1="64"
              y1="69"
              x2="176"
              y2="69"
              stroke="var(--lab-cyan)"
              strokeOpacity="0.7"
            />
            <rect
              x="66"
              y="40"
              width="27"
              height="23"
              rx="3"
              stroke="var(--brand)"
              strokeWidth="1.2"
            />
          </g>
        )}

        {partType === "plant-tag" && (
          <g>
            <path
              d="M 28 68 L 106 56 L 116 44 L 208 44 Q 214 44 214 50 L 214 86 Q 214 92 208 92 L 116 92 L 106 80 Z"
              fill="var(--lab-inset)"
              stroke="var(--lab-cyan)"
              strokeWidth="1.4"
            />
            <line
              x1="36"
              y1="68"
              x2="119"
              y2="68"
              stroke="var(--brand)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <rect
              x="119"
              y="49"
              width="82"
              height="38"
              rx="4"
              fill="color-mix(in srgb, var(--lab-cyan) 8%, transparent)"
              stroke="var(--brand)"
              strokeWidth="1.4"
            />
            <circle
              cx="207"
              cy="68"
              r="3"
              fill="var(--lab-bg)"
              stroke="var(--lab-cyan)"
            />
          </g>
        )}
      </svg>

      {size === "md" && dimensionLabel && (
        <div className="absolute right-2.5 bottom-2 left-2.5 flex items-center justify-between font-mono text-[11px] tabular-nums">
          <span className="rounded bg-lab-bg/90 px-1.5 py-0.5 font-semibold text-lab-cyan">
            {dimensionLabel}
          </span>
          <span className="rounded bg-lab-bg/90 px-1.5 py-0.5 text-[10px] text-lab-muted">
            ±0.1 мм
          </span>
        </div>
      )}
    </div>
  );
}
