import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Общая оболочка страниц авторизации: миллиметровый фон, логотип и карточка
 * формы. Ширина колонки и метка CAD задаются пропсами, чтобы пять страниц
 * не дублировали одну и ту же разметку.
 */
export function AuthShell({
  children,
  width = "sm",
  withBadge = false,
}: {
  children: ReactNode;
  width?: "sm" | "xs";
  withBadge?: boolean;
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-[#0E1014] p-6 text-[#F2F4F7] md:p-10">
      <div
        aria-hidden="true"
        className="bg-blueprint-fine pointer-events-none absolute inset-0 opacity-60"
      />
      <div
        className={
          width === "xs"
            ? "relative z-10 flex w-full max-w-xs flex-col gap-6"
            : "relative z-10 flex w-full max-w-sm flex-col gap-6"
        }
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 self-center text-[#F2F4F7] outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]"
        >
          <svg
            viewBox="0 0 32 32"
            aria-hidden="true"
            className="size-8 shrink-0"
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
          >
            <path d="M16 3 27 9.5v13L16 29 5 22.5v-13L16 3Z" stroke="#F2F4F7" />
            <path d="M5 9.5 16 16l11-6.5M16 16v13" stroke="#00D1FF" />
            <path
              d="M8.5 15.5v5.2l4.5 2.6v-5.2"
              stroke="#FF5C1A"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-lg leading-none font-bold tracking-tight">
            PARAMLAB
          </span>
          {withBadge && (
            <span className="rounded border border-[#262B36] bg-[#161920] px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-[#00D1FF] uppercase">
              CAD · 0.1 MM
            </span>
          )}
        </Link>
        {children}
      </div>
    </div>
  );
}
