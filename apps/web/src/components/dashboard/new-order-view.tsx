"use client";

import { cn, toast } from "@paramlab/ui";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Truck,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "~/auth/client";
import {
  clearDraftPart,
  type DraftPartData,
  readDraftPartFromStorage,
} from "~/lib/draft-part";
import {
  createOrderFromDraft,
  MOCK_ENGINEER_PROFILE,
} from "~/lib/mock-dashboard";
import { PartSchematicPreview } from "./part-schematic-preview";

const numberFmt = new Intl.NumberFormat("ru-RU");

export function NewOrderView() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;
  const [draft, setDraft] = useState<DraftPartData | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [selectedPvzId, setSelectedPvzId] = useState<string>(
    MOCK_ENGINEER_PROFILE.pickupPoints[0]?.id ?? "pvz-ozon-118",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDraft(readDraftPartFromStorage());
    setIsLoadingDraft(false);
  }, []);

  if (isLoadingDraft) {
    return <p role="status">Загружаем черновик…</p>;
  }
  if (!draft) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <h1 className="text-2xl font-bold">Черновик не найден</h1>
        <Link href="/#calculator" className="text-[#00D1FF] underline">
          Вернуться в конфигуратор
        </Link>
      </div>
    );
  }

  const selectedPvz =
    MOCK_ENGINEER_PROFILE.pickupPoints.find((p) => p.id === selectedPvzId) ??
    MOCK_ENGINEER_PROFILE.pickupPoints[0];

  function handleConfirmOrder() {
    if (!draft || !userId || !selectedPvz || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const created = createOrderFromDraft(userId, draft, selectedPvz);
      clearDraftPart();
      toast.success(
        `Демо-заказ № ${created.orderNumber} сохранён в этом браузере.`,
      );
      router.push("/orders" as Route);
    } catch {
      toast.error(
        "Не удалось сохранить заказ. Черновик сохранён, попробуйте ещё раз.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#10B981]/35 bg-[#10B981]/12 px-2.5 py-0.5 font-mono text-xs font-medium text-[#10B981]">
            <span aria-hidden="true">●</span> Конфигурация сохранена
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#F2F4F7]">
            Оформление заказа по сохранённому черновику
          </h1>
        </div>

        <Link
          href={"/orders" as Route}
          className="inline-flex items-center gap-1.5 font-mono text-xs text-[#8A93A2] transition-colors hover:text-[#F2F4F7]"
        >
          <ArrowLeft className="size-3.5" />К списку заказов
        </Link>
      </div>

      {/* Карточка сохранённой детали */}
      <section className="rounded-[16px] border border-[#262B36] bg-[#161920] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262B36] pb-3.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-[#00D1FF]" />
            <span className="font-mono text-xs font-semibold text-[#00D1FF] uppercase">
              {`ПАСПОРТ ЧЕРНОВИКА // ${draft.templateCode}`}
            </span>
          </div>
          <span className="font-mono text-xs text-[#8A93A2]">
            Допуск ±0.1 мм · ISO 2768-mK
          </span>
        </div>

        <div className="mt-4 grid gap-5 sm:grid-cols-[200px_1fr] sm:items-center">
          <PartSchematicPreview
            partType={draft.partType}
            dimensionLabel={draft.dimensionFormula}
            materialCode={draft.materialCode}
            hovered
          />

          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs text-[#8A93A2]">Наименование шаблона</p>
              <h2 className="text-lg font-bold text-[#F2F4F7]">
                {draft.templateLabel}
              </h2>
            </div>

            <dl className="grid grid-cols-3 gap-2.5 font-mono tabular-nums">
              <div className="rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3 py-2">
                <dt className="text-[11px] text-[#8A93A2]">Размеры</dt>
                <dd className="mt-0.5 text-sm font-bold text-[#00D1FF]">
                  {draft.dimensionFormula}
                </dd>
              </div>
              <div className="rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3 py-2">
                <dt className="text-[11px] text-[#8A93A2]">Материал</dt>
                <dd className="mt-0.5 text-sm font-bold text-[#F2F4F7]">
                  {draft.materialCode}
                </dd>
              </div>
              <div className="rounded-[12px] border border-[#262B36] bg-[#0E1014] px-3 py-2">
                <dt className="text-[11px] text-[#8A93A2]">Партия</dt>
                <dd className="mt-0.5 text-sm font-bold text-[#F2F4F7]">
                  {draft.quantity} шт. ({draft.totalMassGrams} г)
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Выбор ПВЗ Ozon */}
      <section className="rounded-[16px] border border-[#262B36] bg-[#161920] p-5 sm:p-6">
        <div className="flex items-center justify-between border-b border-[#262B36] pb-3.5">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-[#10B981]" />
            <h2 className="font-mono text-xs font-bold tracking-wider text-[#F2F4F7] uppercase">
              Пункт выдачи Ozon Посылка (+{draft.deliveryRub} ₽)
            </h2>
          </div>
          <span className="font-mono text-xs text-[#10B981]">
            Доставка 2–3 дня
          </span>
        </div>

        <div className="mt-4 grid gap-2.5">
          {MOCK_ENGINEER_PROFILE.pickupPoints.map((pvz) => {
            const active = pvz.id === selectedPvz?.id;
            return (
              <button
                key={pvz.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedPvzId(pvz.id)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-[12px] border p-3.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]",
                  active
                    ? "border-[#00D1FF] bg-[#00D1FF]/10"
                    : "border-[#262B36] bg-[#0E1014] hover:border-[#8A93A2]/50",
                )}
              >
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <Truck className="size-3.5 text-[#00D1FF]" />
                    <span className="font-bold text-[#F2F4F7]">{pvz.code}</span>
                    <span className="text-[#8A93A2]">· г. {pvz.city}</span>
                  </div>
                  <p className="mt-1 text-sm text-[#F2F4F7]">{pvz.address}</p>
                </div>
                {active && (
                  <CheckCircle2 className="size-5 shrink-0 text-[#00D1FF]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-[#262B36] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="font-mono tabular-nums">
            <p className="text-xs text-[#8A93A2]">
              Печать {numberFmt.format(draft.totalPriceRub)} ₽ + доставка{" "}
              {draft.deliveryRub} ₽
            </p>
            <p className="text-2xl font-bold text-[#F2F4F7]">
              {numberFmt.format(draft.totalPriceRub + draft.deliveryRub)} ₽
            </p>
          </div>

          <button
            type="button"
            onClick={handleConfirmOrder}
            disabled={isSubmitting || !userId || !selectedPvz}
            className="cta-border-beam inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[#FF5C1A] px-6 text-sm font-bold text-[#0E1014] transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]"
          >
            <span>{isSubmitting ? "Проверка..." : "Сохранить демо-заказ"}</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
