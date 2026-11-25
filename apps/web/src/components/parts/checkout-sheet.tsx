"use client";

import type { RouterOutputs } from "@paramlab/api";
import { paths } from "@paramlab/config";
import {
  Button,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Spinner,
  toast,
} from "@paramlab/ui";
import {
  getMaterial,
  type MaterialId,
  normalizeRecipientPhone,
  recipientPhoneSchema,
} from "@paramlab/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { formatRub } from "~/lib/format";
import { orpc } from "~/orpc/react";

type Part = RouterOutputs["part"]["list"][number];
type Point = RouterOutputs["deliveryPoint"]["search"]["points"][number];

function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Оформление заказа: получатель, выбор ПВЗ Ozon из локального справочника,
 * серверный расчет печати и доставки, переход на оплату YooKassa.
 */
export function CheckoutSheet({
  part,
  materialId,
  quantity,
  open,
  onOpenChange,
}: {
  part: Part;
  materialId: MaterialId;
  quantity: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [recipientName, setRecipientName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [pointQuery, setPointQuery] = useState("");
  const [point, setPoint] = useState<Point | null>(null);

  const debouncedQuery = useDebounced(pointQuery);
  const recipientPhone = normalizeRecipientPhone(phoneInput);
  const phoneValid = recipientPhoneSchema.safeParse(recipientPhone).success;

  const search = useQuery({
    ...orpc.deliveryPoint.search.queryOptions({
      input: { query: debouncedQuery, limit: 10 },
    }),
    enabled: open && debouncedQuery.trim().length >= 2,
  });

  const quoteInput =
    point && phoneValid && recipientName.trim().length >= 2
      ? {
          partId: part.id,
          materialId,
          quantity,
          recipientName: recipientName.trim(),
          recipientPhone,
          deliveryPointId: point.id,
        }
      : null;
  const quote = useQuery({
    ...orpc.order.quote.queryOptions({
      input: quoteInput as NonNullable<typeof quoteInput>,
    }),
    enabled: open && quoteInput != null,
  });

  const createOrder = useMutation({
    ...orpc.order.create.mutationOptions(),
    onSuccess: async (order) => {
      await queryClient.invalidateQueries({ queryKey: orpc.order.key() });
      await queryClient.invalidateQueries({ queryKey: orpc.part.key() });
      if (order.paymentUrl) {
        toast.success("Заказ создан — переходим к оплате");
        window.location.href = order.paymentUrl;
        return;
      }
      toast.success(`Заказ № ${order.number} оформлен`);
      onOpenChange(false);
      router.push(paths.orders.byId(order.id));
    },
    onError: (error) => {
      toast.error(error.message || "Не удалось оформить заказ");
    },
  });

  const points = search.data?.points ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Оформление заказа</SheetTitle>
          <SheetDescription>
            {part.name} · {getMaterial(materialId).code} · {quantity} шт.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="checkout-name">Получатель</Label>
            <Input
              id="checkout-name"
              placeholder="Иванов Иван Иванович"
              autoComplete="name"
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="checkout-phone">Телефон для Ozon</Label>
            <Input
              id="checkout-phone"
              type="tel"
              placeholder="+7 999 123-45-67"
              autoComplete="tel"
              value={phoneInput}
              onChange={(event) => setPhoneInput(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              На этот номер должен быть зарегистрирован аккаунт Ozon — в него
              придет заказ в пункте выдачи.
            </p>
            {phoneInput.length > 3 && !phoneValid && (
              <p className="text-xs text-destructive">
                Укажите телефон в формате +7XXXXXXXXXX
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="checkout-point">Пункт выдачи Ozon</Label>
            <Input
              id="checkout-point"
              placeholder="Город или улица, например: Москва, Арбат"
              value={pointQuery}
              onChange={(event) => {
                setPointQuery(event.target.value);
                setPoint(null);
              }}
            />
            {search.isFetching && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Spinner className="size-3" /> Ищем пункты выдачи…
              </p>
            )}
            {!search.isFetching &&
              debouncedQuery.trim().length >= 2 &&
              points.length === 0 &&
              !point && (
                <p className="text-xs text-muted-foreground">
                  Пункты не найдены — уточните запрос.
                </p>
              )}
            {!point && points.length > 0 && (
              <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
                {points.map((candidate) => (
                  <li key={candidate.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPoint(candidate);
                        setPointQuery(candidate.address);
                      }}
                      className="flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span>
                        <span className="block font-medium">
                          {candidate.name ?? "Пункт выдачи"}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {candidate.address}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {point && (
              <p className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
                <PackageCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  <span className="block font-medium">{point.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {point.address}
                  </span>
                </span>
              </p>
            )}
          </div>

          {quoteInput && (
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-4">
              {quote.isFetching || !quote.data ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="size-4" /> Считаем стоимость…
                </p>
              ) : quote.isError ? (
                <p className="text-sm text-destructive">
                  {quote.error.message}
                </p>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Печать</span>
                    <span className="font-mono">
                      {formatRub(quote.data.printRub)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>
                      Доставка до ПВЗ
                      {quote.data.deliveryEtaDays != null &&
                        ` · ${quote.data.deliveryEtaDays} дн.`}
                    </span>
                    <span className="font-mono">
                      {formatRub(quote.data.deliveryRub)}
                      {quote.data.deliveryEstimated && "*"}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-medium">
                    <span>Итого</span>
                    <span className="font-mono text-lg">
                      {formatRub(quote.data.payableRub)}
                    </span>
                  </div>
                  {quote.data.deliveryEstimated && (
                    <p className="text-xs text-muted-foreground">
                      * предварительный тариф доставки, точную стоимость
                      подтвердим перед отправкой
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <Button
            size="lg"
            disabled={
              !quoteInput ||
              !quote.data ||
              quote.isError ||
              createOrder.isPending
            }
            onClick={() => quoteInput && createOrder.mutate(quoteInput)}
          >
            {createOrder.isPending
              ? "Создаем заказ…"
              : quote.data
                ? `Перейти к оплате · ${formatRub(quote.data.payableRub)}`
                : "Перейти к оплате"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
