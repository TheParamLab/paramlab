import {
  MATERIALS,
  type MaterialId,
  PART_TYPES,
  type PartTypeId,
} from "~/components/landing/data";
import {
  calcPrice,
  clampBore,
  estimateMass,
  isConcentricBorePart,
} from "~/components/landing/pricing";

import { normalizePlantTagLabel } from "~/lib/plant-tag-label";

export const DRAFT_PART_STORAGE_KEY = "paramlab_draft_part";

export interface DraftPartData {
  partType: PartTypeId;
  templateCode: string;
  templateLabel: string;
  materialId: MaterialId;
  materialCode: string;
  materialTemp: string;
  dimensions: {
    d1: number;
    d2: number;
    h: number;
  };
  labelText?: string;
  dimensionFormula: string;
  quantity: number;
  unitMassGrams: number;
  totalMassGrams: number;
  totalPriceRub: number;
  deliveryRub: number;
  city?: string;
  savedAt: string;
}

function resolveMaterial(input?: string | null) {
  if (!input) return MATERIALS.find((m) => m.id === "petgcf") ?? MATERIALS[0];
  const lower = input.trim().toLowerCase();
  return (
    MATERIALS.find(
      (m) =>
        m.id.toLowerCase() === lower ||
        m.code.toLowerCase() === lower ||
        m.code.replace(/[^a-z0-9]/gi, "").toLowerCase() ===
          lower.replace(/[^a-z0-9]/gi, ""),
    ) ??
    MATERIALS.find((m) => m.id === "petgcf") ??
    MATERIALS[0]
  );
}

function resolvePartType(input?: string | null) {
  if (!input) return PART_TYPES[0];
  const lower = input.trim().toLowerCase();
  return (
    PART_TYPES.find(
      (pt) =>
        pt.id.toLowerCase() === lower ||
        pt.code.toLowerCase() === lower ||
        pt.shortLabel.toLowerCase() === lower,
    ) ?? PART_TYPES[0]
  );
}

export function formatDraftDimensionFormula(
  partType: PartTypeId,
  dims: { d1: number; d2: number; h: number },
  labelText?: string | null,
): string {
  const part = PART_TYPES.find((p) => p.id === partType) ?? PART_TYPES[0];
  if (isConcentricBorePart(partType)) {
    const bore = clampBore(dims.d1, dims.d2);
    const wall = Math.max(2, Math.round((dims.d1 - bore) / 2));
    return `D${dims.d1} × T${wall} × H${dims.h}`;
  }
  const baseFormula = `${part.dimensions.d1.code}${dims.d1} × ${part.dimensions.d2.code}${dims.d2} × ${part.dimensions.h.code}${dims.h}`;
  if (partType === "plant-tag" && labelText?.trim()) {
    return `${baseFormula} · «${labelText.trim().slice(0, 12)}»`;
  }
  return baseFormula;
}

