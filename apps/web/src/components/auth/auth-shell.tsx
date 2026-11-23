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
    <div className="min-h-dvh w-full overflow-x-hidden bg-[#0E1014] text-[#F2F4F7] lg:grid lg:grid-cols-[45%_55%]">
      {/* Левая часть: Рабочая зона (#0E1014) */}
      <div className="relative flex min-h-dvh flex-col justify-between bg-[#0E1014] px-5 py-6 sm:px-8 sm:py-8 lg:px-10 xl:px-14">
        {/* Верх: логотип paramlab.ru и ссылка «← Вернуться в конфигуратор» */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[#F2F4F7] outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]"
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
                stroke="#F2F4F7"
              />
              <path d="M5 9.5 16 16l11-6.5M16 16v13" stroke="#00D1FF" />
              <path
                d="M8.5 15.5v5.2l4.5 2.6v-5.2"
                stroke="#FF5C1A"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-base leading-none font-bold tracking-tight">
              paramlab.ru
            </span>
            {withBadge && (
              <span className="hidden rounded border border-[#262B36] bg-[#161920] px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-[#00D1FF] uppercase sm:inline-block">
                CAD · 0.1 MM
              </span>
            )}
          </Link>

          <Link
            href="/"
            className="font-mono text-xs text-[#8A93A2] transition-colors duration-240 outline-none hover:text-[#F2F4F7] focus-visible:ring-2 focus-visible:ring-[#00D1FF]"
          >
            ← Вернуться в конфигуратор
          </Link>
        </header>

        {/* Центр: AuthCard (max-w-[400px], w-full) */}
        <main className="my-8 flex flex-1 items-center justify-center">
          <div className="flex w-full max-w-[400px] flex-col items-center">
            {children}
          </div>
        </main>

        {/* Низ: лаконичная строка о согласии с политикой конфиденциальности */}
        <footer className="text-center lg:text-left">
          <p className="text-xs leading-relaxed text-[#8A93A2]">
            Продолжая вход, вы соглашаетесь с условиями{" "}
            <Link
              href="/#faq"
              className="text-[#F2F4F7]/80 underline underline-offset-4 transition-colors hover:text-[#F2F4F7]"
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
          <div className="hidden min-h-dvh border-l border-[#262B36] bg-[#0E1014] lg:block" />
        }
      >
        <ContextPanel />
      </Suspense>
    </div>
  );
}
