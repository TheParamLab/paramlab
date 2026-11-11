"use client";

import { cn } from "@acme/ui";
import {
  ArrowRight,
  FileBox,
  Minus,
  Plus,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { type CalculatorTab, useCalculator } from "./calculator-context";
import {
  DIMENSION_LIMITS,
  type DimensionKey,
  type Dimensions,
  MATERIALS,
  type MaterialId,
  PART_TYPES,
} from "./data";
import { APP_LINKS } from "./links";
import { PartDrawing } from "./part-drawing";
import {
  calcPrice,
  clampBore,
  estimateMass,
  parseBinaryStl,
  SERIES_QUANTITY,
} from "./pricing";

const TABS: { id: CalculatorTab; label: string; hint: string }[] = [
  { id: "file", label: "У меня есть 3D-файл", hint: "STL / STEP / 3MF" },
  { id: "generator", label: "Онлайн-генератор", hint: "без чертежа" },
];

const ACCEPTED = ["stl", "step", "stp", "3mf"];
const WEIGHT = { min: 10, max: 1000, initial: 85 };
const QUANTITY = { min: 1, max: 100 };
const INSERTS_PRICE = 350;
const REINFORCE_PRICE = 500;
/** Доля объема модели, занятая пластиком (стенки + заполнение). */
const FILL_FACTOR = 0.5;
const DIMENSION_KEYS: DimensionKey[] = ["d1", "d2", "h"];

const number = new Intl.NumberFormat("ru-RU");
const rub = (value: number) => `${number.format(value)} ₽`;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function formatHours(hours: number) {
  if (hours < 24) return `~${number.format(hours)} ч`;
  return `~${Math.ceil(hours / 24)} дн.`;
}

interface UploadedModel {
  name: string;
  /** Габариты, если их удалось прочитать из файла. */
  size: string | null;
}

export function OrderCalculator() {
  const { tab, setTab, partType, setPartType } = useCalculator();
  const [model, setModel] = useState<UploadedModel | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [weight, setWeight] = useState(WEIGHT.initial);
  const [quantity, setQuantity] = useState(1);
  const [materialId, setMaterialId] = useState<MaterialId>("petg");
  const [inserts, setInserts] = useState(false);
  const [reinforce, setReinforce] = useState(false);
  const [dimensions, setDimensions] = useState<Dimensions>({
    d1: DIMENSION_LIMITS.d1.initial,
    d2: DIMENSION_LIMITS.d2.initial,
    h: DIMENSION_LIMITS.h.initial,
  });
  const [activeDimension, setActiveDimension] = useState<DimensionKey | null>(
    null,
  );

  const material = MATERIALS.find((m) => m.id === materialId) ?? MATERIALS[0];
  const part = PART_TYPES.find((p) => p.id === partType) ?? PART_TYPES[0];
  const massGrams =
    tab === "file"
      ? weight
      : estimateMass(partType, dimensions, material.density);
  const price = calcPrice({
    massGrams,
    rate: material.rate,
    quantity,
    extras: (inserts ? INSERTS_PRICE : 0) + (reinforce ? REINFORCE_PRICE : 0),
  });
  const boreClamped =
    partType === "bushing" &&
    clampBore(dimensions.d1, dimensions.d2) < dimensions.d2;

  async function handleFile(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED.includes(extension)) {
      setFileError("Поддерживаются файлы STL, STEP и 3MF.");
      return;
    }
    setFileError(null);
    const geometry =
      extension === "stl" ? parseBinaryStl(await file.arrayBuffer()) : null;
    setModel({
      name: file.name,
      size: geometry
        ? `${geometry.size.map((v) => Math.round(v)).join(" × ")} мм`
        : null,
    });
    if (geometry) {
      const grams = geometry.volumeCm3 * material.density * FILL_FACTOR;
      setWeight(clamp(Math.round(grams), WEIGHT.min, WEIGHT.max));
    }
  }

  function loadDemo() {
    setFileError(null);
    setModel({ name: "Корпус редуктора.stl", size: "115 × 80 × 45 мм" });
    setWeight(84);
  }

  return (
    <div
      id="calculator"
      className="bg-card scroll-mt-20 overflow-hidden rounded-2xl border shadow-sm"
    >
      <div
        role="tablist"
        aria-label="Способ расчета"
        className="grid grid-cols-2"
      >
        {TABS.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`calc-tab-${item.id}`}
              aria-selected={selected}
              aria-controls="calc-panel"
              onClick={() => setTab(item.id)}
              className={cn(
                "flex flex-col items-start gap-0.5 border-b px-4 py-3 text-left transition-colors outline-none first:border-r focus-visible:bg-muted sm:px-5",
                selected
                  ? "border-b-transparent"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                {item.id === "file" ? (
                  <FileBox className="size-4 shrink-0" />
                ) : (
                  <SlidersHorizontal className="size-4 shrink-0" />
                )}
                {item.label}
              </span>
              <span className="font-mono text-xs">{item.hint}</span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="calc-panel"
        aria-labelledby={`calc-tab-${tab}`}
        className="flex flex-col gap-5 p-4 sm:p-5"
      >
        {tab === "file" ? (
          <>
            {model ? (
              <div className="flex items-center gap-3 rounded-xl border p-3">
                <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <FileBox className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{model.name}</p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {model.size ?? "Габариты уточним после проверки файла"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Убрать файл"
                  onClick={() => setModel(null)}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-md transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div>
                <label
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    const file = event.dataTransfer.files[0];
                    if (file) void handleFile(file);
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors has-focus-visible:border-ring",
                    dragging
                      ? "border-brand bg-brand/5"
                      : "hover:border-foreground/40 hover:bg-muted/50",
                  )}
                >
                  <Upload className="text-muted-foreground size-6" />
                  <span className="text-sm font-medium">
                    Перетащите файл или нажмите, чтобы выбрать
                  </span>
                  <span className="text-muted-foreground font-mono text-xs">
                    .stl · .step · .3mf
                  </span>
                  <input
                    type="file"
                    accept=".stl,.step,.stp,.3mf"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleFile(file);
                      event.target.value = "";
                    }}
                  />
                </label>
                {fileError && (
                  <p role="alert" className="text-destructive mt-2 text-sm">
                    {fileError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={loadDemo}
                  className="mt-2 w-full rounded-lg px-3 py-2 text-sm underline-offset-4 hover:underline"
                >
                  Загрузить демо-модель:{" "}
                  <span className="font-mono">Корпус редуктора 84 г</span>
                </button>
              </div>
            )}
            <RangeField
              label="Расчетный вес детали"
              value={weight}
              unit="г"
              min={WEIGHT.min}
              max={WEIGHT.max}
              onChange={setWeight}
            />
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PART_TYPES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={partType === item.id}
                  onClick={() => setPartType(item.id)}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    partType === item.id
                      ? "border-foreground bg-foreground text-background"
                      : "hover:bg-muted",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="grid items-center gap-4 sm:grid-cols-2">
              <div className="bg-blueprint-fine rounded-xl border">
                <PartDrawing
                  partType={partType}
                  dimensions={dimensions}
                  active={activeDimension}
                />
              </div>
              <div className="flex flex-col gap-4">
                {DIMENSION_KEYS.map((key) => (
                  <RangeField
                    key={key}
                    label={part.dimensions[key].label}
                    value={dimensions[key]}
                    unit="мм"
                    min={DIMENSION_LIMITS[key].min}
                    max={DIMENSION_LIMITS[key].max}
                    onChange={(value) =>
                      setDimensions({ ...dimensions, [key]: value })
                    }
                    onActiveChange={(isActive) =>
                      setActiveDimension(isActive ? key : null)
                    }
                  />
                ))}
                <p className="text-muted-foreground text-xs">
                  {boreClamped
                    ? "D2 ограничен: стенка втулки не тоньше 2 мм. "
                    : null}
                  Расчетная масса:{" "}
                  <span className="text-foreground font-mono">
                    {number.format(massGrams)} г
                  </span>
                </p>
              </div>
            </div>
          </>
        )}

        <Group title="Материал">
          <div className="grid gap-2 sm:grid-cols-2">
            {MATERIALS.map((item) => (
              <label
                key={item.id}
                className={cn(
                  "flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                  materialId === item.id
                    ? "border-foreground bg-muted/60"
                    : "hover:bg-muted/40",
                )}
              >
                <input
                  type="radio"
                  name="material"
                  value={item.id}
                  checked={materialId === item.id}
                  onChange={() => setMaterialId(item.id)}
                  className="sr-only"
                />
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span
                    className={cn(
                      "rounded-md border px-1.5 py-0.5 font-mono text-xs font-medium",
                      "carbon" in item &&
                        "border-foreground bg-foreground text-background",
                    )}
                  >
                    {item.code}
                  </span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {item.temp}
                  </span>
                  <span className="ml-auto font-mono text-xs">
                    {item.rate} ₽/г
                  </span>
                </span>
                <span className="text-sm font-medium">{item.title}</span>
                <span className="text-muted-foreground text-xs">
                  {item.description}
                </span>
              </label>
            ))}
          </div>
        </Group>

        <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
          <Group title="Количество">
            <div className="flex h-9 w-fit items-center rounded-lg border">
              <button
                type="button"
                aria-label="Меньше"
                disabled={quantity <= QUANTITY.min}
                onClick={() => setQuantity(quantity - 1)}
                className="hover:bg-muted flex size-9 items-center justify-center rounded-l-lg transition-colors disabled:opacity-40"
              >
                <Minus className="size-4" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                aria-label="Количество, шт."
                min={QUANTITY.min}
                max={QUANTITY.max}
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    clamp(
                      Math.round(Number(event.target.value)) || QUANTITY.min,
                      QUANTITY.min,
                      QUANTITY.max,
                    ),
                  )
                }
                className="w-12 [appearance:textfield] bg-transparent text-center font-mono text-sm outline-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                aria-label="Больше"
                disabled={quantity >= QUANTITY.max}
                onClick={() => setQuantity(quantity + 1)}
                className="hover:bg-muted flex size-9 items-center justify-center rounded-r-lg transition-colors disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </Group>
          <Group title="Дополнительно">
            <div className="flex flex-col gap-2">
              <Option
                checked={inserts}
                onChange={setInserts}
                price={INSERTS_PRICE}
              >
                Вплавить латунные резьбовые втулки М3–М6
              </Option>
              <Option
                checked={reinforce}
                onChange={setReinforce}
                price={REINFORCE_PRICE}
              >
                Армирование закладной стальной шайбой/шпилькой
              </Option>
            </div>
          </Group>
        </div>
      </div>

      <div className="bg-foreground text-background flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <p className="text-background/60 text-xs">
              Итого за {number.format(quantity)} шт. ·{" "}
              <span className="font-mono">
                {number.format(price.totalMass)} г {material.code}
              </span>
            </p>
            <p
              aria-live="polite"
              className="font-mono text-4xl font-semibold tracking-tight"
            >
              {rub(price.total)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {price.series && (
              <span className="bg-brand text-brand-foreground rounded-md px-2 py-0.5 font-mono text-xs font-medium">
                Скидка за серию −20%
              </span>
            )}
            {quantity > 1 && (
              <span className="text-background/60 font-mono text-xs">
                {rub(price.perPiece)} / шт.
              </span>
            )}
          </div>
        </div>
        <p className="text-background/70 text-xs">
          Доставка в ПВЗ Ozon / Яндекс:{" "}
          <span className="font-mono">+199 ₽</span> · Срок печати:{" "}
          <span className="font-mono">{formatHours(price.printHours)}</span>
          {!price.series && quantity > 1 ? (
            <> · от {SERIES_QUANTITY} шт. — скидка 20%</>
          ) : null}
        </p>
        <a
          href={APP_LINKS.signup}
          className="bg-brand text-brand-foreground hover:bg-brand/85 flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-brand/50"
        >
          Оформить заказ и выбрать ПВЗ на карте
          <ArrowRight className="size-4" />
        </a>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {title}
      </p>
      {children}
    </div>
  );
}

function Option({
  checked,
  onChange,
  price,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  price: number;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-foreground mt-0.5 size-4 shrink-0"
      />
      <span className="flex-1">{children}</span>
      <span className="text-muted-foreground font-mono text-xs whitespace-nowrap">
        +{price} ₽
      </span>
    </label>
  );
}

function RangeField({
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  onChange,
  onActiveChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  onActiveChange?: (active: boolean) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="font-mono font-medium whitespace-nowrap">
          {value} {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        onPointerEnter={() => onActiveChange?.(true)}
        onPointerLeave={() => onActiveChange?.(false)}
        onFocus={() => onActiveChange?.(true)}
        onBlur={() => onActiveChange?.(false)}
        className="accent-brand h-5 w-full cursor-pointer"
      />
      <span className="text-muted-foreground flex justify-between font-mono text-xs">
        <span>{min}</span>
        <span>{max}</span>
      </span>
    </label>
  );
}