export function buildDraftPart(params: {
  partType?: PartTypeId | string | null;
  materialId?: MaterialId | string | null;
  dimensions?: Partial<{ d1: number; d2: number; h: number }>;
  labelText?: string | null;
  dimensionFormula?: string | null;
  quantity?: number;
  totalPriceRub?: number;
  city?: string;
}): DraftPartData | null {
  const part = resolvePartType(params.partType);
  const material = resolveMaterial(params.materialId);

  const rawDimensions = {
    d1: params.dimensions?.d1 ?? part.dimensions.d1.initial,
    d2: params.dimensions?.d2 ?? part.dimensions.d2.initial,
    h: params.dimensions?.h ?? part.dimensions.h.initial,
  };
  for (const key of ["d1", "d2", "h"] as const) {
    const { min, max } = part.dimensions[key];
    const value = rawDimensions[key];
    if (!Number.isFinite(value) || value < min || value > max) return null;
  }

  const d1 = Math.round(rawDimensions.d1);
  const rawD2 = Math.round(rawDimensions.d2);
  const h = Math.round(rawDimensions.h);
  const d2 = isConcentricBorePart(part.id) ? clampBore(d1, rawD2) : rawD2;
  if (d2 < part.dimensions.d2.min) return null;

  const quantity =
    typeof params.quantity === "number" &&
    Number.isFinite(params.quantity) &&
    params.quantity >= 1
      ? Math.min(500, Math.round(params.quantity))
      : 1;

  const unitMassGrams = estimateMass(part.id, { d1, d2, h }, material.density);
  const pricing = calcPrice({
    massGrams: unitMassGrams,
    rate: material.rate,
    quantity,
    extras: 0,
  });

  const cleanLabelText =
    part.id === "plant-tag"
      ? normalizePlantTagLabel(params.labelText)
      : undefined;

  const suppliedFormula = params.dimensionFormula?.trim();
  let formula =
    suppliedFormula ||
    formatDraftDimensionFormula(part.id, { d1, d2, h }, cleanLabelText);

  if (suppliedFormula && cleanLabelText) {
    const quotedLabel = `«${cleanLabelText}»`;
    if (!suppliedFormula.toUpperCase().includes(quotedLabel)) {
      formula = `${suppliedFormula} · ${quotedLabel}`;
    }
  }

  const totalPriceRub =
    typeof params.totalPriceRub === "number" &&
    Number.isFinite(params.totalPriceRub) &&
    params.totalPriceRub > 0
      ? Math.round(params.totalPriceRub)
      : pricing.total;

  return {
    partType: part.id,
    templateCode: part.code,
    templateLabel: part.label,
    materialId: material.id,
    materialCode: material.code,
    materialTemp: material.temp,
    dimensions: { d1, d2, h },
    ...(cleanLabelText ? { labelText: cleanLabelText } : {}),
    dimensionFormula: formula,
    quantity,
    unitMassGrams,
    totalMassGrams: pricing.totalMass,
    totalPriceRub,
    deliveryRub: 199,
    city: params.city,
    savedAt: new Date().toISOString(),
  };
}

export function saveDraftPart(draft: DraftPartData): void {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(draft);
  try {
    window.sessionStorage.setItem(DRAFT_PART_STORAGE_KEY, serialized);
  } catch {
    // Игнорируем ошибки квоты sessionStorage
  }
  try {
    window.localStorage.setItem(DRAFT_PART_STORAGE_KEY, serialized);
  } catch {
    // Игнорируем ошибки квоты localStorage
  }
}

