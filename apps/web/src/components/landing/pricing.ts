import type { Dimensions, PartTypeId } from "~/components/landing/data";

export const MIN_ORDER = 1400;
const MACHINE_START = 400;
export const SERIES_QUANTITY = 10;
const SERIES_FACTOR = 0.8;
/** Средняя производительность печати, г/ч — для оценки срока. */
const GRAMS_PER_HOUR = 20;

interface PriceInput {
  /** Масса одной детали, г. */
  massGrams: number;
  /** Тариф пластика, ₽/г. */
  rate: number;
  quantity: number;
  /** Сумма доп. опций, ₽. */
  extras: number;
}

export function calcPrice({ massGrams, rate, quantity, extras }: PriceInput) {
  const series = quantity >= SERIES_QUANTITY;
  const totalMass = massGrams * quantity;
  const raw =
    MACHINE_START + totalMass * rate * (series ? SERIES_FACTOR : 1) + extras;
  const total = Math.max(MIN_ORDER, Math.round(raw / 10) * 10);

  return {
    total,
    series,
    totalMass,
    perPiece: Math.round(total / quantity),
    printHours: Math.max(0.5, Math.round((totalMass / GRAMS_PER_HOUR) * 2) / 2),
  };
}

const WALL = 2.5;

/** Шаблоны с внешним диаметром D и соосным внутренним отверстием d. */
export function isConcentricBorePart(partType: PartTypeId): boolean {
  return (
    partType === "bushing" ||
    partType === "spacer-ring" ||
    partType === "gear" ||
    partType === "belt-pulley"
  );
}

/** Внутренний диаметр втулки не может быть больше внешнего. */
export function clampBore(d1: number, d2: number) {
  return Math.min(d2, d1 - 4);
}

/** Оценка массы детали из генератора, г. Размеры в мм, плотность в г/см³. */
export function estimateMass(
  partType: PartTypeId,
  { d1, d2, h }: Dimensions,
  density: number,
) {
  let volume: number;
  switch (partType) {
    case "adapter":
      // Две тонкостенные ступени со средним диаметром (D1 + D2) / 2.
      volume = Math.PI * WALL * ((d1 + d2) / 2 - WALL) * h;
      break;
    case "flange-nozzle": {
      // Круглая монтажная плита D1 + тонкостенный патрубок D2 высотой h.
      const nozzleR = Math.min(d2, d1 - 6);
      const plate =
        (Math.PI / 4) * (d1 ** 2 - Math.max(4, nozzleR - 5) ** 2) * 4;
      const pipe = Math.PI * WALL * Math.max(6, nozzleR - WALL) * h;
      volume = plate + pipe;
      break;
    }
    case "bushing": {
      const bore = clampBore(d1, d2);
      const body = (Math.PI / 4) * (d1 ** 2 - bore ** 2) * h;
      const flange = (Math.PI / 4) * ((d1 + 10) ** 2 - d1 ** 2) * 4;
      // Силовая деталь: плотное заполнение ~60 %.
      volume = (body + flange) * 0.6;
      break;
    }
    case "spacer-ring": {
      const bore = clampBore(d1, d2);
      const body = (Math.PI / 4) * (d1 ** 2 - bore ** 2) * h;
      volume = body * 0.65;
      break;
    }
    case "gear": {
      const bore = clampBore(d1, d2);
      const body = (Math.PI / 4) * (d1 ** 2 - bore ** 2) * h;
      // Учет впадин зубьев и силового заполнения ~68 %.
      volume = body * 0.68;
      break;
    }
    case "belt-pulley": {
      const bore = clampBore(d1, d2);
      const body = (Math.PI / 4) * (d1 ** 2 - bore ** 2) * h;
      const rims = (Math.PI / 4) * ((d1 + 8) ** 2 - d1 ** 2) * 5;
      volume = (body + rims) * 0.64;
      break;
    }
    case "din-box":
    case "junction-box":
      volume = 2 * (d1 * d2 + d1 * h + d2 * h) * WALL;
      break;
    case "end-cap":
      volume = d1 * d2 * 3 + 2 * (d1 + d2) * 2 * Math.min(h, 40);
      break;
    case "bracket":
    case "pipe-clamp": {
      // Угловой профиль / хомут: две пластины толщиной WALL + ребра жесткости.
      const base = d1 * d2 * WALL;
      const upright = d2 * h * WALL;
      const ribs = Math.min(d1, h) * d2 * WALL * 0.5;
      volume = base + upright + ribs;
      break;
    }
    case "organizer": {
      // Лоток со стенками и 2–3 перегородками.
      const floor = d1 * d2 * WALL;
      const walls = 2 * (d1 + d2) * h * WALL;
      const dividers = Math.min(d1, d2) * h * WALL * 1.5;
      volume = floor + walls + dividers;
      break;
    }
    case "plant-tag": {
      // Плоская головка (~50% длины) + конусный колышек (~50% длины) + рельефный кант/текст/ребро.
      const headArea = d1 * 0.5 * d2;
      const stakeArea = d1 * 0.5 * (d2 * 0.36);
      const effectiveThickness = Math.max(2.4, h * 0.85);
      volume = (headArea + stakeArea) * effectiveThickness;
      break;
    }
  }
  return Math.max(1, Math.round((volume / 1000) * density));
}

/** Габариты и объем бинарного STL (единицы — мм). `null`, если формат иной. */
export function parseBinaryStl(buffer: ArrayBuffer) {
  if (buffer.byteLength < 84) return null;
  const view = new DataView(buffer);
  const triangles = view.getUint32(80, true);
  if (triangles === 0 || 84 + triangles * 50 !== buffer.byteLength) return null;

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  let volume = 0;

  for (let i = 0; i < triangles; i++) {
    // 12 байт нормали, затем три вершины по три float32.
    const offset = 84 + i * 50 + 12;
    const v: number[] = [];
    for (let j = 0; j < 9; j++) v.push(view.getFloat32(offset + j * 4, true));
    const [ax = 0, ay = 0, az = 0, bx = 0, by = 0, bz = 0, cx = 0, cy = 0] = v;
    const cz = v[8] ?? 0;

    minX = Math.min(minX, ax, bx, cx);
    minY = Math.min(minY, ay, by, cy);
    minZ = Math.min(minZ, az, bz, cz);
    maxX = Math.max(maxX, ax, bx, cx);
    maxY = Math.max(maxY, ay, by, cy);
    maxZ = Math.max(maxZ, az, bz, cz);
    volume +=
      (ax * (by * cz - bz * cy) -
        ay * (bx * cz - bz * cx) +
        az * (bx * cy - by * cx)) /
      6;
  }

  return {
    size: [maxX - minX, maxY - minY, maxZ - minZ] as const,
    volumeCm3: Math.abs(volume) / 1000,
  };
}
