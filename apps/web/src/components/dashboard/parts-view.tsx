"use client";

import { cn, toast } from "@paramlab/ui";
import {
  Boxes,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { z } from "zod";
import {
  MATERIALS,
  type MaterialId,
  PART_TYPES,
  type PartTypeId,
} from "~/components/landing/data";
import { clampBore, estimateMass } from "~/components/landing/pricing";
import {
  calculateMinWallMm,
  createOrderFromPreset,
  formatDimensionFormula,
  isManifoldWallValid,
  normalizePartDimensions,
  setDashboardPresets,
  useDashboardPresets,
} from "~/lib/mock-dashboard";
import type { SavedPartPreset } from "~/types/dashboard";
import { EmptyBlueprintState } from "./empty-blueprint-state";
import { PartPresetCard } from "./part-preset-card";

const MATERIAL_FILTERS: readonly { id: "all" | MaterialId; label: string }[] = [
  { id: "all", label: "Все полимеры" },
  { id: "pa12", label: "PA12 Nylon" },
  { id: "petgcf", label: "PETG-CF" },
  { id: "abs", label: "ABS" },
  { id: "petg", label: "PETG" },
];

export function PartsView() {
  const prefersReducedMotion = useReducedMotion();
  const presets = useDashboardPresets();
  const [materialFilter, setMaterialFilter] = useState<"all" | MaterialId>(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  // Поля быстрого конструктора нового пресета
  const [newTitle, setNewTitle] = useState(
    "Фланцевая втулка редуктора (серия B)",
  );
  const [newNotes, setNewNotes] = useState(
    "Допуск посадки H8, фаска 1.0×45°, работа без смазки",
  );
  const [newPartType, setNewPartType] = useState<PartTypeId>("bushing");
  const [newMaterialId, setNewMaterialId] = useState<MaterialId>("pa12");
  const [newDims, setNewDims] = useState({ d1: 56, d2: 32, h: 48 });
  const [creatorError, setCreatorError] = useState<string | null>(null);

  const selectedTemplate =
    PART_TYPES.find((pt) => pt.id === newPartType) ?? PART_TYPES[0];

  const filteredPresets = presets.filter((preset) => {
    if (materialFilter !== "all" && preset.materialId !== materialFilter) {
      return false;
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.trim().toLowerCase();
      return (
        preset.title.toLowerCase().includes(q) ||
        preset.presetCode.toLowerCase().includes(q) ||
        preset.dimensionFormula.toLowerCase().includes(q) ||
        preset.categoryLabel.toLowerCase().includes(q) ||
        preset.materialCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function handleTemplateChange(nextType: PartTypeId) {
    setNewPartType(nextType);
    setCreatorError(null);
    const meta = PART_TYPES.find((pt) => pt.id === nextType) ?? PART_TYPES[0];
    setNewDims(
      normalizePartDimensions(nextType, {
        d1: meta.dimensions.d1.initial,
        d2: meta.dimensions.d2.initial,
        h: meta.dimensions.h.initial,
      }),
    );
  }

  function handleOrderPreset(
    preset: SavedPartPreset,
    payload: {
      materialId: MaterialId;
      quantity: number;
      dimensions: { d1: number; d2: number; h: number };
      totalPriceRub: number;
    },
  ) {
    const createdOrder = createOrderFromPreset(preset, payload);
    const mat =
      MATERIALS.find((m) => m.id === payload.materialId) ?? MATERIALS[0];
    const formula = formatDimensionFormula(preset.partType, payload.dimensions);

    toast.success(
      `Заказ № ${createdOrder.orderNumber}: «${preset.title}» (${formula}, ${payload.quantity} шт., ${mat.code}) отправлен в очередь печати`,
    );
  }

  function handleUpdatePreset(
    presetId: string,
    updated: {
      materialId: MaterialId;
      dimensions: { d1: number; d2: number; h: number };
    },
  ) {
    const mat =
      MATERIALS.find((m) => m.id === updated.materialId) ?? MATERIALS[0];
    setDashboardPresets((prev) =>
      prev.map((p) => {
        if (p.id !== presetId) return p;
        const normalized = normalizePartDimensions(
          p.partType,
          updated.dimensions,
        );
        const formula = formatDimensionFormula(p.partType, normalized);
        const minWallMm = calculateMinWallMm(p.partType, normalized);
        const manifoldVerified = isManifoldWallValid(p.partType, normalized);
        const unitMassGrams = estimateMass(p.partType, normalized, mat.density);
        return {
          ...p,
          materialId: updated.materialId,
          materialCode: mat.code,
          dimensionFormula: formula,
          unitMassGrams,
          minWallMm,
          manifoldVerified,
          dimensions: {
            d1: { ...p.dimensions.d1, value: normalized.d1 },
            d2: { ...p.dimensions.d2, value: normalized.d2 },
            h: { ...p.dimensions.h, value: normalized.h },
          },
        };
      }),
    );
  }

  function handleDeletePreset(presetId: string) {
    const target = presets.find((p) => p.id === presetId);
    setDashboardPresets((prev) => prev.filter((p) => p.id !== presetId));
    if (target) {
      toast.success(`Пресет ${target.presetCode} удален из библиотеки`);
    }
  }

  function handleCreatePreset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatorError(null);

    const partMeta =
      PART_TYPES.find((pt) => pt.id === newPartType) ?? PART_TYPES[0];
    const mat = MATERIALS.find((m) => m.id === newMaterialId) ?? MATERIALS[0];

    const presetSchema = z
      .object({
        title: z
          .string()
          .trim()
          .min(2, "Укажите наименование детали (не менее 2 символов)"),
        d1: z
          .number()
          .int("Размер должен быть целым числом")
          .min(
            partMeta.dimensions.d1.min,
            `${partMeta.dimensions.d1.label}: от ${partMeta.dimensions.d1.min} до ${partMeta.dimensions.d1.max} мм`,
          )
          .max(
            partMeta.dimensions.d1.max,
            `${partMeta.dimensions.d1.label}: от ${partMeta.dimensions.d1.min} до ${partMeta.dimensions.d1.max} мм`,
          ),
        d2: z
          .number()
          .int("Размер должен быть целым числом")
          .min(
            partMeta.dimensions.d2.min,
            `${partMeta.dimensions.d2.label}: от ${partMeta.dimensions.d2.min} до ${partMeta.dimensions.d2.max} мм`,
          )
          .max(
            partMeta.dimensions.d2.max,
            `${partMeta.dimensions.d2.label}: от ${partMeta.dimensions.d2.min} до ${partMeta.dimensions.d2.max} мм`,
          ),
        h: z
          .number()
          .int("Размер должен быть целым числом")
          .min(
            partMeta.dimensions.h.min,
            `${partMeta.dimensions.h.label}: от ${partMeta.dimensions.h.min} до ${partMeta.dimensions.h.max} мм`,
          )
          .max(
            partMeta.dimensions.h.max,
            `${partMeta.dimensions.h.label}: от ${partMeta.dimensions.h.min} до ${partMeta.dimensions.h.max} мм`,
          ),
      })
      .refine(
        (val) => {
          if (newPartType === "bushing" || newPartType === "gear") {
            return val.d2 <= clampBore(val.d1, val.d2);
          }
          return true;
        },
        {
          message:
            "Внутренний диаметр (d) должен быть минимум на 4 мм меньше наружного (D) для сохранения стенки ≥ 2.0 мм",
        },
      );

    const parsed = presetSchema.safeParse({
      title: newTitle,
      d1: newDims.d1,
      d2: newDims.d2,
      h: newDims.h,
    });

    if (!parsed.success) {
      const firstIssue =
        parsed.error.issues[0]?.message ?? "Проверьте параметры пресета";
      setCreatorError(firstIssue);
      toast.error(firstIssue);
      return;
    }

    const validDims = {
      d1: parsed.data.d1,
      d2: parsed.data.d2,
      h: parsed.data.h,
    };
    const minWallMm = calculateMinWallMm(newPartType, validDims);
    const manifoldVerified = isManifoldWallValid(newPartType, validDims);

    if (!manifoldVerified) {
      const msg = `Минимальная стенка детали (${minWallMm.toFixed(1)} мм) меньше допустимых 2.0 мм`;
      setCreatorError(msg);
      toast.error(msg);
      return;
    }

    const formula = formatDimensionFormula(newPartType, validDims);
    const codeNumber = 100 + presets.length * 7;
    const presetCode = `PRS-${partMeta.code.split("-")[1] ?? "CAD"}-${codeNumber}`;
    const unitMassGrams = estimateMass(newPartType, validDims, mat.density);

    const created: SavedPartPreset = {
      id: `prs-custom-${Date.now()}`,
      presetCode,
      title: parsed.data.title,
      notes: newNotes.trim() || partMeta.tolerance,
      categoryLabel: partMeta.shortLabel,
      partType: newPartType,
      materialId: newMaterialId,
      materialCode: mat.code,
      dimensionFormula: formula,
      dimensions: {
        d1: {
          code: partMeta.dimensions.d1.code,
          label: partMeta.dimensions.d1.label,
          value: validDims.d1,
          min: partMeta.dimensions.d1.min,
          max: partMeta.dimensions.d1.max,
        },
        d2: {
          code: partMeta.dimensions.d2.code,
          label: partMeta.dimensions.d2.label,
          value: validDims.d2,
          min: partMeta.dimensions.d2.min,
          max: partMeta.dimensions.d2.max,
        },
        h: {
          code: partMeta.dimensions.h.code,
          label: partMeta.dimensions.h.label,
          value: validDims.h,
          min: partMeta.dimensions.h.min,
          max: partMeta.dimensions.h.max,
        },
      },
      tolerance: partMeta.tolerance,
      unitMassGrams,
      estimatedPrintMinutes: Math.max(25, Math.round(unitMassGrams * 1.5)),
      defaultQuantity: 10,
      lastOrderedAt: "Новый пресет",
      totalOrdersCount: 0,
      manifoldVerified,
      minWallMm,
    };

    setDashboardPresets((prev) => [created, ...prev]);
    setIsCreatorOpen(false);
    toast.success(`Параметрический пресет ${presetCode} (${formula}) сохранен`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Верхний баннер библиотеки параметрических деталей */}
      <section className="flex flex-col justify-between gap-4 rounded-[16px] border border-[#262B36] bg-[#161920] p-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#00D1FF]">
            <Boxes className="size-4" />
            <span>PARAMETRIC PRESET VAULT · MANIFOLD VERIFIED</span>
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-[#F2F4F7] sm:text-2xl">
            Библиотека сохранённых деталей ({presets.length})
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#8A93A2] sm:text-sm">
            Каждый пресет хранит проверенную твердотельную геометрию{" "}
            <span className="font-mono text-[#F2F4F7]">D × T × H</span> и
            тепловой коэффициент усадки полимера. Меняйте тираж или материал и
            запускайте печать в 1 клик.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreatorOpen((v) => !v)}
          className="cta-border-beam inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#FF5C1A] px-4 font-mono text-xs font-semibold text-[#0E1014] transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]"
        >
          <Plus className="size-4" />
          {isCreatorOpen ? "Скрыть конструктор" : "Создать CAD-пресет"}
        </button>
      </section>

      {/* Встроенный конструктор нового параметрического пресета */}
      <AnimatePresence>
        {isCreatorOpen && (
          <motion.form
            onSubmit={handleCreatePreset}
            initial={
              prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.24 }}
            className="rounded-[16px] border border-[#00D1FF]/45 bg-[#161920] p-5"
          >
            <div className="flex items-center justify-between border-b border-[#262B36] pb-3.5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-[#00D1FF]" />
                <h2 className="font-mono text-xs font-bold tracking-wider text-[#F2F4F7] uppercase">
                  Новый параметрический пресет детали
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 font-mono text-xs text-[#10B981]">
                <ShieldCheck className="size-3.5" />
                Стенка ≥ {calculateMinWallMm(newPartType, newDims).toFixed(1)}{" "}
                мм
              </span>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="preset-title"
                    className="block font-mono text-xs text-[#8A93A2]"
                  >
                    Наименование узла / детали
                  </label>
                  <input
                    id="preset-title"
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="mt-1 h-10 w-full rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3 text-sm text-[#F2F4F7] focus:border-[#00D1FF] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="preset-notes"
                    className="block font-mono text-xs text-[#8A93A2]"
                  >
                    Техническое примечание (посадка, допуск, узел)
                  </label>
                  <input
                    id="preset-notes"
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="mt-1 h-10 w-full rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3 text-xs text-[#F2F4F7] focus:border-[#00D1FF] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="preset-type"
                      className="block font-mono text-xs text-[#8A93A2]"
                    >
                      Шаблон геометрии CAD
                    </label>
                    <select
                      id="preset-type"
                      value={newPartType}
                      onChange={(e) =>
                        handleTemplateChange(e.target.value as PartTypeId)
                      }
                      className="mt-1 h-10 w-full rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3 font-mono text-xs text-[#F2F4F7] focus:border-[#00D1FF] focus:outline-none"
                    >
                      {PART_TYPES.map((pt) => (
                        <option key={pt.id} value={pt.id}>
                          {pt.shortLabel} ({pt.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="preset-material"
                      className="block font-mono text-xs text-[#8A93A2]"
                    >
                      Базовый полимер
                    </label>
                    <select
                      id="preset-material"
                      value={newMaterialId}
                      onChange={(e) =>
                        setNewMaterialId(e.target.value as MaterialId)
                      }
                      className="mt-1 h-10 w-full rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3 font-mono text-xs text-[#F2F4F7] focus:border-[#00D1FF] focus:outline-none"
                    >
                      {MATERIALS.map((mat) => (
                        <option key={mat.id} value={mat.id}>
                          {mat.code} ({mat.temp})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Числовые параметры D1 / D2 / H */}
              <div className="flex flex-col justify-between rounded-[12px] border border-[#262B36] bg-[#0E1014] p-4 font-mono tabular-nums">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8A93A2]">Формула пресета:</span>
                    <span className="font-bold text-[#00D1FF]">
                      {formatDimensionFormula(newPartType, newDims)} мм
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2.5">
                    <div>
                      <label
                        htmlFor="dim-d1"
                        className="block text-[11px] text-[#8A93A2]"
                      >
                        {selectedTemplate.dimensions.d1.code} (
                        {selectedTemplate.dimensions.d1.min}–
                        {selectedTemplate.dimensions.d1.max} мм)
                      </label>
                      <input
                        id="dim-d1"
                        type="number"
                        step={1}
                        min={selectedTemplate.dimensions.d1.min}
                        max={selectedTemplate.dimensions.d1.max}
                        value={newDims.d1}
                        onChange={(e) => {
                          setCreatorError(null);
                          setNewDims((d) => ({
                            ...d,
                            d1: Math.round(Number(e.target.value) || 0),
                          }));
                        }}
                        className="mt-1 h-9 w-full rounded-lg border border-[#262B36] bg-[#161920] px-2.5 text-sm font-bold text-[#F2F4F7] focus:border-[#00D1FF] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="dim-d2"
                        className="block text-[11px] text-[#8A93A2]"
                      >
                        {selectedTemplate.dimensions.d2.code} (
                        {selectedTemplate.dimensions.d2.min}–
                        {selectedTemplate.dimensions.d2.max} мм)
                      </label>
                      <input
                        id="dim-d2"
                        type="number"
                        step={1}
                        min={selectedTemplate.dimensions.d2.min}
                        max={selectedTemplate.dimensions.d2.max}
                        value={newDims.d2}
                        onChange={(e) => {
                          setCreatorError(null);
                          setNewDims((d) => ({
                            ...d,
                            d2: Math.round(Number(e.target.value) || 0),
                          }));
                        }}
                        className="mt-1 h-9 w-full rounded-lg border border-[#262B36] bg-[#161920] px-2.5 text-sm font-bold text-[#F2F4F7] focus:border-[#00D1FF] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="dim-h"
                        className="block text-[11px] text-[#8A93A2]"
                      >
                        {selectedTemplate.dimensions.h.code} (
                        {selectedTemplate.dimensions.h.min}–
                        {selectedTemplate.dimensions.h.max} мм)
                      </label>
                      <input
                        id="dim-h"
                        type="number"
                        step={1}
                        min={selectedTemplate.dimensions.h.min}
                        max={selectedTemplate.dimensions.h.max}
                        value={newDims.h}
                        onChange={(e) => {
                          setCreatorError(null);
                          setNewDims((d) => ({
                            ...d,
                            h: Math.round(Number(e.target.value) || 0),
                          }));
                        }}
                        className="mt-1 h-9 w-full rounded-lg border border-[#262B36] bg-[#161920] px-2.5 text-sm font-bold text-[#F2F4F7] focus:border-[#00D1FF] focus:outline-none"
                      />
                    </div>
                  </div>

                  {creatorError && (
                    <p
                      role="alert"
                      className="mt-2.5 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-400"
                    >
                      {creatorError}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#262B36] pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCreatorOpen(false)}
                    className="h-9 rounded-lg border border-[#262B36] bg-[#161920] px-3 text-xs text-[#8A93A2] hover:text-[#F2F4F7]"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="h-9 rounded-lg bg-[#00D1FF] px-4 text-xs font-bold text-[#0E1014] transition-colors hover:bg-[#33DAFF]"
                  >
                    Сохранить пресет в библиотеку
                  </button>
                </div>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Панель фильтрации по материалам и поиска по формуле размеров */}
      <section className="flex flex-col justify-between gap-3 rounded-[16px] border border-[#262B36] bg-[#161920] p-4 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-1.5">
          {MATERIAL_FILTERS.map((item) => {
            const active = materialFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setMaterialFilter(item.id)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]",
                  active
                    ? "border-[#00D1FF] bg-[#00D1FF]/15 font-semibold text-[#00D1FF]"
                    : "border-[#262B36] bg-[#0E1014] text-[#8A93A2] hover:border-[#8A93A2]/50 hover:text-[#F2F4F7]",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="relative flex-1 md:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8A93A2]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск пресета: PRS-BSH, D56, корпус..."
            aria-label="Поиск сохранённых пресетов деталей"
            className="h-10 w-full rounded-[12px] border border-[#262B36] bg-[#0E1014] pr-9 pl-9 font-mono text-xs text-[#F2F4F7] placeholder:text-[#8A93A2] focus:border-[#00D1FF] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Очистить поиск пресетов"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-[#8A93A2] hover:text-[#F2F4F7]"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* Сетка карточек пресетов или EmptyBlueprintState */}
      {filteredPresets.length === 0 ? (
        <EmptyBlueprintState
          code="PRESET_VAULT // EMPTY_SELECTION"
          title="В библиотеке нет пресетов по заданному фильтру"
          description="Сбросьте фильтр полимера или создайте новый параметрический CAD-пресет с размерами D × T × H для мгновенного повтора заказов."
          secondaryLabel="Показать все пресеты"
          onSecondaryAction={() => {
            setMaterialFilter("all");
            setSearchQuery("");
          }}
          actionLabel="Создать CAD-пресет"
          onAction={() => setIsCreatorOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPresets.map((preset) => (
            <PartPresetCard
              key={preset.id}
              preset={preset}
              onOrderPreset={handleOrderPreset}
              onUpdatePreset={handleUpdatePreset}
              onDeletePreset={handleDeletePreset}
            />
          ))}
        </div>
      )}
    </div>
  );
}
