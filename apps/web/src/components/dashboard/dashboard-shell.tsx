"use client";

import { paths } from "@paramlab/config";
import { cn, toast } from "@paramlab/ui";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Boxes,
  Cpu,
  Flame,
  LogOut,
  Package,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { authClient } from "~/auth/client";
import {
  MOCK_ENGINEER_PROFILE,
  MOCK_SUMMARY_METRICS,
  resetDashboardStore,
  useDashboardOrders,
  useDashboardPresets,
} from "~/lib/mock-dashboard";

interface NavItem {
  id: "orders" | "parts" | "profile";
  href: Route;
  matchPaths: string[];
  label: string;
  shortLabel: string;
  code: string;
  badge?: string;
  badgeAccent?: "orange" | "cyan";
  icon: typeof Package;
}

function isRouteActive(pathname: string, item: NavItem): boolean {
  return item.matchPaths.some(
    (prefix) =>
      pathname === prefix ||
      (prefix !== "/cabinet" && pathname.startsWith(`${prefix}/`)),
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orders = useDashboardOrders();
  const presets = useDashboardPresets();

  const activeOrdersCount = orders.filter(
    (o) => o.category === "active",
  ).length;
  const printingOrder = orders.find((o) => o.currentStage === "printing");

  const navItems: readonly NavItem[] = [
    {
      id: "orders",
      href: "/orders",
      matchPaths: ["/orders"],
      label: "Заказы и печать",
      shortLabel: "Заказы",
      code: "01 // ORDERS",
      badge: String(activeOrdersCount),
      badgeAccent: "orange",
      icon: Package,
    },
    {
      id: "parts",
      href: "/parts",
      matchPaths: ["/parts"],
      label: "Библиотека деталей",
      shortLabel: "Детали",
      code: "02 // PRESETS",
      badge: String(presets.length),
      badgeAccent: "cyan",
      icon: Boxes,
    },
    {
      id: "profile",
      href: "/profile",
      matchPaths: ["/profile"],
      label: "Профиль и ПВЗ",
      shortLabel: "Профиль",
      code: "03 // PROFILE",
      icon: UserCog,
    },
  ];

  const activeNav = navItems.find((item) => isRouteActive(pathname, item)) ?? {
    id: "orders" as const,
    href: "/orders" as Route,
    matchPaths: ["/orders"],
    label: "Заказы и печать",
    shortLabel: "Заказы",
    code: "01 // ORDERS",
    icon: Package,
  };

  async function handleLogout() {
    try {
      const { error } = await authClient.signOut();
      if (error) throw error;
    } catch {
      toast.error("Не удалось выйти из аккаунта. Попробуйте ещё раз.");
      return;
    }
    // Демо-данные не должны пережить смену пользователя в этом же браузере.
    resetDashboardStore();
    queryClient.clear();
    router.push(paths.auth.login);
  }

  return (
    <div className="min-h-screen bg-[#0E1014] text-[#F2F4F7] selection:bg-[#FF5C1A] selection:text-[#0E1014]">
      <div className="flex min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside
          aria-label="Навигация личного кабинета"
          className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col justify-between border-r border-[#262B36] bg-[#161920] p-4 lg:flex"
        >
          <div className="flex flex-col gap-6">
            {/* Логотип лаборатории */}
            <div className="flex items-center justify-between border-b border-[#262B36] pb-4">
              <Link
                href={"/" as Route}
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
                <div>
                  <span className="block text-base leading-none font-bold tracking-tight">
                    PARAMLAB
                  </span>
                  <span className="mt-1 block font-mono text-[10px] tracking-widest text-[#00D1FF] uppercase">
                    CONTROL DECK · 0.1 MM
                  </span>
                </div>
              </Link>
            </div>

            {/* Навигационные разделы (строго 3 инженерных раздела без лишнего шума) */}
            <nav
              aria-label="Разделы кабинета"
              className="flex flex-col gap-1.5"
            >
              <span className="px-2.5 pb-1 font-mono text-[10px] tracking-widest text-[#8A93A2] uppercase">
                Пульт производства
              </span>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isRouteActive(pathname, item);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center justify-between rounded-[12px] border px-3 py-2.5 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]",
                      active
                        ? "border-[#00D1FF]/50 bg-[#0E1014] text-[#F2F4F7] shadow-[0_0_20px_rgba(0,209,255,0.08)]"
                        : "border-transparent text-[#8A93A2] hover:border-[#262B36] hover:bg-[#0E1014]/60 hover:text-[#F2F4F7]",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg border transition-colors",
                          active
                            ? "border-[#00D1FF]/40 bg-[#00D1FF]/15 text-[#00D1FF]"
                            : "border-[#262B36] bg-[#0E1014] text-[#8A93A2] group-hover:text-[#F2F4F7]",
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <span className="block text-sm font-semibold">
                          {item.label}
                        </span>
                        <span className="block font-mono text-[10px] text-[#8A93A2]">
                          {item.code}
                        </span>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          "rounded-md border px-1.5 py-0.5 font-mono text-xs font-bold tabular-nums",
                          item.badgeAccent === "orange"
                            ? "border-[#FF5C1A]/40 bg-[#FF5C1A]/15 text-[#FF5C1A]"
                            : "border-[#00D1FF]/40 bg-[#00D1FF]/15 text-[#00D1FF]",
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Телеметрия активной ячейки производства */}
            <div className="rounded-[16px] border border-[#262B36] bg-[#0E1014] p-3.5 font-mono text-xs tabular-nums">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#FF5C1A]">
                  <Flame className="size-3.5" />
                  {printingOrder ? "LIVE" : "IDLE"}
                  {printingOrder?.layerTelemetry?.machineId
                    ? ` · ${printingOrder.layerTelemetry.machineId}`
                    : null}
                </span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                    printingOrder
                      ? "bg-[#10B981]/15 text-[#10B981]"
                      : "bg-[#262B36] text-[#8A93A2]",
                  )}
                >
                  {printingOrder ? "ONLINE" : "OFFLINE"}
                </span>
              </div>

              {printingOrder ? (
                <>
                  <p className="mt-2 truncate font-sans text-xs font-medium text-[#F2F4F7]">
                    {printingOrder.orderNumber} ·{" "}
                    {printingOrder.items[0]?.title ?? "Партия в печати"}
                  </p>

                  <div className="mt-2 flex items-baseline justify-between text-[11px]">
                    <span className="text-[#8A93A2]">
                      Слой{" "}
                      {printingOrder.layerTelemetry
                        ? `${printingOrder.layerTelemetry.currentLayer} / ${printingOrder.layerTelemetry.totalLayers}`
                        : "—"}
                    </span>
                    <span className="font-bold text-[#FF5C1A]">
                      {printingOrder.stageProgressPercent}%
                    </span>
                  </div>

                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#262B36]">
                    <div
                      className="h-full rounded-full bg-[#FF5C1A]"
                      style={{
                        width: `${printingOrder.stageProgressPercent}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-[#262B36] pt-2 text-[10px] text-[#8A93A2]">
                    <span>
                      Камера:{" "}
                      {printingOrder.layerTelemetry
                        ? `${printingOrder.layerTelemetry.chamberTempC} °C`
                        : "нет данных"}
                    </span>
                    <span>
                      Допуск: {MOCK_SUMMARY_METRICS.averageAccuracyMm}
                    </span>
                  </div>
                </>
              ) : (
                <p className="mt-2 font-sans text-xs text-[#8A93A2]">
                  Нет активной печати — все партии завершены или ждут очереди.
                </p>
              )}
            </div>
          </div>

          {/* Нижний блок сайдбара: CTA конфигуратора + карточка инженера */}
          <div className="flex flex-col gap-3">
            <Link
              href={"/#calculator" as Route}
              className="cta-border-beam flex h-10 w-full items-center justify-between rounded-[12px] bg-[#FF5C1A] px-3.5 text-xs font-semibold text-[#0E1014] transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]"
            >
              <span>Новый CAD-расчет</span>
              <ArrowUpRight className="size-4" />
            </Link>

            <div className="flex items-center justify-between gap-2 rounded-[12px] border border-[#262B36] bg-[#0E1014] p-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#00D1FF]/40 bg-[#00D1FF]/10 font-mono text-xs font-bold text-[#00D1FF]">
                  АС
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#F2F4F7]">
                    {MOCK_ENGINEER_PROFILE.fullName}
                  </p>
                  <p className="truncate font-mono text-[10px] text-[#8A93A2]">
                    {MOCK_ENGINEER_PROFILE.accountCode}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Выйти из аккаунта"
                aria-label="Выйти из аккаунта"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#262B36] bg-[#161920] text-[#8A93A2] transition-colors hover:border-[#FF5C1A]/50 hover:text-[#FF5C1A]"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* ОСНОВНАЯ РАБОЧАЯ ОБЛАСТЬ */}
        <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
          {/* TOPBAR */}
          <header className="sticky top-0 z-30 border-b border-[#262B36] bg-[#0E1014]/90 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                {/* Мобильный логотип */}
                <Link
                  href={"/" as Route}
                  aria-label="На главную ParamLab"
                  className="flex items-center gap-2 lg:hidden"
                >
                  <svg
                    viewBox="0 0 32 32"
                    aria-hidden="true"
                    className="size-7 shrink-0"
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
                </Link>

                <div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#8A93A2]">
                    <span className="hidden sm:inline">{"PARAMLAB //"}</span>
                    <span className="text-[#00D1FF]">{activeNav.code}</span>
                    <span className="rounded border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-1 py-0.5 text-[9px] font-semibold tracking-wider text-[#F59E0B] uppercase">
                      Демо
                    </span>
                  </div>
                  <p className="text-sm font-bold tracking-tight text-[#F2F4F7] sm:text-base">
                    {activeNav.label}
                  </p>
                </div>
              </div>

              {/* Инженерные индикаторы состояния фермы */}
              <div className="flex items-center gap-2.5 font-mono text-xs tabular-nums">
                <div className="hidden items-center gap-2 rounded-lg border border-[#262B36] bg-[#161920] px-3 py-1.5 md:flex">
                  <Cpu className="size-3.5 text-[#00D1FF]" />
                  <span className="text-[#8A93A2]">Ферма CoreXY:</span>
                  <span className="font-semibold text-[#10B981]">
                    {activeOrdersCount} в работе
                  </span>
                </div>

                <div className="hidden items-center gap-1.5 rounded-lg border border-[#262B36] bg-[#161920] px-3 py-1.5 sm:flex">
                  <ShieldCheck className="size-3.5 text-[#10B981]" />
                  <span className="text-[#8A93A2]">ОТК:</span>
                  <span className="font-semibold text-[#F2F4F7]">±0.1 мм</span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Выйти из аккаунта"
                  title="Выйти из аккаунта"
                  className="flex size-9 items-center justify-center rounded-lg border border-[#262B36] bg-[#161920] text-[#8A93A2] transition-colors hover:border-[#FF5C1A]/50 hover:text-[#FF5C1A] focus-visible:ring-2 focus-visible:ring-[#00D1FF] focus-visible:outline-none lg:hidden"
                >
                  <LogOut className="size-4" />
                </button>

                <Link
                  href={"/#calculator" as Route}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#FF5C1A]/50 bg-[#FF5C1A]/15 px-3 font-mono text-xs font-semibold text-[#FF5C1A] transition-colors hover:border-[#FF5C1A] hover:bg-[#FF5C1A] hover:text-[#0E1014]"
                >
                  <span>3D-Конфигуратор</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </header>

          {/* КОНТЕНТ СТРАНИЦЫ */}
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>

      {/* MOBILE TABBAR */}
      <nav
        aria-label="Мобильная навигация кабинета"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#262B36] bg-[#161920]/95 backdrop-blur-md lg:hidden"
      >
        <div className="grid grid-cols-3 gap-1 px-2 py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(pathname, item);
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-[12px] py-1.5 font-mono text-[11px] transition-colors",
                  active
                    ? "bg-[#0E1014] font-semibold text-[#00D1FF]"
                    : "text-[#8A93A2] hover:text-[#F2F4F7]",
                )}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={cn(
                      "size-4",
                      active ? "text-[#00D1FF]" : "text-[#8A93A2]",
                    )}
                  />
                  {item.badge && (
                    <span
                      className={cn(
                        "ml-1 rounded px-1 text-[10px] font-bold tabular-nums",
                        item.badgeAccent === "orange"
                          ? "bg-[#FF5C1A]/20 text-[#FF5C1A]"
                          : "bg-[#00D1FF]/20 text-[#00D1FF]",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span>{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
