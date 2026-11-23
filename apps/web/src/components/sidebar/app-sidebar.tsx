"use client";

import { APP_CONFIG, paths } from "@paramlab/config";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@paramlab/ui";
import {
  ArrowUpRight,
  Boxes,
  KeyRound,
  LayoutDashboard,
  Package,
  UserCog,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { NavUser } from "~/components/sidebar";

const productionNav = [
  {
    title: "Обзор",
    url: paths.dashboard.root,
    icon: LayoutDashboard,
    exact: true,
  },
  { title: "Заказы и печать", url: paths.orders.root, icon: Package },
  { title: "Библиотека деталей", url: paths.parts.root, icon: Boxes },
] as const;

const accountNav = [
  { title: "Профиль и ПВЗ", url: paths.settings.root, icon: UserCog },
  { title: "Безопасность", url: paths.settings.security, icon: KeyRound },
] as const;

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; avatar: string };
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href={paths.dashboard.root} />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Boxes className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {APP_CONFIG.name}
                </span>
                <span className="truncate font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  Control deck
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Пульт производства</SidebarGroupLabel>
          <SidebarMenu>
            {productionNav.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={
                    "exact" in item
                      ? pathname === item.url
                      : pathname.startsWith(item.url)
                  }
                  render={<Link href={item.url} />}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Аккаунт</SidebarGroupLabel>
          <SidebarMenu>
            {accountNav.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={pathname === item.url}
                  render={<Link href={item.url} />}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="На сайт"
                render={<Link href={"/" as Route} />}
              >
                <ArrowUpRight />
                <span>На сайт</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
