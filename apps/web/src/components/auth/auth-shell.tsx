import { ThemeToggle } from "@paramlab/ui";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { ContextPanel } from "./context-panel";

/**
 * Split-Screen оболочка страниц авторизации paramlab.ru (Dark Engineering Theme):
 * - Десктоп (lg:grid-cols-[45%_55%]): слева рабочая зона #0E1014 с логотипом,
 *   ссылкой «← Вернуться в конфигуратор» (/), карточкой AuthCard (max-w-[400px])
 *   и строкой политики конфиденциальности; справа ContextPanel с миллиметровкой,
 *   вращающейся wireframe-моделью и мини-паспортом детали (или 3 инженерными фактами).
 * - Мобильные (< lg): только левая рабочая зона по центру без горизонтального скролла.
 */
export function AuthShell({
  children,
  width: _width = "sm",
  withBadge = true,
}: {
  children: ReactNode;
  width?: "sm" | "xs";
  withBadge?: boolean;
}) {
  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-lab-bg text-lab-text lg:grid lg:grid-cols-[45%_55%]">
      {/* Левая часть: Рабочая зона (#0E1014) */}
      <div className="relative flex min-h-dvh flex-col justify-between bg-lab-bg px-5 py-6 sm:px-8 sm:py-8 lg:px-10 xl:px-14">
        {/* Верх: логотип paramlab.ru и ссылка «← Вернуться в конфигуратор» */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-lab-text outline-none focus-visible:ring-2 focus-visible:ring-lab-cyan"
          >
            <svg
              viewBox="0 0 32 32"
              aria-hidden="true"
              className="size-8 shrink-0"
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
            >
              <path
                d="M16 3 27 9.5v13L16 29 5 22.5v-13L16 3Z"
                stroke="var(--lab-text)"
              />
              <path d="M5 9.5 16 16l11-6.5M16 16v13" stroke="var(--lab-cyan)" />
              <path
                d="M8.5 15.5v5.2l4.5 2.6v-5.2"
                stroke="var(--brand)"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-base leading-none font-bold tracking-tight">
              paramlab.ru
            </span>
            {withBadge && (
              <span className="hidden rounded border border-lab-border bg-lab-surface px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-lab-cyan uppercase sm:inline-block">
                CAD · 0.1 MM
              </span>
            )}
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="font-mono text-xs text-lab-muted transition-colors duration-240 outline-none hover:text-lab-text focus-visible:ring-2 focus-visible:ring-lab-cyan"
            >
              ← Вернуться в конфигуратор
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Центр: AuthCard (max-w-[400px], w-full) */}
        <main className="my-8 flex flex-1 items-center justify-center">
          <div className="flex w-full max-w-[400px] flex-col items-center">
            {children}
          </div>
        </main>

        {/* Низ: лаконичная строка о согласии с политикой конфиденциальности */}
        <footer className="text-center lg:text-left">
          <p className="text-xs leading-relaxed text-lab-muted">
            Продолжая вход, вы соглашаетесь с условиями{" "}
            <Link
              href="/#faq"
              className="text-lab-text/80 underline underline-offset-4 transition-colors hover:text-lab-text"
            >
              политики конфиденциальности и обработки персональных данных
            </Link>{" "}
            paramlab.ru.
          </p>
        </footer>
      </div>

      {/* Правая часть: ContextPanel (скрыта на мобильных < lg) */}
      <Suspense
        fallback={
          <div className="hidden min-h-dvh border-l border-lab-border bg-lab-bg lg:block" />
        }
      >
        <ContextPanel />
      </Suspense>
    </div>
  );
}
