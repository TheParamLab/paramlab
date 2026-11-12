/**
 * Каталог материалов и расчет стоимости печати.
 *
 * Единый источник для API (цена всегда считается на сервере) и кабинета
 * (предварительная цена в интерфейсе). Тарифы совпадают с калькулятором
 * лендинга (`apps/web/src/components/landing`).
 */

export const MATERIALS = [
  {
    id: "petg",
    code: "PETG",
    title: "Базовый прочный",
    rate: 18,
    density: 1.27,
  },
  {
    id: "asa",
    code: "ASA / ABS",
    title: "Улица, авто и станки",
    rate: 24,
    density: 1.07,
  },
  {
    id: "pa6cf",
    code: "PA6-CF / PC",
    title: "Замена металла",
    rate: 38,
    density: 1.2,
  },
  {
    id: "tpu",
    code: "TPU 95A",
    title: "Гибкий демпфер",
    rate: 28,
    density: 1.21,
  },
] as const;

export type MaterialId = (typeof MATERIALS)[number]["id"];

export const MATERIAL_IDS = MATERIALS.map((m) => m.id) as [
  MaterialId,
  ...MaterialId[],
];

export function getMaterial(id: MaterialId) {
  return MATERIALS.find((m) => m.id === id) ?? MATERIALS[0];
}

/** Доля объема модели, занятая пластиком (стенки + заполнение). */
const FILL_FACTOR = 0.5;

/** Оценка массы детали по объему модели, г. */
export function estimateMassFromVolume(
  volumeCm3: number,
  materialId: MaterialId,
) {
  const grams = volumeCm3 * getMaterial(materialId).density * FILL_FACTOR;
  return Math.min(PART_MASS.max, Math.max(PART_MASS.min, Math.round(grams)));
}

/**
 * Масса детали в выбранном материале, г. Если известен объем модели, масса
 * пересчитывается по плотности пластика; иначе берется сохраненная.
 */
export function partMassFor(
  part: { massGrams: number; volumeCm3: number | null },
  materialId: MaterialId,
) {
  return part.volumeCm3 == null
    ? part.massGrams
    : estimateMassFromVolume(part.volumeCm3, materialId);
}

export const MIN_ORDER = 1400;
const MACHINE_START = 400;
export const SERIES_QUANTITY = 10;
const SERIES_FACTOR = 0.8;

export const PART_MASS = { min: 1, max: 5000 } as const;
export const ORDER_QUANTITY = { min: 1, max: 100 } as const;

/** Стоимость печати партии одной детали, ₽. */
export function calcPartPrice(input: {
  /** Масса одной детали, г. */
  massGrams: number;
  materialId: MaterialId;
  quantity: number;
}) {
  const series = input.quantity >= SERIES_QUANTITY;
  const totalMass = input.massGrams * input.quantity;
  const raw =
    MACHINE_START +
    totalMass *
      getMaterial(input.materialId).rate *
      (series ? SERIES_FACTOR : 1);
  const total = Math.max(MIN_ORDER, Math.round(raw / 10) * 10);

  return { total, series, totalMass };
}
