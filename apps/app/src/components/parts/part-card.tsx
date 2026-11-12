"use client";

import type { RouterOutputs } from "@acme/api";
import { paths } from "@acme/config";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  toast,
} from "@acme/ui";
import {
  calcPartPrice,
  getMaterial,
  type MaterialId,
  ORDER_QUANTITY,
  SERIES_QUANTITY,
} from "@acme/validators";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileBox, Minus, Plus, Repeat, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatNumber, formatRub } from "~/lib/format";
import { orpc } from "~/orpc/react";
import { MaterialSelect } from "./material-select";

type Part = RouterOutputs["part"]["list"][number];

const clampQuantity = (value: number) =>
  Math.min(ORDER_QUANTITY.max, Math.max(ORDER_QUANTITY.min, value));

export function PartCard({ part }: { part: Part }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [materialId, setMaterialId] = useState<MaterialId>(
    part.lastOrder?.materialId ?? part.materialId,
  );
  const [quantity, setQuantity] = useState(part.lastOrder?.quantity ?? 1);

  const price = calcPartPrice({
    massGrams: part.massGrams,
    materialId,
    quantity,
  });

  const createOrder = useMutation({
    ...orpc.order.create.mutationOptions(),
    onSuccess: async (order) => {
      toast.success(`Заказ № ${order.number} оформлен`);
      await queryClient.invalidateQueries({ queryKey: orpc.order.key() });
      await queryClient.invalidateQueries({ queryKey: orpc.part.key() });
      router.push(paths.orders.byId(order.id));
    },
    onError: (error) => {
      toast.error(error.message || "Не удалось оформить заказ");
    },
  });

  const deletePart = useMutation({
    ...orpc.part.delete.mutationOptions(),
    onSuccess: async () => {
      toast.success("Деталь удалена из библиотеки");
      await queryClient.invalidateQueries({ queryKey: orpc.part.key() });
    },
    onError: (error) => {
      toast.error(error.message || "Не удалось удалить деталь");
    },
  });

  const size =
    part.sizeX != null && part.sizeY != null && part.sizeZ != null
      ? `${[part.sizeX, part.sizeY, part.sizeZ].map((v) => Math.round(v)).join(" × ")} мм`
      : null;
  const last = part.lastOrder;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <div className="relative flex aspect-[4/3] items-center justify-center bg-muted">
        {part.previewUrl ? (
          // biome-ignore lint/performance/noImgElement: presigned-ссылка S3
          <img
            src={part.previewUrl}
            alt={`3D-превью детали «${part.name}»`}
            loading="lazy"
            className="size-full object-contain p-3"
          />
        ) : (
          <FileBox className="size-10 text-muted-foreground" />
        )}
        <Badge
          variant="outline"
          className="absolute top-2 left-2 bg-background font-mono uppercase"
        >
          {part.format}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium" title={part.name}>
              {part.name}
            </h3>
            <p className="font-mono text-xs text-muted-foreground">
              {size ? `${size} · ` : ""}
              {formatNumber(part.massGrams)} г
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Удалить деталь «${part.name}»`}
                  disabled={deletePart.isPending}
                >
                  <Trash2 />
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить деталь?</AlertDialogTitle>
                <AlertDialogDescription>
                  «{part.name}» исчезнет из библиотеки. Уже оформленные заказы
                  сохранятся.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deletePart.mutate({ id: part.id })}
                >
                  Удалить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {last && (
          <Button
            variant="secondary"
            className="h-auto min-h-9 justify-start py-2 text-left whitespace-normal"
            disabled={createOrder.isPending}
            onClick={() =>
              createOrder.mutate({
                partId: part.id,
                materialId: last.materialId,
                quantity: last.quantity,
              })
            }
          >
            <Repeat data-icon="inline-start" />
            Напечатать ещё {formatNumber(last.quantity)} шт. ·{" "}
            {getMaterial(last.materialId).code}
          </Button>
        )}

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex gap-2">
            <MaterialSelect
              aria-label="Материал"
              value={materialId}
              onChange={setMaterialId}
            />
            <div className="flex h-9 shrink-0 items-center rounded-md border">
              <button
                type="button"
                aria-label="Меньше"
                disabled={quantity <= ORDER_QUANTITY.min}
                onClick={() => setQuantity(quantity - 1)}
                className="flex size-9 items-center justify-center rounded-l-md transition-colors hover:bg-muted disabled:opacity-40"
              >
                <Minus className="size-4" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                aria-label="Количество, шт."
                min={ORDER_QUANTITY.min}
                max={ORDER_QUANTITY.max}
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    clampQuantity(Math.round(Number(event.target.value)) || 1),
                  )
                }
                className="w-10 [appearance:textfield] bg-transparent text-center font-mono text-sm outline-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                aria-label="Больше"
                disabled={quantity >= ORDER_QUANTITY.max}
                onClick={() => setQuantity(quantity + 1)}
                className="flex size-9 items-center justify-center rounded-r-md transition-colors hover:bg-muted disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <p
                aria-live="polite"
                className="font-mono text-xl font-semibold tracking-tight"
              >
                {formatRub(price.total)}
              </p>
              <p className="text-xs text-muted-foreground">
                {price.series
                  ? "Скидка за серию −20%"
                  : `от ${SERIES_QUANTITY} шт. — скидка 20%`}
              </p>
            </div>
            <Button
              disabled={createOrder.isPending}
              onClick={() =>
                createOrder.mutate({ partId: part.id, materialId, quantity })
              }
            >
              {createOrder.isPending ? "Оформляем…" : "Заказать"}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