export function clearDraftPart(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DRAFT_PART_STORAGE_KEY);
  } catch {
    // ignore
  }
  try {
    window.localStorage.removeItem(DRAFT_PART_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function parseRawDraftObject(raw: unknown): DraftPartData | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const partTypeInput =
    typeof obj.partType === "string"
      ? obj.partType
      : typeof obj.template === "string"
        ? obj.template
        : null;

  const materialInput =
    typeof obj.materialId === "string"
      ? obj.materialId
      : typeof obj.materialCode === "string"
        ? obj.materialCode
        : typeof obj.material === "string"
          ? obj.material
          : null;

  const dimsObj =
    obj.dimensions && typeof obj.dimensions === "object"
      ? (obj.dimensions as Record<string, unknown>)
      : obj;

  const d1 =
    typeof dimsObj.d1 === "number"
      ? dimsObj.d1
      : typeof dimsObj.d === "number"
        ? dimsObj.d
        : undefined;
  const d2 =
    typeof dimsObj.d2 === "number"
      ? dimsObj.d2
      : typeof dimsObj.t === "number"
        ? dimsObj.t
        : undefined;
  const h = typeof dimsObj.h === "number" ? dimsObj.h : undefined;

  const formula =
    typeof obj.dimensionFormula === "string"
      ? obj.dimensionFormula
      : typeof obj.dimensionsLabel === "string"
        ? obj.dimensionsLabel
        : typeof obj.dims === "string"
          ? obj.dims
          : null;

  const quantity =
    typeof obj.quantity === "number"
      ? obj.quantity
      : typeof obj.qty === "number"
        ? obj.qty
        : undefined;

  const price =
    typeof obj.totalPriceRub === "number"
      ? obj.totalPriceRub
      : typeof obj.price === "number"
        ? obj.price
        : undefined;

  if (
    !partTypeInput &&
    !materialInput &&
    d1 == null &&
    d2 == null &&
    h == null &&
    !formula
  )
    return null;

  const labelText =
    typeof obj.labelText === "string"
      ? obj.labelText
      : typeof obj.text === "string"
        ? obj.text
        : undefined;

  const draft = buildDraftPart({
    partType: partTypeInput,
    materialId: materialInput,
    dimensions: { d1, d2, h },
    labelText,
    dimensionFormula: formula,
    quantity,
    totalPriceRub: price,
    city: typeof obj.city === "string" ? obj.city : undefined,
  });

  if (!draft) return null;

  if (typeof obj.savedAt === "string") draft.savedAt = obj.savedAt;
  if (typeof obj.templateLabel === "string" && obj.templateLabel.trim()) {
    draft.templateLabel = obj.templateLabel.trim();
  }
  if (typeof obj.templateCode === "string" && obj.templateCode.trim()) {
    draft.templateCode = obj.templateCode.trim();
  }

  return draft;
}

export function readDraftPartFromStorage(): DraftPartData | null {
  if (typeof window === "undefined") return null;

  const sources = [
    () => window.sessionStorage.getItem(DRAFT_PART_STORAGE_KEY),
    () => window.localStorage.getItem(DRAFT_PART_STORAGE_KEY),
  ];

  for (const getRaw of sources) {
    try {
      const raw = getRaw();
      if (!raw) continue;
      const parsed: unknown = JSON.parse(raw);
      const draft = parseRawDraftObject(parsed);
      if (draft) return draft;
    } catch {
      // Переходим к следующему хранилищу
    }
  }

  return null;
}

export function readDraftPartFromSearchParams(
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
): DraftPartData | null {
  if (!searchParams) return null;

  const rawDraftJson = searchParams.get(DRAFT_PART_STORAGE_KEY);
  if (rawDraftJson) {
    try {
      const parsed: unknown = JSON.parse(rawDraftJson);
      const draft = parseRawDraftObject(parsed);
      if (draft) return draft;
    } catch {
      // Если передана строка формулы или некорректный JSON, пробуем разобрать ниже
    }
  }

  const partParam =
    searchParams.get("partType") ??
    searchParams.get("template") ??
    searchParams.get("part");
  const materialParam =
    searchParams.get("material") ?? searchParams.get("materialId");
  const dimsParam = searchParams.get("dims") ?? searchParams.get("dimensions");
  const d1Param = searchParams.get("d1") ?? searchParams.get("d");
  const d2Param = searchParams.get("d2") ?? searchParams.get("t");
  const hParam = searchParams.get("h");
  const priceParam = searchParams.get("price");
  const qtyParam = searchParams.get("qty") ?? searchParams.get("quantity");
  const textParam = searchParams.get("text") ?? searchParams.get("labelText");

  const hasAnyParam = Boolean(
    partParam || materialParam || dimsParam || d1Param || d2Param || hParam,
  );

  if (!hasAnyParam) return null;

  const d1 = d1Param ? Number(d1Param) : undefined;
  const d2 = d2Param ? Number(d2Param) : undefined;
  const h = hParam ? Number(hParam) : undefined;
  const quantity = qtyParam ? Number(qtyParam) : undefined;
  const totalPriceRub = priceParam ? Number(priceParam) : undefined;

  return buildDraftPart({
    partType: partParam,
    materialId: materialParam,
    dimensions: { d1, d2, h },
    labelText: textParam,
    dimensionFormula: dimsParam,
    quantity,
    totalPriceRub,
  });
}

export function restoreDraftPart(
  searchParams: Pick<URLSearchParams, "get">,
): DraftPartData | null {
  const fromUrl = readDraftPartFromSearchParams(searchParams);
  const stored = readDraftPartFromStorage();
  if (!fromUrl) return stored;

  if (
    stored &&
    stored.partType === fromUrl.partType &&
    stored.materialId === fromUrl.materialId &&
    stored.quantity === fromUrl.quantity &&
    stored.dimensions.d1 === fromUrl.dimensions.d1 &&
    stored.dimensions.d2 === fromUrl.dimensions.d2 &&
    stored.dimensions.h === fromUrl.dimensions.h
  ) {
    return stored;
  }

  saveDraftPart(fromUrl);
  return fromUrl;
}

export function hasStoredDraftPart(): boolean {
  return readDraftPartFromStorage() !== null;
}
