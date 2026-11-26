"use client";

import { useTheme } from "@paramlab/ui";
import { Layers, ShieldCheck, Truck } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { type DraftPartData, restoreDraftPart } from "~/lib/draft-part";

const ENGINEERING_FACTS = [
  {
    code: "01",
    title: "Сохранение ревизий и допусков деталей.",
    subtitle: "Каждый CAD-пресет фиксирует размеры D × T × H и допуск ±0.1 мм.",
    icon: Layers,
  },
  {
    code: "02",
    title: "Живой трекинг печати по этапам.",
    subtitle:
      "От проверки сетки (Manifold) и экструзии до замера со штангенциркулем.",
    icon: ShieldCheck,
  },
  {
    code: "03",
    title: "Уведомления о готовности и трек-номер в Telegram.",
    subtitle: "Автоматическая передача штрихкода выдачи Ozon ПВЗ сразу из ОТК.",
    icon: Truck,
  },
] as const;

const numberFmt = new Intl.NumberFormat("ru-RU");

const WIREFRAME_PALETTES = {
  light: {
    brand: "#E94F0D",
    brandRgb: "233, 79, 13",
    cyan: "#007B96",
    cyanRgb: "0, 123, 150",
    borderRgb: "191, 181, 162",
  },
  dark: {
    brand: "#FF5C1A",
    brandRgb: "255, 92, 26",
    cyan: "#00D1FF",
    cyanRgb: "0, 209, 255",
    borderRgb: "38, 43, 54",
  },
} as const;

const rgba = (rgb: string, alpha: number) => `rgba(${rgb}, ${alpha})`;

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function rotatePoint(p: Vec3, yaw: number, pitch: number): Vec3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = p.x * cy - p.z * sy;
  const z1 = p.x * sy + p.z * cy;

  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const y2 = p.y * cp - z1 * sp;
  const z2 = p.y * sp + z1 * cp;

  return { x: x1, y: y2, z: z2 };
}

