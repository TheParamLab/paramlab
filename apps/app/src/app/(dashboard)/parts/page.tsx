import { Skeleton } from "@acme/ui";
import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteHeader } from "~/components/layout";
import { PartLibrary } from "~/components/parts/part-library";
import { api } from "~/orpc/server";

export const metadata: Metadata = { title: "Мои детали" };

export default function PartsPage() {
  return (
    <>
      <SiteHeader title="Мои детали" />
      <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Библиотека деталей
          </h1>
          <p className="text-sm text-muted-foreground">
            Загруженные модели хранятся здесь бессрочно — повторный заказ
            занимает один клик.
          </p>
        </div>
        {/* Оболочка пререндерится; список деталей ждёт запроса. */}
        <Suspense fallback={<LibrarySkeleton />}>
          <Library />
        </Suspense>
      </div>
    </>
  );
}

async function Library() {
  return <PartLibrary initialParts={await api.part.list()} />;
}

function LibrarySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-32 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {["a", "b", "c"].map((key) => (
          <Skeleton key={key} className="h-96 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
