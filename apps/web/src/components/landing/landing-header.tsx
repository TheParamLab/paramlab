"use client";

import { buttonVariants, cn, ThemeToggle } from "@acme/ui";
import { Menu, User, X } from "lucide-react";
import { useState } from "react";
import { CalculatorTrigger } from "./calculator-context";
import { NAV_LINKS } from "./data";
import { APP_LINKS } from "./links";

const accentButton =
  "bg-brand text-brand-foreground hover:bg-brand/85 inline-flex h-9 items-center justify-center rounded-md px-3.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-brand/50";

export function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2.5">
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="size-8 shrink-0"
        fill="none"
        strokeWidth={2}
        strokeLinejoin="round"
      >
        {/* Изометрический куб */}
        <path
          d="M16 3 27 9.5v13L16 29 5 22.5v-13L16 3Z"
          className="stroke-foreground"
        />
        <path d="M5 9.5 16 16l11-6.5M16 16v13" className="stroke-foreground" />
        {/* Губки штангенциркуля — размер грани */}
        <path
          d="M8.5 15.5v5.2l4.5 2.6v-5.2"
          className="stroke-brand"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-lg leading-none font-bold tracking-tight">
        PARAMLAB
      </span>
      <span className="text-muted-foreground hidden rounded-sm border px-1.5 py-0.5 font-mono text-[10px] leading-none tracking-wider whitespace-nowrap uppercase sm:inline-block">
        CAD · 3D · IoT
      </span>
    </a>
  );
}

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-background/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav
          aria-label="Разделы страницы"
          className="hidden items-center gap-x-4 xl:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-[13px] whitespace-nowrap transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={APP_LINKS.cabinet}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "hidden px-3.5 sm:inline-flex",
            )}
          >
            <User />
            {/* На 1280 px рядом с навигацией остается только иконка. */}
            <span className="xl:max-2xl:sr-only">Личный кабинет</span>
          </a>
          <CalculatorTrigger
            className={cn(accentButton, "hidden sm:inline-flex")}
          >
            Рассчитать заказ
          </CalculatorTrigger>
          <ThemeToggle />
          <button
            type="button"
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "xl:hidden",
            )}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="bg-background border-t xl:hidden">
          <nav
            aria-label="Разделы страницы"
            className="mx-auto grid max-w-7xl gap-1 px-4 py-3 sm:grid-cols-2 sm:px-6 lg:px-8"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="hover:bg-muted rounded-md px-3 py-2.5 text-sm transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 grid gap-2 sm:hidden">
              <a
                href={APP_LINKS.cabinet}
                className={cn(buttonVariants({ variant: "outline" }), "h-10")}
              >
                <User />
                Личный кабинет
              </a>
              <CalculatorTrigger
                className={cn(accentButton, "h-10")}
                onOpen={() => setMenuOpen(false)}
              >
                Рассчитать заказ
              </CalculatorTrigger>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
