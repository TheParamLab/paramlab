"use client";

import { cn } from "@paramlab/ui";
import { ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { CalculatorTrigger } from "~/components/landing/calculator-context";
import {
  type ParametricTemplateCard,
  TEMPLATE_SHOWCASE,
} from "~/components/landing/data";
import { LayerReveal } from "~/components/landing/layer-reveal";

/**
 * Интерактивный CAD-рендер заготовки:
 * В покое — Solid-рендер готовой детали.
 * При наведении (`hovered`) — плавно переключается на `wireframe`-сетку
 * с подсветкой параметрических размерных осей D, H, Z.
 */
function TemplateCadPreview({
  kind,
  hovered,
}: {
  kind: ParametricTemplateCard["visualKind"];
  hovered: boolean;
}) {
  return (
    <div className="relative h-44 w-full overflow-hidden rounded-[12px] border border-[#262B36] bg-[#0E1014]">
      <div
        aria-hidden="true"
        className="bg-blueprint-fine absolute inset-0 opacity-70"
      />
      {/* Бейдж режима рендера в углу превью */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 rounded-md border border-[#262B36] bg-[#161920]/90 px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase">
        <span
          className={cn(
            "size-1.5 rounded-full transition-colors duration-360",
            hovered ? "bg-[#00D1FF] shadow-[0_0_8px_#00D1FF]" : "bg-[#8A93A2]",
          )}
        />
        <span className={hovered ? "text-[#00D1FF]" : "text-[#8A93A2]"}>
          {hovered ? "WIREFRAME // CAD" : "SOLID // RENDER"}
        </span>
      </div>

      {/* SOLID СЛОЙ (плавно затухает при наведении) */}
      <svg
        viewBox="0 0 280 160"
        aria-hidden="true"
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-360 ease-[cubic-bezier(0.22,1,0.36,1)]",
          hovered ? "opacity-15" : "opacity-100",
        )}
      >
        <defs>
          <linearGradient id={`solid-grad-${kind}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3B4457" />
            <stop offset="60%" stopColor="#252B37" />
            <stop offset="100%" stopColor="#171B24" />
          </linearGradient>
        </defs>

        {kind === "gear" && (
          <g transform="translate(140,82)">
            <circle
              r="48"
              fill={`url(#solid-grad-${kind})`}
              stroke="#525E75"
              strokeWidth="2"
            />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
              (deg) => (
                <rect
                  key={deg}
                  x="-6"
                  y="-56"
                  width="12"
                  height="11"
                  rx="2"
                  transform={`rotate(${deg})`}
                  fill="#3B4457"
                  stroke="#525E75"
                />
              ),
            )}
            <circle r="28" fill="#1D222D" stroke="#475267" strokeWidth="1.5" />
            <circle r="14" fill="#0E1014" stroke="#64748B" strokeWidth="1.5" />
          </g>
        )}

        {kind === "enclosure" && (
          <g>
            <polygon
              points="75,46 145,24 210,48 140,72"
              fill="#3A4356"
              stroke="#525E75"
            />
            <polygon
              points="75,46 140,72 140,126 75,100"
              fill="#262C3A"
              stroke="#525E75"
            />
            <polygon
              points="140,72 210,48 210,102 140,126"
              fill="#1C212C"
              stroke="#525E75"
            />
            <circle cx="96" cy="48" r="3" fill="#0E1014" stroke="#64748B" />
            <circle cx="144" cy="34" r="3" fill="#0E1014" stroke="#64748B" />
            <circle cx="186" cy="49" r="3" fill="#0E1014" stroke="#64748B" />
            <circle cx="140" cy="63" r="3" fill="#0E1014" stroke="#64748B" />
          </g>
        )}

        {kind === "bushing" && (
          <g>
            <ellipse
              cx="140"
              cy="116"
              rx="58"
              ry="18"
              fill="#222834"
              stroke="#525E75"
            />
            <rect
              x="98"
              y="44"
              width="84"
              height="68"
              rx="4"
              fill={`url(#solid-grad-${kind})`}
              stroke="#525E75"
            />
            <ellipse
              cx="140"
              cy="44"
              rx="42"
              ry="13"
              fill="#3C4659"
              stroke="#64748B"
            />
            <ellipse
              cx="140"
              cy="44"
              rx="22"
              ry="7"
              fill="#0E1014"
              stroke="#64748B"
            />
          </g>
        )}

        {kind === "adapter" && (
          <g>
            <polygon
              points="92,126 188,126 188,96 168,66 168,36 112,36 112,66 92,96"
              fill={`url(#solid-grad-${kind})`}
              stroke="#525E75"
              strokeWidth="1.5"
            />
            <ellipse
              cx="140"
              cy="36"
              rx="28"
              ry="8"
              fill="#161920"
              stroke="#64748B"
            />
          </g>
        )}

        {kind === "bracket" && (
          <g>
            <polygon
              points="76,118 204,118 216,102 88,102"
              fill="#2B3342"
              stroke="#525E75"
            />
            <polygon
              points="114,108 166,108 166,46 114,46"
              fill={`url(#solid-grad-${kind})`}
              stroke="#525E75"
            />
            <circle cx="140" cy="72" r="15" fill="#0E1014" stroke="#64748B" />
            <circle cx="94" cy="110" r="4" fill="#0E1014" stroke="#64748B" />
            <circle cx="186" cy="110" r="4" fill="#0E1014" stroke="#64748B" />
          </g>
        )}

        {kind === "organizer" && (
          <g>
            <rect
              x="68"
              y="34"
              width="144"
              height="94"
              rx="8"
              fill={`url(#solid-grad-${kind})`}
              stroke="#525E75"
              strokeWidth="1.5"
            />
            {[0, 1, 2].map((col) =>
              [0, 1].map((row) => (
                <rect
                  key={`${col}-${row}`}
                  x={76 + col * 44}
                  y={42 + row * 41}
                  width="38"
                  height="35"
                  rx="4"
                  fill="#14171F"
                  stroke="#3E485B"
                />
              )),
            )}
          </g>
        )}
      </svg>

      {/* WIREFRAME СЕТКА + РАЗМЕРНЫЕ ВЫНОСКИ D, H, Z (плавно проявляются при наведении) */}
      <svg
        viewBox="0 0 280 160"
        aria-hidden="true"
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-360 ease-[cubic-bezier(0.22,1,0.36,1)]",
          hovered ? "opacity-100" : "opacity-0",
        )}
      >
        {kind === "gear" && (
          <g transform="translate(140,82)" fill="none">
            <circle r="54" stroke="#00D1FF" strokeDasharray="3 2" />
            <circle r="46" stroke="#00D1FF" strokeWidth="1.3" />
            <circle r="30" stroke="#00D1FF" strokeOpacity="0.6" />
            <circle r="14" stroke="#FF5C1A" strokeWidth="1.5" />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
              (deg) => (
                <line
                  key={deg}
                  x1="0"
                  y1="-14"
                  x2="0"
                  y2="-54"
                  transform={`rotate(${deg})`}
                  stroke="#00D1FF"
                  strokeOpacity="0.45"
                />
              ),
            )}
          </g>
        )}

        {kind === "enclosure" && (
          <g fill="none" stroke="#00D1FF">
            <polygon points="75,46 145,24 210,48 140,72" strokeWidth="1.3" />
            <polygon
              points="75,100 145,78 210,102 140,126"
              strokeDasharray="3 3"
            />
            <line x1="75" y1="46" x2="75" y2="100" />
            <line x1="140" y1="72" x2="140" y2="126" strokeWidth="1.4" />
            <line x1="210" y1="48" x2="210" y2="102" />
            <line x1="145" y1="24" x2="145" y2="78" strokeDasharray="3 3" />
          </g>
        )}

        {kind === "bushing" && (
          <g fill="none" stroke="#00D1FF">
            <ellipse cx="140" cy="116" rx="58" ry="18" strokeWidth="1.3" />
            <ellipse cx="140" cy="44" rx="42" ry="13" strokeWidth="1.3" />
            <ellipse cx="140" cy="44" rx="22" ry="7" stroke="#FF5C1A" />
            <ellipse
              cx="140"
              cy="116"
              rx="22"
              ry="7"
              stroke="#FF5C1A"
              strokeDasharray="3 3"
            />
            <line x1="98" y1="44" x2="98" y2="116" />
            <line x1="182" y1="44" x2="182" y2="116" />
            <line
              x1="118"
              y1="44"
              x2="118"
              y2="116"
              stroke="#FF5C1A"
              strokeDasharray="3 2"
            />
            <line
              x1="162"
              y1="44"
              x2="162"
              y2="116"
              stroke="#FF5C1A"
              strokeDasharray="3 2"
            />
          </g>
        )}

        {kind === "adapter" && (
          <g fill="none" stroke="#00D1FF">
            {/* Нижняя ступень D1 */}
            <polygon points="76,98 140,122 204,98 140,74" strokeWidth="1.3" />
            <line x1="76" y1="98" x2="76" y2="70" />
            <line x1="204" y1="98" x2="204" y2="70" />
            <line x1="140" y1="122" x2="140" y2="94" />
            {/* Верхняя ступень D2 */}
            <polygon points="96,70 140,86 184,70 140,54" strokeWidth="1.3" />
            <line x1="96" y1="70" x2="96" y2="42" />
            <line x1="184" y1="70" x2="184" y2="42" />
            <line x1="140" y1="86" x2="140" y2="58" />
            {/* Коническая переходная зона */}
            <line x1="76" y1="70" x2="96" y2="42" />
            <line x1="204" y1="70" x2="184" y2="42" />
            <line x1="140" y1="94" x2="140" y2="58" />
            {/* Центральный канал */}
            <ellipse
              cx="140"
              cy="86"
              rx="22"
              ry="7"
              stroke="#FF5C1A"
              strokeWidth="1.4"
            />
            <ellipse
              cx="140"
              cy="58"
              rx="16"
              ry="5"
              stroke="#FF5C1A"
              strokeDasharray="3 2"
            />
          </g>
        )}

        {kind === "bracket" && (
          <g fill="none" stroke="#00D1FF">
            {/* Основание кронштейна */}
            <rect
              x="68"
              y="92"
              width="144"
              height="26"
              rx="3"
              strokeWidth="1.3"
            />
            <line x1="68" y1="105" x2="212" y2="105" strokeOpacity="0.5" />
            {/* Отверстия крепления на основании */}
            <circle cx="86" cy="105" r="4" stroke="#FF5C1A" />
            <circle cx="194" cy="105" r="4" stroke="#FF5C1A" />
            {/* Вертикальная опора */}
            <rect
              x="104"
              y="36"
              width="72"
              height="56"
              rx="3"
              strokeWidth="1.3"
            />
            {/* Ребра жесткости */}
            <polygon points="104,92 128,92 104,70" strokeOpacity="0.7" />
            <polygon points="176,92 152,92 176,70" strokeOpacity="0.7" />
            {/* Центральное отверстие опоры */}
            <circle cx="140" cy="64" r="12" stroke="#FF5C1A" />
          </g>
        )}

        {kind === "organizer" && (
          <g fill="none" stroke="#00D1FF">
            {/* Внешний лоток */}
            <rect
              x="62"
              y="34"
              width="156"
              height="94"
              rx="6"
              strokeWidth="1.3"
            />
            {/* Дно и перегородки */}
            <rect
              x="74"
              y="46"
              width="132"
              height="70"
              rx="3"
              strokeDasharray="4 2"
            />
            <line x1="118" y1="46" x2="118" y2="116" />
            <line x1="162" y1="46" x2="162" y2="116" />
            <line x1="74" y1="81" x2="206" y2="81" />
            {/* Радиусное дно ячеек (дуги) */}
            <path
              d="M 80 95 Q 97 105 114 95"
              stroke="#FF5C1A"
              strokeWidth="1.2"
            />
            <path
              d="M 124 95 Q 141 105 158 95"
              stroke="#FF5C1A"
              strokeWidth="1.2"
            />
            <path
              d="M 168 95 Q 185 105 202 95"
              stroke="#FF5C1A"
              strokeWidth="1.2"
            />
          </g>
        )}

        {/* Подсвеченные размерные метки D, H, Z */}
        <g className="font-mono text-[10px] font-bold">
          <line
            x1="76"
            y1="142"
            x2="204"
            y2="142"
            stroke="#FF5C1A"
            strokeWidth="1.3"
          />
          <rect x="124" y="133" width="32" height="16" rx="4" fill="#FF5C1A" />
          <text x="140" y="144" textAnchor="middle" fill="#0E1014">
            D
          </text>

          <line
            x1="234"
            y1="36"
            x2="234"
            y2="124"
            stroke="#00D1FF"
            strokeWidth="1.3"
          />
          <rect x="222" y="72" width="24" height="16" rx="4" fill="#00D1FF" />
          <text x="234" y="83" textAnchor="middle" fill="#0E1014">
            H
          </text>

          <rect x="184" y="18" width="42" height="16" rx="4" fill="#10B981" />
          <text x="205" y="29" textAnchor="middle" fill="#0E1014">
            Z · OK
          </text>
        </g>
      </svg>
    </div>
  );
}