function WireframePartCanvas({
  draft,
  reducedMotion,
}: {
  draft: DraftPartData | null;
  reducedMotion: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { resolvedTheme } = useTheme();
  const palette = WIREFRAME_PALETTES[resolvedTheme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let yaw = -0.58;
    const pitch = 0.42;

    const d1 = draft?.dimensions.d1 ?? 42;
    const d2 = draft?.dimensions.d2 ?? 24;
    const h = draft?.dimensions.h ?? 30;
    const partType = draft?.partType ?? "bushing";

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(260, Math.floor(rect.width));
      const height = Math.max(260, Math.floor(rect.height));

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.45;
      const maxSpan = Math.max(d1, d2, h, 48);
      const scale = Math.min(width, height) / (maxSpan * 2.35);

      const project = (pt: Vec3) => {
        const r = rotatePoint(pt, yaw, pitch);
        const perspective = 1 + r.z / (maxSpan * 5.8);
        return {
          x: centerX + r.x * scale * perspective,
          y: centerY - r.y * scale * perspective,
          z: r.z,
        };
      };

      const halfH = h / 2;
      const rOuter = Math.max(14, d1 / 2);
      const rInner = Math.max(5, Math.min(rOuter - 3, d2 / 2));
      const rFlange =
        partType === "bushing" || partType === "adapter"
          ? rOuter * 1.24
          : rOuter * 1.08;
      const yBottom = -halfH;
      const yMid = -halfH + h * 0.28;
      const yTop = halfH;

      // Координатная сетка рабочего стола
      const gridHalf = rFlange * 1.55;
      const gridSteps = 5;
      ctx.lineWidth = 1;
      for (let i = -gridSteps; i <= gridSteps; i++) {
        const offset = (i / gridSteps) * gridHalf;
        const p1 = project({ x: -gridHalf, y: yBottom, z: offset });
        const p2 = project({ x: gridHalf, y: yBottom, z: offset });
        const p3 = project({ x: offset, y: yBottom, z: -gridHalf });
        const p4 = project({ x: offset, y: yBottom, z: gridHalf });

        ctx.strokeStyle =
          i === 0
            ? rgba(palette.cyanRgb, 0.28)
            : rgba(palette.borderRgb, resolvedTheme === "light" ? 0.38 : 0.65);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.stroke();
      }

      const segments = 24;
      const drawRing = (
        radius: number,
        y: number,
        color: string,
        lineWidth = 1.2,
        dashed = false,
      ) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash(dashed ? [4, 3] : []);
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          const p = project({
            x: Math.cos(angle) * radius,
            y,
            z: Math.sin(angle) * radius,
          });
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      };

      // Изолинии слоев экструзии
      const layerCount = 5;
      for (let l = 1; l < layerCount; l++) {
        const ly = yMid + ((yTop - yMid) * l) / layerCount;
        drawRing(rOuter, ly, rgba(palette.cyanRgb, 0.18), 0.9);
      }

      // Основные кольца каркаса втулки / фланца
      drawRing(rFlange, yBottom, rgba(palette.cyanRgb, 0.72), 1.35);
      drawRing(rFlange, yMid, rgba(palette.cyanRgb, 0.85), 1.4);
      drawRing(rOuter, yMid, rgba(palette.cyanRgb, 0.65), 1.2);
      drawRing(rOuter, yTop, palette.cyan, 1.55);

      // Внутренний посадочный канал (акцент #FF5C1A)
      drawRing(rInner, yBottom, rgba(palette.brandRgb, 0.55), 1.15, true);
      drawRing(rInner, yTop, palette.brand, 1.5);

      // Меридианы каркаса (образующие)
      for (let i = 0; i < segments; i += 2) {
        const angle = (i / segments) * Math.PI * 2;
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        const fb = project({ x: rFlange * c, y: yBottom, z: rFlange * s });
        const fm = project({ x: rFlange * c, y: yMid, z: rFlange * s });
        const om = project({ x: rOuter * c, y: yMid, z: rOuter * s });
        const ot = project({ x: rOuter * c, y: yTop, z: rOuter * s });
        const it = project({ x: rInner * c, y: yTop, z: rInner * s });
        const ib = project({ x: rInner * c, y: yBottom, z: rInner * s });

        ctx.strokeStyle = rgba(palette.cyanRgb, 0.42);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fb.x, fb.y);
        ctx.lineTo(fm.x, fm.y);
        ctx.lineTo(om.x, om.y);
        ctx.lineTo(ot.x, ot.y);
        ctx.lineTo(it.x, it.y);
        ctx.stroke();

        if (i % 4 === 0) {
          ctx.strokeStyle = rgba(palette.brandRgb, 0.35);
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(it.x, it.y);
          ctx.lineTo(ib.x, ib.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Размерная выноска CAD поверх wireframe-модели
      const calloutLeft = project({ x: -rOuter, y: yTop + 6, z: 0 });
      const calloutRight = project({ x: rOuter, y: yTop + 6, z: 0 });
      ctx.strokeStyle = rgba(palette.cyanRgb, 0.7);
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(calloutLeft.x, calloutLeft.y);
      ctx.lineTo(calloutRight.x, calloutRight.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = palette.cyan;
      ctx.beginPath();
      ctx.arc(calloutLeft.x, calloutLeft.y, 2.5, 0, Math.PI * 2);
      ctx.arc(calloutRight.x, calloutRight.y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      if (!reducedMotion) {
        yaw += 0.0045;
        rafId = window.requestAnimationFrame(draw);
      }
    };

    rafId = window.requestAnimationFrame(draw);
    const handleResize = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(draw);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, [draft, reducedMotion, palette, resolvedTheme]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

export function ContextPanel() {
  const searchParams = useSearchParams();
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [draft, setDraft] = useState<DraftPartData | null>(null);

  useEffect(() => {
    setDraft(restoreDraftPart(searchParams));
  }, [searchParams]);

  return (
    <aside
      aria-label="Инженерный контекст детали и лаборатории"
      className="relative hidden min-h-dvh flex-col justify-between overflow-hidden border-l border-lab-border bg-lab-bg p-10 lg:flex xl:p-14"
    >
      {/* Фирменная чертёжная миллиметровка (opacity: 0.06) */}
      <div
        aria-hidden="true"
        className="bg-blueprint pointer-events-none absolute inset-0 opacity-[0.06]"
      />

      {/* Мягкое радиальное свечение вокруг 3D wireframe */}
      <div
        aria-hidden="true"
        className="bg-lab-glow pointer-events-none absolute inset-0"
      />

      {/* Медленно вращающаяся wireframe-модель детали */}
      <WireframePartCanvas draft={draft} reducedMotion={prefersReducedMotion} />

      {/* Верхняя строка телеметрии */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-lab-border bg-lab-surface/90 px-3 py-1 font-mono text-xs text-lab-muted backdrop-blur-md">
          <span className="size-2 rounded-full bg-lab-cyan shadow-[0_0_8px_var(--lab-cyan)]" />
          <span>{"CAD WIREFRAME // ISO 2768-mK"}</span>
        </div>
        <span className="font-mono text-xs text-lab-muted tabular-nums">
          ДОПУСК ±0.1 ММ
        </span>
      </div>

      {/* Нижняя карточка: Сценарий А (Мини-паспорт детали) или Сценарий Б (3 инженерных факта) */}
      <div className="relative z-10 mt-auto max-w-lg">
        {draft ? (
          <div
            data-testid="draft-part-passport"
            className="rounded-[16px] border border-lab-border bg-lab-surface/90 p-6 shadow-2xl backdrop-blur-md"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-lab-border pb-3.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-lab-ready/35 bg-lab-ready/12 px-2.5 py-1 font-mono text-xs font-medium text-lab-ready">
                <span aria-hidden="true">●</span> Конфигурация сохранена
              </span>
              <span className="font-mono text-xs text-lab-muted tabular-nums">
                {draft.templateCode}
              </span>
            </div>

            <div className="mt-4">
              <p className="font-mono text-[11px] tracking-wider text-lab-muted uppercase">
                Мини-паспорт детали
              </p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-lab-text">
                {draft.templateLabel}
              </h2>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-2.5 font-mono tabular-nums">
              <div className="rounded-[12px] border border-lab-border bg-lab-bg/85 px-3 py-2.5">
                <dt className="text-[11px] text-lab-muted">Габариты (мм)</dt>
                <dd
                  data-testid="draft-part-dimensions"
                  className="mt-1 text-sm font-bold text-lab-cyan"
                >
                  {draft.dimensionFormula}
                </dd>
              </div>

              <div className="rounded-[12px] border border-lab-border bg-lab-bg/85 px-3 py-2.5">
                <dt className="text-[11px] text-lab-muted">Полимер</dt>
                <dd
                  data-testid="draft-part-material"
                  className="mt-1 text-sm font-bold text-lab-text"
                >
                  {draft.materialCode}
                </dd>
              </div>

              <div className="rounded-[12px] border border-lab-border bg-lab-bg/85 px-3 py-2.5">
                <dt className="text-[11px] text-lab-muted">
                  Расчёт ({draft.quantity} шт.)
                </dt>
                <dd
                  data-testid="draft-part-price"
                  className="mt-1 text-sm font-bold text-lab-text"
                >
                  {numberFmt.format(draft.totalPriceRub)} ₽
                </dd>
              </div>
            </dl>

            <p className="mt-3.5 font-mono text-xs text-lab-muted tabular-nums">
              После входа вы сразу перейдёте к выбору ПВЗ Ozon и запуску детали
              в печать без повторного ввода размеров.
            </p>
          </div>
        ) : (
          <div
            data-testid="engineering-facts-panel"
            className="rounded-[16px] border border-lab-border bg-lab-surface/90 p-6 shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-lab-border pb-3">
              <span className="font-mono text-xs font-semibold tracking-wider text-lab-cyan uppercase">
                ПУЛЬТ ПРОИЗВОДСТВА PARAMLAB
              </span>
              <span className="font-mono text-xs text-lab-muted tabular-nums">
                COREXY · 24/7
              </span>
            </div>

            <ul className="mt-4 flex flex-col gap-3.5">
              {ENGINEERING_FACTS.map((fact) => {
                const Icon = fact.icon;
                return (
                  <li key={fact.code} className="flex items-start gap-3.5">
                    <span className="inline-flex h-7 w-9 shrink-0 items-center justify-center rounded-lg border border-lab-cyan/35 bg-lab-cyan/10 font-mono text-xs font-bold text-lab-cyan tabular-nums">
                      {fact.code}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-lab-text">
                        <span>{fact.title}</span>
                        <Icon className="size-3.5 shrink-0 text-lab-muted" />
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-lab-muted">
                        {fact.subtitle}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
