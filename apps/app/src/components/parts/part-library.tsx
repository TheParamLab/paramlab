"use client";

import type { RouterOutputs } from "@acme/api";
import { useQuery } from "@tanstack/react-query";

import { orpc } from "~/orpc/react";
import { PartCard } from "./part-card";
import { PartUpload } from "./part-upload";

export function PartLibrary({
  initialParts,
}: {
  initialParts: RouterOutputs["part"]["list"];
}) {
  const { data: parts } = useQuery({
    ...orpc.part.list.queryOptions(),
    initialData: initialParts,
  });

  return (
    <div className="flex flex-col gap-6">
      <PartUpload />
      {parts.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          В библиотеке пока пусто. Загрузите первую модель — она сохранится
          здесь с габаритами и весом, и её можно будет заказывать повторно в
          один клик.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {parts.map((part) => (
            <li key={part.id} className="flex">
              <div className="flex w-full flex-col [&>article]:flex-1">
                <PartCard part={part} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
