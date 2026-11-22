import { paths } from "@paramlab/config";
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  Skeleton,
} from "@paramlab/ui";
import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { getSession } from "~/auth/server";
import { AppSidebar } from "~/components/sidebar";

/**
 * Оболочка личного кабинета: каркас статичен и пререндерится, а зависимый
 * от сессии сайдбар приходит отдельным потоком. Чтение сессии на верхнем
 * уровне layout задержало бы все страницы кабинета до конца запроса.
 * @see https://nextjs.org/docs/app/guides/authentication-with-cache-components
 */
export default function CabinetLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Suspense fallback={<SidebarSkeleton />}>
        <SessionSidebar />
      </Suspense>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}

async function SessionSidebar() {
  const session = await getSession();
  // proxy.ts уже редиректит без cookie сессии — здесь проверка обязательна.
  if (!session?.user) redirect(paths.auth.login);

  return (
    <AppSidebar
      user={{
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.image || "",
      }}
    />
  );
}

// Фиксированные ширины: shadcn's SidebarMenuSkeleton использует Math.random(),
// а статический каркас не может содержать случайные значения.
function SidebarSkeleton() {
  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="gap-2 p-2">
        {["70%", "55%", "80%", "60%"].map((width) => (
          <div key={width} className="flex h-8 items-center gap-2 px-2">
            <Skeleton className="size-4 rounded-md" />
            <Skeleton className="h-4" style={{ width }} />
          </div>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
