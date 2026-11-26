"use client";

import { cn } from "@paramlab/ui";
import { Home, RefreshCw } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect } from "react";
import {
  primaryErrorActionClass,
  secondaryErrorActionClass,
} from "~/components/error-pages/action-classes";
import { ErrorPageShell } from "~/components/error-pages/error-page-shell";

function getErrorDigest(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return undefined;
  }
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.length > 0 ? digest : undefined;
}

function useErrorLog(error: unknown) {
  useEffect(() => {
    console.error(error);
  }, [error]);
}

export function ErrorRecoveryPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useErrorLog(error);
  const digest = getErrorDigest(error);

  return (
    <ErrorPageShell
      code="500"
      eyebrow="Сбой производственного контура"
      title="Сервис временно вышел из допуска"
      description="Во время сборки страницы произошла непредвиденная ошибка. Попробуйте повторить запрос — чаще всего контур восстанавливается без потери данных."
      tone="orange"
      telemetry={[
        { label: "Module", value: "render pipeline" },
        { label: "Recovery", value: "ready", accent: true },
        { label: "Digest", value: digest ?? "client runtime" },
      ]}
      actions={
        <>
          <button
            type="button"
            onClick={() => retry()}
            className={primaryErrorActionClass}
          >
            <RefreshCw className="size-4" />
            Повторить запрос
          </button>
          <Link href="/" className={secondaryErrorActionClass}>
            <Home className="size-4 text-lab-cyan" />
            На главную
          </Link>
        </>
      }
      footnote={
        digest ? (
          <>
            ID инцидента:{" "}
            <span className="text-lab-cyan select-all">{digest}</span>. Сообщите
            его поддержке, если ошибка повторяется.
          </>
        ) : (
          "Если ошибка повторяется, обновите страницу позже или вернитесь в конфигуратор."
        )
      }
    />
  );
}

export function ErrorRecoveryPanel({
  error,
  retry,
  title = "Что-то пошло не так",
  description = "Произошла непредвиденная ошибка. Попробуйте ещё раз.",
  secondaryHref = "/cabinet",
  secondaryLabel = "В кабинет",
  className,
}: {
  error: unknown;
  retry: () => void;
  title?: string;
  description?: string;
  secondaryHref?: Route;
  secondaryLabel?: string;
  className?: string;
}) {
  useErrorLog(error);
  const digest = getErrorDigest(error);

  return (
    <div
      className={cn(
        "relative flex min-h-[380px] flex-1 items-center justify-center overflow-hidden rounded-[24px] border border-lab-border bg-lab-surface p-6",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="bg-blueprint-fine pointer-events-none absolute inset-0 opacity-35"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[-12%] size-80 rounded-full bg-brand/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-35%] left-[-10%] size-96 rounded-full bg-lab-cyan/8 blur-3xl"
      />

      <div className="relative z-10 flex max-w-lg flex-col items-center px-2 py-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/35 bg-brand/10 px-3 py-1 font-mono text-[11px] font-medium tracking-[0.16em] text-brand uppercase">
          <span className="size-1.5 rounded-full bg-brand shadow-[0_0_10px_var(--brand)]" />
          HTTP 500 · recovery ready
        </div>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-balance text-lab-text sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-lab-muted sm:text-base">
          {description}
        </p>
        {digest && (
          <p className="mt-4 font-mono text-xs text-lab-muted">
            ID инцидента:{" "}
            <span className="text-lab-cyan select-all">{digest}</span>
          </p>
        )}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => retry()}
            className={primaryErrorActionClass}
          >
            <RefreshCw className="size-4" />
            Повторить
          </button>
          <Link href={secondaryHref} className={secondaryErrorActionClass}>
            <Home className="size-4 text-lab-cyan" />
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
