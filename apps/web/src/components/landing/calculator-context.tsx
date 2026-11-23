"use client";

import { createContext, type ReactNode, use, useState } from "react";
import {
  type DimensionKey,
  type Dimensions,
  MATERIALS,
  type MaterialId,
  PART_TYPES,
  type PartTypeId,
} from "~/components/landing/data";

export type CalculatorTab = "file" | "generator";
export type ViewportRenderMode = "solid" | "wireframe" | "layers";

function getInitialDimensions(partType: PartTypeId): Dimensions {
  const part = PART_TYPES.find((item) => item.id === partType) ?? PART_TYPES[0];
  return {
    d1: part.dimensions.d1.initial,
    d2: part.dimensions.d2.initial,
    h: part.dimensions.h.initial,
  };
}

interface CalculatorContextValue {
  tab: CalculatorTab;
  setTab: (tab: CalculatorTab) => void;
  partType: PartTypeId;
  setPartType: (partType: PartTypeId, preset?: Dimensions) => void;
  materialId: MaterialId;
  setMaterialId: (materialId: MaterialId) => void;
  dimensions: Dimensions;
  setDimension: (key: DimensionKey, value: number) => void;
  setDimensions: (dimensions: Dimensions) => void;
  labelText: string;
  setLabelText: (labelText: string) => void;
  activeDimension: DimensionKey | null;
  setActiveDimension: (key: DimensionKey | null) => void;
  quantity: number;
  setQuantity: (quantity: number) => void;
  renderMode: ViewportRenderMode;
  setRenderMode: (mode: ViewportRenderMode) => void;
  isOrderModalOpen: boolean;
  setOrderModalOpen: (open: boolean) => void;
  isCatalogModalOpen: boolean;
  setCatalogModalOpen: (open: boolean) => void;
  /** Прокрутить к калькулятору, при необходимости сменив таб, шаблон и пресет размеров. */
  open: (
    tab?: CalculatorTab,
    partType?: PartTypeId,
    presetDimensions?: Dimensions,
    materialCode?: string,
    presetLabelText?: string,
  ) => void;
}

const CalculatorContext = createContext<CalculatorContextValue | null>(null);

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<CalculatorTab>("generator");
  const [partType, setPartTypeState] = useState<PartTypeId>("bushing");
  const [materialId, setMaterialId] = useState<MaterialId>("petg");
  const [dimensions, setDimensions] = useState<Dimensions>(() =>
    getInitialDimensions("bushing"),
  );
  const [labelText, setLabelText] = useState<string>("ТОМАТ");
  const [activeDimension, setActiveDimension] = useState<DimensionKey | null>(
    null,
  );
  const [quantity, setQuantity] = useState(1);
  const [renderMode, setRenderMode] = useState<ViewportRenderMode>("solid");
  const [isOrderModalOpen, setOrderModalOpen] = useState(false);
  const [isCatalogModalOpen, setCatalogModalOpen] = useState(false);

  function setPartType(nextPartType: PartTypeId, preset?: Dimensions) {
    setPartTypeState(nextPartType);
    setDimensions(preset ?? getInitialDimensions(nextPartType));
  }

  function setDimension(key: DimensionKey, value: number) {
    setDimensions((prev) => ({ ...prev, [key]: value }));
  }

  function open(
    nextTab?: CalculatorTab,
    nextPartType?: PartTypeId,
    presetDimensions?: Dimensions,
    materialCode?: string,
    presetLabelText?: string,
  ) {
    if (nextTab) setTab(nextTab);
    if (nextPartType) {
      setPartType(nextPartType, presetDimensions);
    } else if (presetDimensions) {
      setDimensions(presetDimensions);
    }
    if (presetLabelText) {
      setLabelText(presetLabelText);
    }
    if (materialCode) {
      const matched = MATERIALS.find(
        (m) => m.code.toLowerCase() === materialCode.toLowerCase(),
      );
      if (matched) setMaterialId(matched.id);
    }
    const calculator = document.getElementById("calculator");
    calculator?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      calculator?.focus({ preventScroll: true });
    }, 420);
  }

  return (
    <CalculatorContext
      value={{
        tab,
        setTab,
        partType,
        setPartType,
        materialId,
        setMaterialId,
        dimensions,
        setDimension,
        setDimensions,
        labelText,
        setLabelText,
        activeDimension,
        setActiveDimension,
        quantity,
        setQuantity,
        renderMode,
        setRenderMode,
        isOrderModalOpen,
        setOrderModalOpen,
        isCatalogModalOpen,
        setCatalogModalOpen,
        open,
      }}
    >
      {children}
    </CalculatorContext>
  );
}

export function useCalculator() {
  const context = use(CalculatorContext);
  if (!context) {
    throw new Error("useCalculator must be used inside CalculatorProvider");
  }
  return context;
}

/** Кнопка, которая открывает конфигуратор на нужном шаблоне и пресете. */
export function CalculatorTrigger({
  tab,
  partType,
  presetDimensions,
  materialCode,
  presetLabelText,
  className,
  children,
  onOpen,
}: {
  tab?: CalculatorTab;
  partType?: PartTypeId;
  presetDimensions?: Dimensions;
  materialCode?: string;
  presetLabelText?: string;
  className?: string;
  children: ReactNode;
  onOpen?: () => void;
}) {
  const { open } = useCalculator();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        open(tab, partType, presetDimensions, materialCode, presetLabelText);
        onOpen?.();
      }}
    >
      {children}
    </button>
  );
}
