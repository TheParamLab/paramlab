"use client";

import { paths } from "@paramlab/config";
import { cn } from "@paramlab/ui";
import { calcPartPrice, estimateMassFromVolume } from "@paramlab/validators";
import { ArrowDown, FileUp, PackageOpen, Truck } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { parseStl, STL_PARSE_MAX_BYTES } from "~/lib/stl";

const DELIVERY_RUB = 199;

const rubFmt = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});
const numFmt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

interface Estimate {
  fileName: string;
  size: [number, number, number];
  massGrams: number;
  printRub: number;
  smallPart: boolean;
}

/**
 * Первый экран лендинга: загрузка своей STL — мгновенная цена в браузере
 * по тем же тарифам, что считает сервер (пакет @paramlab/validators).
 * Файл никуда не уходит до регистрации: разбор локальный.
 */
export function UploadHero() {
  const attemptRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function analyze(file: File) {
    const attempt = ++attemptRef.current;
    setError(null);
    setEstimate(null);
    if (!file.name.toLowerCase().endsWith(".stl")) {
      setError(
        "Пока считаем цену только по STL — остальные форматы принимаем в кабинете.",
      );
      return;
    }
    if (file.size > STL_PARSE_MAX_BYTES) {
      setError(
        "Файл крупнее 25 МБ — загрузите его в кабинете, там посчитаем вручную.",
      );
      return;
    }
    const buffer = await file.arrayBuffer().catch(() => null);
    if (attempt !== attemptRef.current) return;
    const mesh = buffer && parseStl(buffer);
    if (!mesh) {
      setError(
        "Не удалось прочитать STL — файл повреждён или имеет нестандартный формат. Загрузите его в кабинете.",
      );
      return;
    }
    const massGrams = estimateMassFromVolume(mesh.volumeCm3, "petg");
    const price = calcPartPrice({
      massGrams,
      materialId: "petg",
      quantity: 1,
      size: mesh.size,
    });
    setEstimate({
      fileName: file.name,
      size: mesh.size,
      massGrams,
      printRub: price.total,
      smallPart: price.smallPart,
    });
  }

  const total = estimate ? estimate.printRub + DELIVERY_RUB : null;

  return (
    <section
      aria-labelledby="upload-hero-title"
      className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 pt-16 pb-10 sm:px-6 lg:px-8"
    >
      <div className="flex max-w-3xl flex-col items-center gap-4 text-center">
        <p className="font-mono text-sm tracking-widest text-lab-cyan uppercase">
          3D-печать на заказ · от 990 ₽
        </p>
        <h1
          id="upload-hero-title"
          className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
        >
          Загрузите STL — узнайте цену за 10 секунд
        </h1>
        <p className="max-w-xl text-lg text-lab-muted">
          Напечатаем деталь на инженерных принтерах и отправим в ближайший пункт
          выдачи Ozon. Принтер покупать не нужно.
        </p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          const file = event.dataTransfer.files[0];
          if (file) void analyze(file);
        }}
        className={cn(
          "flex w-full max-w-2xl cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition-colors duration-240",
          dragOver
            ? "border-brand bg-brand/10"
            : "border-lab-border-strong bg-lab-inset hover:border-brand/60",
        )}
      >
        <FileUp className="size-10 text-brand" aria-hidden />
        <span className="text-lg font-medium">
          Перетащите STL сюда или выберите файл
        </span>
        <span className="text-sm text-lab-muted">
          Файл не покидает браузер — цена считается локально по объему модели
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".stl"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void analyze(file);
            event.target.value = "";
          }}
        />
      </button>

      {error && (
        <p
          role="alert"
          className="max-w-2xl text-center text-sm text-brand-soft"
        >
          {error}
        </p>
      )}

      {estimate && total != null && (
        <div
          aria-live="polite"
          className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-lab-border-strong bg-lab-inset p-6"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p
              className="max-w-md truncate font-medium"
              title={estimate.fileName}
            >
              {estimate.fileName}
            </p>
            <p className="font-mono text-sm text-lab-muted">
              {estimate.size.map((v) => numFmt.format(v)).join(" × ")} мм ·{" "}
              {numFmt.format(estimate.massGrams)} г PETG
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-lab-muted">
                Печать{estimate.smallPart ? " · тариф мелкой детали" : ""}
              </span>
              <span className="font-mono">
                {rubFmt.format(estimate.printRub)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-lab-muted">
                <Truck className="size-4" aria-hidden /> Доставка до ПВЗ Ozon
              </span>
              <span className="font-mono">{rubFmt.format(DELIVERY_RUB)}</span>
            </div>
            <div className="flex justify-between border-t border-lab-border-strong pt-2 text-base font-medium">
              <span>Итого под ключ</span>
              <span className="font-mono text-xl text-lab-cyan">
                {rubFmt.format(total)}
              </span>
            </div>
          </div>
          <Link
            href={paths.parts.root}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-6 font-medium text-brand-foreground transition-colors duration-240 hover:bg-brand-hover"
          >
            <PackageOpen className="size-5" aria-hidden />
            Заказать печать этой детали
          </Link>
          <p className="text-center text-xs text-lab-muted">
            Понадобится бесплатная регистрация — файл вы загрузите ещё раз в
            личном кабинете, оплата картой через YooKassa.
          </p>
        </div>
      )}

      <a
        href="#calculator"
        className="flex items-center gap-2 text-sm text-lab-muted transition-colors duration-240 hover:text-lab-text"
      >
        Нет готовой модели? Соберите деталь в конструкторе ниже
        <ArrowDown className="size-4" aria-hidden />
      </a>
    </section>
  );
}
