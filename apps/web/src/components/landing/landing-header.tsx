"use client";

import { cn, ThemeToggle } from "@paramlab/ui";
import { Menu, User, X } from "lucide-react";
import { useState } from "react";
import { useCalculator } from "~/components/landing/calculator-context";
import { NAV_LINKS } from "~/components/landing/data";
import { APP_LINKS } from "~/components/landing/links";

export function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2.5 text-lab-text">
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="size-8 shrink-0"
        fill="none"
        strokeWidth={2}
        strokeLinejoin="round"
      >
        {/* Изометрический CAD-куб */}
        <path
          d="M16 3 27 9.5v13L16 29 5 22.5v-13L16 3Z"
          stroke="var(--lab-text)"
        />
        <path d="M5 9.5 16 16l11-6.5M16 16v13" stroke="var(--lab-cyan)" />
        {/* Губки штангенциркуля — размер грани */}
        <path
          d="M8.5 15.5v5.2l4.5 2.6v-5.2"
          stroke="var(--brand)"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-lg leading-none font-bold tracking-tight">
        PARAMLAB
      </span>
      <span className="hidden rounded-sm border border-lab-border bg-lab-surface px-1.5 py-0.5 font-mono text-[10px] leading-none tracking-wider whitespace-nowrap text-lab-cyan uppercase sm:inline-block">
        CAD · 0.1 MM
      </span>
    </a>
  );
}

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { setOrderModalOpen } = useCalculator();

  return (
    <header className="sticky top-0 z-40 border-b border-lab-border bg-lab-bg/90 text-lab-text backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav
          aria-label="Разделы страницы"
          className="hidden items-center gap-x-6 lg:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm whitespace-nowrap text-lab-muted transition-colors duration-240 hover:text-lab-text"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <a
            href={APP_LINKS.cabinet}
            className="hidden h-9 items-center gap-2 rounded-lg border border-lab-border bg-lab-surface px-3.5 text-sm font-medium text-lab-text transition-colors duration-240 hover:border-lab-muted/50 sm:inline-flex"
          >
            <User className="size-4 text-lab-cyan" />
            <span>Личный кабинет</span>
          </a>
          <button
            type="button"
            onClick={() => setOrderModalOpen(true)}
            className="cta-border-beam hidden h-9 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold whitespace-nowrap text-brand-foreground transition-transform duration-240 outline-none focus-visible:ring-2 focus-visible:ring-lab-cyan sm:inline-flex"
          >
            Заказать печать
          </button>
          <button
            type="button"
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-lab-border bg-lab-surface text-lab-text transition-colors hover:border-lab-muted lg:hidden"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="border-t border-lab-border bg-lab-bg lg:hidden"
        >
          <nav
            aria-label="Разделы страницы"
            className="mx-auto grid max-w-7xl gap-1 px-4 py-3 sm:grid-cols-2 sm:px-6"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-lab-muted transition-colors hover:bg-lab-surface hover:text-lab-text"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 grid gap-2 sm:hidden">
              <a
                href={APP_LINKS.cabinet}
                className={cn(
                  "flex h-10 items-center justify-center gap-2 rounded-lg border border-lab-border bg-lab-surface text-sm font-medium text-lab-text",
                )}
              >
                <User className="size-4 text-lab-cyan" />
                Личный кабинет
              </a>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setOrderModalOpen(true);
                }}
                className="cta-border-beam flex h-10 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-brand-foreground"
              >
                Заказать печать
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
