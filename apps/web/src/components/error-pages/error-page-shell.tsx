import { cn } from "@paramlab/ui";
import Link from "next/link";
import type { ReactNode } from "react";

type ErrorPageTone = "cyan" | "orange";

type TelemetryItem = {
  label: string;
  value: string;
  accent?: boolean;
};

const toneClasses: Record<
  ErrorPageTone,
  { chip: string; glow: string; signal: string }
> = {
  cyan: {
    chip: "border-lab-cyan/35 bg-lab-cyan/10 text-lab-cyan",
    glow: "bg-lab-cyan/12",
    signal: "bg-lab-cyan",
  },
  orange: {
    chip: "border-brand/35 bg-brand/10 text-brand",
    glow: "bg-brand/12",
    signal: "bg-brand",
  },
};

export function ErrorPageShell({
  code,
  eyebrow,
  title,
  description,
  actions,
  telemetry,
  footnote,
  tone = "orange",
}: {
  code: string;
  eyebrow: string;
  title: string;
  description: string;
  actions: ReactNode;
  telemetry: TelemetryItem[];
  footnote?: ReactNode;
  tone?: ErrorPageTone;
}) {
  const colors = toneClasses[tone];

  return (
    <div className="relative min-h-dvh overflow-hidden bg-lab-bg text-lab-text">
      <div
        aria-hidden="true"
        className="bg-blueprint-fine pointer-events-none absolute inset-0 opacity-45"
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -top-36 right-[-10%] size-[520px] rounded-full blur-3xl",
          colors.glow,
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-20%] left-[-12%] size-[560px] rounded-full bg-lab-cyan/8 blur-3xl"
      />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 sm:px-8 lg:px-10">
        <header className="flex h-20 shrink-0 items-center justify-between gap-4">
          <ErrorLogo />
          <div className="hidden items-center gap-3 font-mono text-[11px] tracking-[0.18em] text-lab-muted uppercase sm:flex">
            <span>Lab response</span>
            <span className="text-lab-border">/</span>
            <span className="text-lab-text">HTTP {code}</span>
          </div>
        </header>

        <main className="grid flex-1 items-center gap-10 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.86fr)] lg:gap-14">
          <section className="max-w-2xl">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] font-medium tracking-[0.16em] uppercase",
                colors.chip,
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full shadow-[0_0_10px_currentColor]",
                  colors.signal,
                )}
              />
              {eyebrow}
            </div>

            <h1 className="mt-6 text-4xl leading-[1.03] font-bold tracking-[-0.04em] text-balance sm:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-lab-muted sm:text-lg">
              {description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              {actions}
            </div>

            {footnote && (
              <div className="mt-6 max-w-xl font-mono text-xs leading-relaxed text-lab-muted">
                {footnote}
              </div>
            )}
          </section>

          <aside
            aria-label="Техническая диагностика страницы"
            className="relative overflow-hidden rounded-[28px] border border-lab-border bg-lab-surface/92 shadow-[0_32px_120px_rgba(0,0,0,0.42)] backdrop-blur"
          >
            <div className="flex items-center justify-between gap-3 border-b border-lab-border px-5 py-4">
              <div className="font-mono text-[11px] tracking-[0.18em] text-lab-muted uppercase">
                Diagnostic console
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-lab-cyan">
                <span className="size-1.5 animate-pulse rounded-full bg-lab-cyan shadow-[0_0_10px_var(--lab-cyan)]" />
                LIVE
              </div>
            </div>

            <div className="relative flex h-72 items-center justify-center overflow-hidden border-b border-lab-border bg-lab-bg/72 sm:h-80">
              <div
                aria-hidden="true"
                className="bg-blueprint absolute inset-0 opacity-[0.08]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-10 top-1/2 h-px bg-lab-cyan/25"
              />
              <div
                aria-hidden="true"
                className="absolute inset-y-8 left-1/2 w-px bg-lab-cyan/20"
              />
              <div
                aria-hidden="true"
                className="absolute top-5 left-5 size-5 border-t border-l border-lab-cyan/60"
              />
              <div
                aria-hidden="true"
                className="absolute top-5 right-5 size-5 border-t border-r border-lab-cyan/60"
              />
              <div
                aria-hidden="true"
                className="absolute bottom-5 left-5 size-5 border-b border-l border-lab-cyan/60"
              />
              <div
                aria-hidden="true"
                className="absolute right-5 bottom-5 size-5 border-r border-b border-lab-cyan/60"
              />

              <div className="relative flex flex-col items-center">
                <div className="bg-[linear-gradient(180deg,var(--lab-cyan),var(--brand))] bg-clip-text font-mono text-[7.5rem] leading-none font-bold tracking-[-0.09em] text-transparent select-none sm:text-[9rem]">
                  {code}
                </div>
                <svg
                  viewBox="0 0 360 118"
                  aria-hidden="true"
                  className="mt-2 h-24 w-72 max-w-full overflow-visible"
                  fill="none"
                >
                  <path
                    d="M180 8 268 56v50l-88 48-88-48V56l88-48Z"
                    stroke="var(--lab-text)"
                    strokeOpacity="0.34"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M92 56l88 48 88-48M180 104V8"
                    stroke="var(--lab-cyan)"
                    strokeOpacity="0.5"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M42 92h82m0 0-8-6m8 6-8 6M318 92h-82m0 0 8-6m-8 6 8 6"
                    stroke="var(--brand)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                  <path
                    d="M147 92h66"
                    stroke="var(--brand)"
                    strokeDasharray="5 7"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                  <circle
                    cx="180"
                    cy="92"
                    r="4"
                    fill="var(--lab-bg)"
                    stroke="var(--brand)"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              <div className="absolute bottom-4 left-5 font-mono text-[10px] tracking-[0.14em] text-lab-muted uppercase">
                mesh integrity check
              </div>
              <div className="absolute right-5 bottom-4 font-mono text-[10px] text-lab-cyan tabular-nums">
                ±0.1 mm
              </div>
            </div>

            <dl className="grid gap-px bg-lab-border/80 sm:grid-cols-3">
              {telemetry.map((item) => (
                <div key={item.label} className="bg-lab-surface px-4 py-3.5">
                  <dt className="font-mono text-[10px] tracking-[0.14em] text-lab-muted uppercase">
                    {item.label}
                  </dt>
                  <dd
                    className={cn(
                      "mt-1 truncate font-mono text-xs font-medium",
                      item.accent ? "text-lab-cyan" : "text-lab-text",
                    )}
                  >
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>
        </main>
      </div>
    </div>
  );
}

function ErrorLogo() {
  return (
    <Link
      href="/"
      aria-label="ParamLab — на главную"
      className="flex items-center gap-2.5 rounded-md text-lab-text outline-none focus-visible:ring-2 focus-visible:ring-lab-cyan"
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
        PARAMLAB
      </span>
      <span className="hidden rounded border border-lab-border bg-lab-surface px-1.5 py-0.5 font-mono text-[10px] leading-none tracking-wider text-lab-cyan uppercase sm:inline-block">
        CAD · 0.1 MM
      </span>
    </Link>
  );
}
