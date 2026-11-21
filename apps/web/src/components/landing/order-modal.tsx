"use client";

import { cn } from "@paramlab/ui";
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
import { useEffect, useState } from "react";
import { useCalculator } from "./calculator-context";
import { MATERIALS, PART_TYPES } from "./data";
import { APP_LINKS } from "./links";
import { calcPrice, clampBore, estimateMass } from "./pricing";

const CARRIERS = [
  {
    id: "ozon",
    name: "Ozon Посылка (ПВЗ)",
    tag: "18 000+ пунктов по РФ",
    price: 199,
    eta: "2–3 дня",
    pvzSample: "Выдача по штрихкоду в приложении Ozon",
  },
  {
    id: "cdek",
    name: "СДЭК Экспресс (ПВЗ / Курьер)",
    tag: "Приоритетная авиа/авто-логистика",
    price: 290,
    eta: "1–3 дня",
    pvzSample: "Трек-номер и фотоконтроль со штангенциркулем перед отправкой",
  },
] as const;

type CarrierId = (typeof CARRIERS)[number]["id"];

const numberFmt = new Intl.NumberFormat("ru-RU");

export function OrderSpecModal() {
  const {
    isOrderModalOpen,
    setOrderModalOpen,
    partType,
    materialId,
    dimensions,
    quantity,
  } = useCalculator();

  const [carrierId, setCarrierId] = useState<CarrierId>("ozon");
  const [city, setCity] = useState("Москва, ПВЗ на выбор");

  useEffect(() => {
    if (!isOrderModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOrderModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOrderModalOpen, setOrderModalOpen]);

  const part = PART_TYPES.find((p) => p.id === partType) ?? PART_TYPES[0];
  const material = MATERIALS.find((m) => m.id === materialId) ?? MATERIALS[0];
  const carrier = CARRIERS.find((c) => c.id === carrierId) ?? CARRIERS[0];

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
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-[24px] border border-[#262B36] bg-[#161920] text-[#F2F4F7] shadow-2xl"
          >
            {/* Верхняя шапка спецификации */}
            <div className="flex items-start justify-between gap-4 border-b border-[#262B36] bg-[#0E1014]/70 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md border border-[#10B981]/30 bg-[#10B981]/10 px-2 py-0.5 font-mono text-[11px] font-medium text-[#10B981]">
                    <ShieldCheck className="size-3.5" />
                    Manifold OK · Допуск ±0.1 мм
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
                type="button"
                aria-label="Закрыть окно спецификации"
                onClick={() => setOrderModalOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg border border-[#262B36] bg-[#161920] text-[#8A93A2] transition-colors hover:border-[#8A93A2] hover:text-[#F2F4F7]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-5 p-6">
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

              {/* Выбор службы доставки (Ozon / СДЭК) */}
              <div className="flex flex-col gap-2.5">
                <span className="font-mono text-xs font-medium tracking-wider text-[#8A93A2] uppercase">
                  Способ доставки по РФ
                </span>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {CARRIERS.map((item) => {
                    const selected = carrierId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setCarrierId(item.id)}
                        className={cn(
                          "flex flex-col items-start gap-1.5 rounded-[12px] border p-3.5 text-left transition-all duration-240 outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]",
                          selected
                            ? "border-[#00D1FF] bg-[#00D1FF]/10"
                            : "border-[#262B36] bg-[#0E1014] hover:border-[#8A93A2]/50",
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-[#F2F4F7]">
                            <Truck className="size-4 text-[#00D1FF]" />
                            {item.name}
                          </span>
                          {selected && (
                            <CheckCircle2 className="size-4 text-[#00D1FF]" />
                          )}
                        </div>
                        <span className="text-xs text-[#8A93A2]">
                          {item.tag}
                        </span>
                        <div className="mt-1 flex w-full items-center justify-between border-t border-[#262B36]/80 pt-2 font-mono text-xs tabular-nums">
                          <span className="text-[#F2F4F7]">
                            +{item.price} ₽
                          </span>
                          <span className="text-[#10B981]">{item.eta}</span>
                        </div>
                      </button>
                    );
                  })}
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
                  {carrier.pvzSample}
                </p>
              </div>

              {/* Итоговая сумма и переход к оформлению */}
              <div className="flex flex-col gap-3 border-t border-[#262B36] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-xs text-[#8A93A2] tabular-nums">
                    Печать {numberFmt.format(price.total)} ₽ + доставка{" "}
                    {carrier.price} ₽
                  </p>
                  <p className="font-mono text-2xl font-bold text-[#F2F4F7] tabular-nums">
                    {numberFmt.format(price.total + carrier.price)} ₽
                  </p>
                </div>

                <a
                  href={APP_LINKS.signup}
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
