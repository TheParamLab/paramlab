"use client";

import { cn } from "@paramlab/ui";
import {
  Check,
  Grid3X3,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useCalculator } from "~/components/landing/calculator-context";
import {
  MATERIALS,
  PART_CATEGORIES,
  PART_TYPES,
  type PartCategoryId,
  type PartModelPreset,
} from "~/components/landing/data";
import { PartSchematicPreview } from "~/components/landing/part-schematic-preview";

function focusableSelector(root: HTMLElement): HTMLElement[] {
  const selectors = [
    'button:not([disabled]):not([tabindex="-1"])',
    'a[href]:not([tabindex="-1"])',
    'input:not([disabled]):not([tabindex="-1"])',
    'select:not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([tabindex="-1"])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(root.querySelectorAll(selectors.join(",")));
}

export function ModelCatalogModal() {
  const {
    isCatalogModalOpen,
    setCatalogModalOpen,
    partType,
    setPartType,
    setMaterialId,
    setLabelText,
  } = useCalculator();

  const [selectedCategory, setSelectedCategory] = useState<
    "all" | PartCategoryId
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isCatalogModalOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setCatalogModalOpen(false);
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = focusableSelector(panelRef.current);
      if (focusable.length === 0) return;
      const first = focusable.at(0);
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      lastFocusedRef.current?.focus();
    };
  }, [isCatalogModalOpen, setCatalogModalOpen]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredModels = PART_TYPES.filter((item) => {
    if (selectedCategory !== "all" && item.categoryId !== selectedCategory) {
      return false;
    }
    if (!normalizedQuery) return true;
    return (
      item.shortLabel.toLowerCase().includes(normalizedQuery) ||
      item.label.toLowerCase().includes(normalizedQuery) ||
      item.description.toLowerCase().includes(normalizedQuery) ||
      item.code.toLowerCase().includes(normalizedQuery) ||
      item.category.toLowerCase().includes(normalizedQuery) ||
      item.tolerance.toLowerCase().includes(normalizedQuery) ||
      item.presets.some((preset) =>
        preset.title.toLowerCase().includes(normalizedQuery),
      )
    );
  });

  function selectModel(
    model: (typeof PART_TYPES)[number],
    preset?: PartModelPreset,
  ) {
    if (model.id === partType && !preset) {
      setCatalogModalOpen(false);
      return;
    }
    setPartType(model.id, preset?.dimensions);
    if (preset?.labelText) {
      setLabelText(preset.labelText);
    } else if ("textParam" in model && model.textParam) {
      setLabelText(model.textParam.initial);
    }
    setMaterialId(model.recommendedMaterialId);
    setCatalogModalOpen(false);
  }

  return (
    <AnimatePresence>
      {isCatalogModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="model-catalog-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setCatalogModalOpen(false)}
            className="fixed inset-0 bg-[#0E1014]/85 backdrop-blur-md"
          />

          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-[#262B36] bg-[#161920] text-[#F2F4F7] shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
          >
            {/* Верхняя шапка каталога */}
            <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-[#262B36] bg-[#0E1014]/80 px-5 py-4 sm:px-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[#00D1FF]/30 bg-[#00D1FF]/10 px-2 py-0.5 font-mono text-[11px] font-medium text-[#00D1FF]">
                    <Grid3X3 className="size-3.5" />
                    БИБЛИОТЕКА CAD · {PART_TYPES.length} МОДЕЛЕЙ
                  </span>
                  <span className="font-mono text-xs text-[#8A93A2]">
                    {PART_TYPES.reduce(
                      (acc, item) => acc + item.presets.length,
                      0,
                    )}{" "}
                    готовых типоразмеров
                  </span>
                </div>
                <h2
                  id="model-catalog-modal-title"
                  className="mt-1.5 text-lg font-bold tracking-tight sm:text-xl"
                >
                  Каталог параметрических CAD-моделей для редактирования
                </h2>
              </div>

              <button
                type="button"
                aria-label="Закрыть каталог моделей"
                onClick={() => setCatalogModalOpen(false)}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#262B36] bg-[#161920] text-[#8A93A2] transition-colors hover:border-[#8A93A2] hover:text-[#F2F4F7]"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Панель поиска и категорий */}
            <div className="flex flex-shrink-0 flex-col gap-3 border-b border-[#262B36] bg-[#12151B] px-5 py-3.5 sm:px-6">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#8A93A2]" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по названию, коду CAD, размеру или назначению (например: шкив, NEMA17, втулка, IP65, бирка)..."
                  aria-label="Поиск модели в каталоге"
                  className="h-10 w-full rounded-[12px] border border-[#262B36] bg-[#0E1014] pr-9 pl-10 font-mono text-xs text-[#F2F4F7] placeholder:text-[#8A93A2] focus:border-[#00D1FF] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Очистить поиск"
                    onClick={() => setSearchQuery("")}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-[#8A93A2] hover:text-[#F2F4F7]"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div
                role="tablist"
                aria-label="Фильтр по категориям деталей"
                className="flex flex-wrap items-center gap-1.5"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === "all"}
                  onClick={() => setSelectedCategory("all")}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]",
                    selectedCategory === "all"
                      ? "border-[#00D1FF] bg-[#00D1FF]/15 font-semibold text-[#00D1FF]"
                      : "border-[#262B36] bg-[#0E1014] text-[#8A93A2] hover:border-[#8A93A2]/50 hover:text-[#F2F4F7]",
                  )}
                >
                  Все модели ({PART_TYPES.length})
                </button>
                {PART_CATEGORIES.map((cat) => {
                  const count = PART_TYPES.filter(
                    (p) => p.categoryId === cat.id,
                  ).length;
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]",
                        active
                          ? "border-[#00D1FF] bg-[#00D1FF]/15 font-semibold text-[#00D1FF]"
                          : "border-[#262B36] bg-[#0E1014] text-[#8A93A2] hover:border-[#8A93A2]/50 hover:text-[#F2F4F7]",
                      )}
                    >
                      {cat.shortLabel} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Сетка моделей */}
            <div className="lab-scrollbar flex-1 overflow-y-auto p-5 sm:p-6">
              {filteredModels.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-[#262B36] bg-[#0E1014]/60 px-6 py-12 text-center">
                  <p className="font-mono text-xs text-[#00D1FF]">
                    {"CATALOG_QUERY // NO_MATCH"}
                  </p>
                  <p className="text-base font-semibold text-[#F2F4F7]">
                    По запросу «{searchQuery}» шаблоны не найдены
                  </p>
                  <p className="max-w-md text-xs text-[#8A93A2]">
                    Сбросьте фильтр категории или выберите ближайший базовый
                    шаблон — все диаметры, длины и высоты настраиваются с шагом
                    1 мм.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSearchQuery("");
                    }}
                    className="mt-1 rounded-lg border border-[#00D1FF]/50 bg-[#00D1FF]/15 px-3.5 py-1.5 font-mono text-xs font-semibold text-[#00D1FF] hover:bg-[#00D1FF]/25"
                  >
                    Показать все модели ({PART_TYPES.length})
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredModels.map((model) => {
                    const isSelected = partType === model.id;
                    const isHovered = hoveredId === model.id;
                    const recMat =
                      MATERIALS.find(
                        (m) => m.id === model.recommendedMaterialId,
                      ) ?? MATERIALS[0];

                    const defaultFormula = `${model.dimensions.d1.code}${model.dimensions.d1.initial} × ${model.dimensions.d2.code}${model.dimensions.d2.initial} × ${model.dimensions.h.code}${model.dimensions.h.initial} мм`;

                    return (
                      <article
                        key={model.id}
                        onPointerEnter={() => setHoveredId(model.id)}
                        onPointerLeave={() => setHoveredId(null)}
                        className={cn(
                          "flex flex-col justify-between gap-3.5 rounded-[18px] border bg-[#0E1014] p-4 transition-all duration-200",
                          isSelected
                            ? "border-[#FF5C1A] ring-1 ring-[#FF5C1A]/40"
                            : isHovered
                              ? "border-[#00D1FF]/65"
                              : "border-[#262B36]",
                        )}
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] text-[#8A93A2]">
                              {model.code} · {model.category}
                            </span>
                            {isSelected ? (
                              <span className="inline-flex items-center gap-1 rounded border border-[#FF5C1A]/50 bg-[#FF5C1A]/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#FF5C1A]">
                                <Check className="size-3" />В РЕДАКТОРЕ
                              </span>
                            ) : (
                              <span className="rounded border border-[#262B36] bg-[#161920] px-1.5 py-0.5 font-mono text-[10px] text-[#00D1FF]">
                                {recMat.code}
                              </span>
                            )}
                          </div>

                          <PartSchematicPreview
                            partType={model.id}
                            dimensionLabel={defaultFormula}
                            materialCode={recMat.code}
                            hovered={isHovered || isSelected}
                            size="md"
                          />

                          <div>
                            <h3 className="text-sm font-bold text-[#F2F4F7] sm:text-base">
                              {model.label}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#8A93A2]">
                              {model.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2.5 border-t border-[#262B36] pt-3">
                          {/* Быстрые типоразмеры */}
                          <div className="flex flex-col gap-1.5">
                            <span className="flex items-center gap-1 font-mono text-[10px] text-[#8A93A2] uppercase">
                              <Sparkles className="size-3 text-[#00D1FF]" />
                              Быстрый выбор типоразмера:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {model.presets.map((preset) => (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => selectModel(model, preset)}
                                  className="rounded-md border border-[#262B36] bg-[#161920] px-2 py-1 font-mono text-[11px] text-[#F2F4F7] transition-colors hover:border-[#00D1FF] hover:bg-[#00D1FF]/15 hover:text-[#00D1FF]"
                                >
                                  {preset.title}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => selectModel(model)}
                            className={cn(
                              "flex h-9 w-full items-center justify-center gap-2 rounded-[10px] border font-mono text-xs font-semibold transition-colors",
                              isSelected
                                ? "border-[#FF5C1A] bg-[#FF5C1A] text-[#0E1014]"
                                : "border-[#262B36] bg-[#161920] text-[#F2F4F7] hover:border-[#FF5C1A] hover:bg-[#FF5C1A]/15",
                            )}
                          >
                            <SlidersHorizontal className="size-3.5" />
                            {isSelected
                              ? "Редактировать текущую модель"
                              : "Загрузить в калькулятор"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
