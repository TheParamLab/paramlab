import { cn } from "@acme/ui";
import {
  type DimensionKey,
  type Dimensions,
  PART_TYPES,
  type PartTypeId,
} from "./data";
import { clampBore } from "./pricing";

const CX = 150;
const CY = 112;
const MAX_W = 190;
const MAX_H = 150;

interface Dim {
  key: DimensionKey;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Смещение подписи от середины линии. */
  dx: number;
  dy: number;
  anchor: "start" | "middle" | "end";
  value: number;
}

function buildRound(
  partType: "adapter" | "bushing",
  { d1, d2, h }: Dimensions,
) {
  const isBushing = partType === "bushing";
  const inner = isBushing ? clampBore(d1, d2) : d2;
  const flange = isBushing ? 10 : 0;
  const widest = Math.max(d1 + flange, inner);
  const s = Math.min(MAX_W / widest, MAX_H / h);
  const y0 = CY - (h * s) / 2;
  const y1 = CY + (h * s) / 2;
  const a = (inner * s) / 2;
  const b = (d1 * s) / 2;

  let outline: [number, number][];
  const extra: [number, number, number, number][] = [];
  if (isBushing) {
    const f = b + (flange * s) / 2;
    const ft = Math.max(4 * s, 4);
    outline = [
      [CX - b, y0],
      [CX + b, y0],
      [CX + b, y1 - ft],
      [CX + f, y1 - ft],
      [CX + f, y1],
      [CX - f, y1],
      [CX - f, y1 - ft],
      [CX - b, y1 - ft],
    ];
    // Отверстие — штриховыми линиями.
    extra.push([CX - a, y0, CX - a, y1], [CX + a, y0, CX + a, y1]);
  } else {
    const t1 = y0 + (y1 - y0) * 0.4;
    const t2 = y0 + (y1 - y0) * 0.6;
    outline = [
      [CX - a, y0],
      [CX + a, y0],
      [CX + a, t1],
      [CX + b, t2],
      [CX + b, y1],
      [CX - b, y1],
      [CX - b, t2],
      [CX - a, t1],
    ];
  }

  const right = CX + (Math.max(d1 + flange, inner) * s) / 2 + 18;
  const dims: Dim[] = [
    {
      key: "d2",
      x1: CX - a,
      y1: y0 - 12,
      x2: CX + a,
      y2: y0 - 12,
      dx: 0,
      dy: -6,
      anchor: "middle",
      value: inner,
    },
    {
      key: "d1",
      x1: CX - b,
      y1: y1 + 14,
      x2: CX + b,
      y2: y1 + 14,
      dx: 0,
      dy: 15,
      anchor: "middle",
      value: d1,
    },
    {
      key: "h",
      x1: right,
      y1: y0,
      x2: right,
      y2: y1,
      dx: 8,
      dy: 4,
      anchor: "start",
      value: h,
    },
  ];

  return { outlines: [outline], extra, dims, axis: [y0 - 6, y1 + 6] as const };
}

function buildBox({ d1, d2, h }: Dimensions) {
  const k = 0.35;
  const s = Math.min(MAX_W / (d1 + k * d2), MAX_H / (h + k * d2));
  const w = d1 * s;
  const hh = h * s;
  const dx = k * d2 * s;
  const x0 = CX - (w + dx) / 2;
  const yTop = CY - (hh + dx) / 2 + dx;
  const x1 = x0 + w;
  const yBottom = yTop + hh;

  const front: [number, number][] = [
    [x0, yTop],
    [x1, yTop],
    [x1, yBottom],
    [x0, yBottom],
  ];
  const top: [number, number][] = [
    [x0, yTop],
    [x0 + dx, yTop - dx],
    [x1 + dx, yTop - dx],
    [x1, yTop],
  ];
  const side: [number, number][] = [
    [x1, yTop],
    [x1 + dx, yTop - dx],
    [x1 + dx, yBottom - dx],
    [x1, yBottom],
  ];

  const dims: Dim[] = [
    {
      key: "d1",
      x1: x0,
      y1: yBottom + 14,
      x2: x1,
      y2: yBottom + 14,
      dx: 0,
      dy: 15,
      anchor: "middle",
      value: d1,
    },
    {
      key: "d2",
      x1: x1 + 8,
      y1: yBottom + 6,
      x2: x1 + dx + 8,
      y2: yBottom - dx + 6,
      dx: 8,
      dy: 12,
      anchor: "start",
      value: d2,
    },
    {
      key: "h",
      x1: x0 - 14,
      y1: yTop,
      x2: x0 - 14,
      y2: yBottom,
      dx: -8,
      dy: 4,
      anchor: "end",
      value: h,
    },
  ];

  return { outlines: [front, top, side], extra: [], dims, axis: null };
}

const points = (polygon: [number, number][]) =>
  polygon.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

export function PartDrawing({
  partType,
  dimensions,
  active,
  className,
}: {
  partType: PartTypeId;
  dimensions: Dimensions;
  active: DimensionKey | null;
  className?: string;
}) {
  const part = PART_TYPES.find((p) => p.id === partType) ?? PART_TYPES[0];
  const drawing =
    partType === "adapter" || partType === "bushing"
      ? buildRound(partType, dimensions)
      : buildBox(dimensions);

  return (
    <svg
      viewBox="0 0 320 232"
      role="img"
      aria-label={`Чертеж: ${part.label}`}
      className={cn("h-auto w-full", className)}
    >
      {drawing.outlines.map((polygon) => (
        <polygon
          key={points(polygon)}
          points={points(polygon)}
          className="fill-muted stroke-foreground"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}
      {drawing.extra.map(([x1, y1, x2, y2]) => (
        <line
          key={`${x1}-${x2}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          className="stroke-foreground"
          strokeWidth={1}
          strokeDasharray="5 3"
        />
      ))}
      {drawing.axis && (
        <line
          x1={CX}
          y1={drawing.axis[0]}
          x2={CX}
          y2={drawing.axis[1]}
          className="stroke-muted-foreground"
          strokeWidth={0.75}
          strokeDasharray="10 3 2 3"
        />
      )}
      {drawing.dims.map((dim) => {
        const isActive = active === dim.key;
        return (
          <g
            key={dim.key}
            className={cn(
              "transition-colors",
              isActive
                ? "fill-brand stroke-brand"
                : "fill-muted-foreground stroke-muted-foreground",
            )}
          >
            <line
              x1={dim.x1}
              y1={dim.y1}
              x2={dim.x2}
              y2={dim.y2}
              strokeWidth={isActive ? 2 : 1}
            />
            <circle cx={dim.x1} cy={dim.y1} r={isActive ? 2.5 : 1.75} />
            <circle cx={dim.x2} cy={dim.y2} r={isActive ? 2.5 : 1.75} />
            <text
              x={(dim.x1 + dim.x2) / 2 + dim.dx}
              y={(dim.y1 + dim.y2) / 2 + dim.dy}
              textAnchor={dim.anchor}
              stroke="none"
              className={cn(
                "font-mono text-[11px]",
                isActive ? "font-semibold" : "fill-foreground",
              )}
            >
              {part.dimensions[dim.key].code} {dim.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
