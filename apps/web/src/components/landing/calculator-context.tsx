"use client";

import { createContext, type ReactNode, use, useState } from "react";
import type { PartTypeId } from "./data";

export type CalculatorTab = "file" | "generator";

interface CalculatorContextValue {
  tab: CalculatorTab;
  setTab: (tab: CalculatorTab) => void;
  partType: PartTypeId;
  setPartType: (partType: PartTypeId) => void;
  /** Прокрутить к калькулятору, при необходимости сменив таб и шаблон. */
  open: (tab?: CalculatorTab, partType?: PartTypeId) => void;
}

const CalculatorContext = createContext<CalculatorContextValue | null>(null);

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<CalculatorTab>("file");
  const [partType, setPartType] = useState<PartTypeId>("adapter");

  function open(nextTab?: CalculatorTab, nextPartType?: PartTypeId) {
    if (nextTab) setTab(nextTab);
    if (nextPartType) setPartType(nextPartType);
    document
      .getElementById("calculator")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <CalculatorContext value={{ tab, setTab, partType, setPartType, open }}>
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

/** Кнопка, которая открывает калькулятор на нужном табе / шаблоне. */
export function CalculatorTrigger({
  tab,
  partType,
  className,
  children,
  onOpen,
}: {
  tab?: CalculatorTab;
  partType?: PartTypeId;
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
        open(tab, partType);
        onOpen?.();
      }}
    >
      {children}
    </button>
  );
}