export function TemplateShowcase() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section
      id="templates"
      className="scroll-mt-14 border-b border-[#262B36] bg-[#0E1014] py-16 text-[#F2F4F7] lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-3">
            <p className="font-mono text-xs tracking-widest text-[#FF5C1A] uppercase">
              02 · Библиотека параметрических заготовок
            </p>
            <h2 className="max-w-3xl text-2xl font-bold tracking-tight text-balance sm:text-3xl lg:text-4xl">
              Витрина параметрических шаблонов
            </h2>
            <p className="max-w-2xl text-base text-[#8A93A2]">
              Наведите курсор на карточку, чтобы увидеть внутреннюю
              wireframe-сетку и доступные для настройки размерные оси{" "}
              <span className="font-mono text-[#00D1FF]">D, H, Z</span>.
            </p>
          </div>
          <div className="font-mono text-xs text-[#8A93A2]">
            Клик по шаблону загружает геометрию в 3D-вьюпорт
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TEMPLATE_SHOWCASE.map((item, idx) => {
            const isHovered = hoveredId === item.id;
            return (
              <LayerReveal key={item.id} delay={idx * 0.06}>
                <article
                  onPointerEnter={() => setHoveredId(item.id)}
                  onPointerLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(item.id)}
                  onBlur={() => setHoveredId(null)}
                  className={cn(
                    "group flex h-full flex-col justify-between gap-4 rounded-[24px] border bg-[#161920] p-5 transition-all duration-360 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    isHovered
                      ? "border-[#00D1FF]/70 shadow-[0_0_30px_rgba(0,209,255,0.1)]"
                      : "border-[#262B36]",
                  )}
                >
                  <div className="flex flex-col gap-4">
                    {/* Верхняя мета-строка */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-[#8A93A2]">
                        {item.code} · {item.category}
                      </span>
                      <span className="rounded-md border border-[#262B36] bg-[#0E1014] px-2 py-0.5 font-mono text-xs font-medium text-[#F2F4F7]">
                        {item.materialCode}
                      </span>
                    </div>

                    {/* Превью с переключением Solid -> Wireframe */}
                    <TemplateCadPreview
                      kind={item.visualKind}
                      hovered={isHovered}
                    />

                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-lg font-bold tracking-tight text-[#F2F4F7]">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-[#8A93A2]">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Доступные параметры D, H, Z (подсвечиваются при наведении) */}
                  <div className="flex flex-col gap-3 border-t border-[#262B36] pt-4">
                    <div className="grid grid-cols-3 gap-2 font-mono tabular-nums">
                      {item.params.map((param) => (
                        <div
                          key={param.code}
                          className={cn(
                            "rounded-[10px] border px-2.5 py-1.5 transition-colors duration-240",
                            isHovered
                              ? "border-[#00D1FF]/60 bg-[#00D1FF]/10"
                              : "border-[#262B36] bg-[#0E1014]",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                "text-xs font-bold",
                                isHovered ? "text-[#FF5C1A]" : "text-[#00D1FF]",
                              )}
                            >
                              {param.code}
                            </span>
                            <span className="text-[10px] text-[#8A93A2]">
                              парам.
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] font-medium text-[#F2F4F7]">
                            {param.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <CalculatorTrigger
                      tab="generator"
                      partType={item.partType}
                      presetDimensions={item.presetDimensions}
                      materialCode={item.materialCode}
                      className="flex h-10 w-full items-center justify-between rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3.5 font-mono text-xs font-medium text-[#F2F4F7] transition-all duration-240 group-hover:border-[#FF5C1A] group-hover:bg-[#FF5C1A]/15 group-hover:text-[#F2F4F7]"
                    >
                      <span className="flex items-center gap-2">
                        <SlidersHorizontal className="size-3.5 text-[#FF5C1A]" />
                        Открыть шаблон в 3D-конфигураторе
                      </span>
                      <ArrowUpRight className="size-4 text-[#FF5C1A]" />
                    </CalculatorTrigger>
                  </div>
                </article>
              </LayerReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
