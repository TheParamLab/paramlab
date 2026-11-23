"use client";

import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useCalculator } from "~/components/landing/calculator-context";
import { MATERIALS, PART_TYPES } from "~/components/landing/data";
import { APP_LINKS } from "~/components/landing/links";
import {
  calcPrice,
  clampBore,
  estimateMass,
} from "~/components/landing/pricing";
import { buildDraftPart, saveDraftPart } from "~/lib/draft-part";

import { normalizePlantTagLabel } from "~/lib/plant-tag-label";

const OZON_DELIVERY = {
  name: "Ozon Посылка (ПВЗ)",
  tag: "18 000+ пунктов по РФ",
  price: 199,
  eta: "2–3 дня",
  pvzSample: "Выдача по штрихкоду в приложении Ozon",
} as const;

const numberFmt = new Intl.NumberFormat("ru-RU");

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

export function OrderSpecModal() {
  const {
    isOrderModalOpen,
    setOrderModalOpen,
    partType,
    materialId,
    dimensions,
    labelText,
    quantity,
  } = useCalculator();

  const [city, setCity] = useState("Москва, ПВЗ на выбор");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Фокус-менеджмент: перенос при открытии, удержание Tab, восстановление при закрытии.
  useEffect(() => {
    if (!isOrderModalOpen) return;

    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    // Фокус на кнопку закрытия при открытии (первый видимый элемент заголовка).
    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOrderModalOpen(false);
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
      window.removeEventListener("keydown", onKeyDown);
      lastFocusedRef.current?.focus();
    };
  }, [isOrderModalOpen, setOrderModalOpen]);

  const part = PART_TYPES.find((p) => p.id === partType) ?? PART_TYPES[0];
  const material = MATERIALS.find((m) => m.id === materialId) ?? MATERIALS[0];

  const cleanLabelText =
    partType === "plant-tag" ? normalizePlantTagLabel(labelText) : undefined;
  const massGrams = estimateMass(partType, dimensions, material.density);
  const price = calcPrice({
    massGrams,
    rate: material.rate,
    quantity,
    extras: 0,
  });

  const effectiveD2 =
    partType === "bushing" || partType === "gear"
      ? clampBore(dimensions.d1, dimensions.d2)
      : dimensions.d2;

  return (
    <AnimatePresence>
      {isOrderModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setOrderModalOpen(false)}
            className="fixed inset-0 bg-[#0E1014]/85 backdrop-blur-md"
          />

          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-[24px] border border-[#262B36] bg-[#161920] text-[#F2F4F7] shadow-2xl"
          >
            {/* Верхняя шапка спецификации */}
            <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-[#262B36] bg-[#0E1014]/70 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md border border-[#00D1FF]/30 bg-[#00D1FF]/10 px-2 py-0.5 font-mono text-[11px] font-medium text-[#00D1FF]">
                    <ShieldCheck className="size-3.5" />
                    CAD PREVIEW · Допуск ±0.1 мм
                  </span>
                  <span className="font-mono text-xs text-[#8A93A2]">
                    {part.code}
                  </span>
                </div>
                <h2
                  id="order-modal-title"
                  className="mt-1.5 text-lg font-bold tracking-tight"
                >
                  Спецификация параметрической детали
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Закрыть окно спецификации"
                onClick={() => setOrderModalOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg border border-[#262B36] bg-[#161920] text-[#8A93A2] transition-colors hover:border-[#8A93A2] hover:text-[#F2F4F7]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-5 overflow-y-auto p-6">
              {/* Карточка параметров детали */}
              <div className="rounded-[12px] border border-[#262B36] bg-[#0E1014] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262B36] pb-3">
                  <div>
                    <p className="text-xs text-[#8A93A2]">Шаблон CAD</p>
                    <p className="text-sm font-semibold text-[#F2F4F7]">
                      {part.label}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#8A93A2]">Полимер</p>
                    <p className="font-mono text-sm font-semibold text-[#00D1FF]">
                      {material.code} ({material.temp})
                    </p>
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-3 font-mono tabular-nums">
                  <div className="rounded-lg border border-[#262B36]/80 bg-[#161920]/70 px-3 py-2">
                    <dt className="text-[11px] text-[#8A93A2]">
                      {part.dimensions.d1.code} · Габарит 1
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-[#F2F4F7]">
                      {dimensions.d1} мм
                    </dd>
                  </div>
                  <div className="rounded-lg border border-[#262B36]/80 bg-[#161920]/70 px-3 py-2">
                    <dt className="text-[11px] text-[#8A93A2]">
                      {part.dimensions.d2.code} · Габарит 2
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-[#F2F4F7]">
                      {effectiveD2} мм
                    </dd>
                  </div>
                  <div className="rounded-lg border border-[#262B36]/80 bg-[#161920]/70 px-3 py-2">
                    <dt className="text-[11px] text-[#8A93A2]">
                      {part.dimensions.h.code} · Высота
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-[#F2F4F7]">
                      {dimensions.h} мм
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-xs text-[#8A93A2] tabular-nums">
                  {cleanLabelText && (
                    <span className="w-full rounded-md border border-[#FF5C1A]/40 bg-[#FF5C1A]/10 px-2.5 py-1 text-[#F2F4F7]">
                      Надпись рельефа (Z = 2.4..3.0 мм):{" "}
                      <strong className="text-[#FF5C1A]">
                        «{cleanLabelText}»
                      </strong>
                    </span>
                  )}
                  <span>
                    Партия:{" "}
                    <strong className="text-[#F2F4F7]">{quantity} шт.</strong>
                  </span>
                  <span>
                    Расчетная масса:{" "}
                    <strong className="text-[#F2F4F7]">
                      {numberFmt.format(price.totalMass)} г
                    </strong>
                  </span>
                  <span>
                    Время печати:{" "}
                    <strong className="text-[#F2F4F7]">
                      ~{price.printHours} ч
                    </strong>
                  </span>
                </div>
              </div>

              {/* Доставка по РФ через Ozon */}
              <div className="flex flex-col gap-2.5">
                <span className="font-mono text-xs font-medium tracking-wider text-[#8A93A2] uppercase">
                  Способ доставки по РФ
                </span>
                <div className="flex flex-col items-start gap-1.5 rounded-[12px] border border-[#00D1FF] bg-[#00D1FF]/10 p-3.5 text-left">
                  <div className="flex w-full items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-[#F2F4F7]">
                      <Truck className="size-4 text-[#00D1FF]" />
                      {OZON_DELIVERY.name}
                    </span>
                    <CheckCircle2 className="size-4 text-[#00D1FF]" />
                  </div>
                  <span className="text-xs text-[#8A93A2]">
                    {OZON_DELIVERY.tag}
                  </span>
                  <div className="mt-1 flex w-full items-center justify-between border-t border-[#262B36]/80 pt-2 font-mono text-xs tabular-nums">
                    <span className="text-[#F2F4F7]">
                      +{OZON_DELIVERY.price} ₽
                    </span>
                    <span className="text-[#10B981]">{OZON_DELIVERY.eta}</span>
                  </div>
                </div>

                <div className="mt-1 flex items-center gap-2.5 rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3.5 py-2.5">
                  <MapPin className="size-4 shrink-0 text-[#FF5C1A]" />
                  <input
                    type="text"
                    aria-label="Город и пункт выдачи"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Укажите город или адрес ПВЗ"
                    className="w-full bg-transparent text-sm text-[#F2F4F7] placeholder:text-[#8A93A2] focus:outline-none"
                  />
                </div>
                <p className="flex items-center gap-1.5 font-mono text-[11px] text-[#8A93A2]">
                  <PackageCheck className="size-3.5 text-[#10B981]" />
                  {OZON_DELIVERY.pvzSample}
                </p>
              </div>

              {/* Итоговая сумма и переход к оформлению */}
              <div className="flex flex-col gap-3 border-t border-[#262B36] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-xs text-[#8A93A2] tabular-nums">
                    Печать {numberFmt.format(price.total)} ₽ + доставка{" "}
                    {OZON_DELIVERY.price} ₽
                  </p>
                  <p className="font-mono text-2xl font-bold text-[#F2F4F7] tabular-nums">
                    {numberFmt.format(price.total + OZON_DELIVERY.price)} ₽
                  </p>
                </div>

                <a
                  href={`${APP_LINKS.signup}?draft=1&partType=${encodeURIComponent(partType)}&material=${encodeURIComponent(material.id)}&d1=${dimensions.d1}&d2=${effectiveD2}&h=${dimensions.h}&qty=${quantity}&price=${price.total}${cleanLabelText ? `&text=${encodeURIComponent(cleanLabelText)}` : ""}`}
                  onClick={() => {
                    const draft = buildDraftPart({
                      partType,
                      materialId,
                      dimensions: {
                        d1: dimensions.d1,
                        d2: effectiveD2,
                        h: dimensions.h,
                      },
                      labelText: cleanLabelText,
                      quantity,
                      totalPriceRub: price.total,
                      city,
                    });
                    if (draft) saveDraftPart(draft);
                  }}
                  className="cta-border-beam inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#FF5C1A] px-6 text-sm font-semibold text-[#0E1014] transition-transform duration-240 outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]"
                >
                  Перейти к оплате и выбору ПВЗ
                  <ArrowRight className="size-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
