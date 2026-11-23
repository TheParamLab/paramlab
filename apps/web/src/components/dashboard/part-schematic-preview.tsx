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
        "relative overflow-hidden rounded-[12px] border border-[#262B36] bg-[#0E1014]",
        size === "sm" ? "h-24 w-28 shrink-0" : "h-36 w-full",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="bg-blueprint-fine pointer-events-none absolute inset-0 opacity-70"
      />

      {size === "md" && (
        <div className="absolute top-2 left-2.5 z-10 flex items-center gap-1.5 rounded border border-[#262B36] bg-[#161920]/90 px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase">
          <span
            className={cn(
              "size-1.5 rounded-full transition-colors duration-200",
              hovered
                ? "bg-[#00D1FF] shadow-[0_0_6px_#00D1FF]"
                : "bg-[#10B981]",
            )}
          />
          <span className={hovered ? "text-[#00D1FF]" : "text-[#8A93A2]"}>
            {hovered ? "CAD // WIREFRAME" : "MANIFOLD // OK"}
          </span>
        </div>
      )}

      {size === "md" && materialCode && (
        <div className="absolute top-2 right-2.5 z-10 rounded border border-[#262B36] bg-[#161920]/90 px-1.5 py-0.5 font-mono text-[10px] font-medium text-[#F2F4F7]">
          {materialCode}
        </div>
      )}

      <svg
        viewBox="0 0 240 136"
        aria-hidden="true"
        className="relative z-0 h-full w-full"
        fill="none"
      >
        {(partType === "bushing" ||
          partType === "spacer-ring" ||
          partType === "end-cap") && (
          <g>
            {/* Фланец */}
            <ellipse
              cx="120"
              cy="98"
              rx="52"
              ry="15"
              fill="rgba(0, 209, 255, 0.08)"
              stroke="#00D1FF"
              strokeWidth="1.4"
            />
            {/* Цилиндр */}
            <path
              d="M84,42 L84,92 A36,11 0 0,0 156,92 L156,42"
              fill="rgba(22, 25, 32, 0.78)"
              stroke="#00D1FF"
              strokeWidth="1.4"
            />
            <ellipse
              cx="120"
              cy="42"
              rx="36"
              ry="11"
              fill="rgba(0, 209, 255, 0.14)"
              stroke="#00D1FF"
              strokeWidth="1.4"
            />
            {/* Внутренний канал d */}
            <ellipse
              cx="120"
              cy="42"
              rx="18"
              ry="6"
              fill="#0E1014"
              stroke="#FF5C1A"
              strokeWidth="1.6"
            />
            <line
              x1="102"
              y1="42"
              x2="102"
              y2="96"
              stroke="#FF5C1A"
              strokeDasharray="3 2"
              strokeOpacity="0.7"
            />
            <line
              x1="138"
              y1="42"
              x2="138"
              y2="96"
              stroke="#FF5C1A"
              strokeDasharray="3 2"
              strokeOpacity="0.7"
            />
          </g>
        )}

        {(partType === "din-box" || partType === "junction-box") && (
          <g>
            <polygon
              points="64,46 122,26 180,48 122,68"
              fill="rgba(0, 209, 255, 0.14)"
              stroke="#00D1FF"
              strokeWidth="1.4"
            />
            <polygon
              points="64,46 122,68 122,108 64,86"
              fill="rgba(22, 25, 32, 0.85)"
              stroke="#00D1FF"
              strokeWidth="1.4"
            />
            <polygon
              points="122,68 180,48 180,88 122,108"
              fill="rgba(14, 16, 20, 0.9)"
              stroke="#00D1FF"
              strokeWidth="1.4"
            />
            {/* Стойки PCB */}
            <circle cx="88" cy="47" r="3" fill="#0E1014" stroke="#FF5C1A" />
            <circle cx="122" cy="36" r="3" fill="#0E1014" stroke="#FF5C1A" />
            <circle cx="156" cy="48" r="3" fill="#0E1014" stroke="#FF5C1A" />
            <circle cx="122" cy="59" r="3" fill="#0E1014" stroke="#FF5C1A" />
          </g>
        )}

        {(partType === "gear" || partType === "belt-pulley") && (
          <g transform="translate(120,68)">
            <circle
              r="42"
              fill="rgba(0, 209, 255, 0.09)"
              stroke="#00D1FF"
              strokeWidth="1.4"
              strokeDasharray="6 3"
            />
            <circle
              r="34"
              fill="rgba(22, 25, 32, 0.85)"
              stroke="#00D1FF"
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
                  stroke="#00D1FF"
                  strokeOpacity="0.45"
                />
              ),
            )}
            <circle r="14" fill="#0E1014" stroke="#FF5C1A" strokeWidth="1.6" />
          </g>
        )}

        {(partType === "bracket" || partType === "pipe-clamp") && (
          <g>
            <rect
              x="64"
              y="84"
              width="112"
              height="20"
              rx="3"
              fill="rgba(0, 209, 255, 0.1)"
              stroke="#00D1FF"
              strokeWidth="1.4"
            />
            <rect
              x="92"
              y="32"
              width="56"
              height="52"
              rx="3"
              fill="rgba(22, 25, 32, 0.85)"
              stroke="#00D1FF"
              strokeWidth="1.4"
            />
            <polygon
              points="92,84 114,84 92,62"
              fill="rgba(0, 209, 255, 0.18)"
              stroke="#00D1FF"
            />
            <polygon
              points="148,84 126,84 148,62"
              fill="rgba(0, 209, 255, 0.18)"
              stroke="#00D1FF"
            />
            <circle
              cx="120"
              cy="56"
              r="11"
              fill="#0E1014"
              stroke="#FF5C1A"
              strokeWidth="1.6"
            />
          </g>
        )}

        {(partType === "adapter" || partType === "flange-nozzle") && (
          <g>
            <polygon
              points="76,104 164,104 164,80 144,58 144,32 96,32 96,58 76,80"
              fill="rgba(0, 209, 255, 0.1)"
              stroke="#00D1FF"
              strokeWidth="1.4"
            />
            <ellipse
              cx="120"
              cy="32"
              rx="24"
              ry="7"
              fill="#0E1014"
              stroke="#FF5C1A"
              strokeWidth="1.5"
            />
            <ellipse
              cx="120"
              cy="104"
              rx="44"
              ry="10"
              fill="none"
              stroke="#00D1FF"
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
              fill="rgba(22, 25, 32, 0.85)"
              stroke="#00D1FF"
              strokeWidth="1.4"
            />
            <line
              x1="99"
              y1="38"
              x2="99"
              y2="100"
              stroke="#00D1FF"
              strokeOpacity="0.7"
            />
            <line
              x1="141"
              y1="38"
              x2="141"
              y2="100"
              stroke="#00D1FF"
              strokeOpacity="0.7"
            />
            <line
              x1="64"
              y1="69"
              x2="176"
              y2="69"
              stroke="#00D1FF"
              strokeOpacity="0.7"
            />
            <rect
              x="66"
              y="40"
              width="27"
              height="23"
              rx="3"
              stroke="#FF5C1A"
              strokeWidth="1.2"
            />
          </g>
        )}

        {partType === "plant-tag" && (
          <g>
            <path
              d="M 28 68 L 106 56 L 116 44 L 208 44 Q 214 44 214 50 L 214 86 Q 214 92 208 92 L 116 92 L 106 80 Z"
              fill="rgba(22, 25, 32, 0.88)"
              stroke="#00D1FF"
              strokeWidth="1.4"
            />
            <line
              x1="36"
              y1="68"
              x2="119"
              y2="68"
              stroke="#FF5C1A"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <rect
              x="119"
              y="49"
              width="82"
              height="38"
              rx="4"
              fill="rgba(0, 209, 255, 0.08)"
              stroke="#FF5C1A"
              strokeWidth="1.4"
            />
            <circle cx="207" cy="68" r="3" fill="#0E1014" stroke="#00D1FF" />
          </g>
        )}
      </svg>

      {size === "md" && dimensionLabel && (
        <div className="absolute right-2.5 bottom-2 left-2.5 flex items-center justify-between font-mono text-[11px] tabular-nums">
          <span className="rounded bg-[#0E1014]/90 px-1.5 py-0.5 font-semibold text-[#00D1FF]">
            {dimensionLabel}
          </span>
          <span className="rounded bg-[#0E1014]/90 px-1.5 py-0.5 text-[10px] text-[#8A93A2]">
            ±0.1 мм
          </span>
        </div>
      )}
    </div>
  );
}
