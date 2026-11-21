import { paths } from "@paramlab/config";
import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { getSession } from "~/auth/server";
import { DashboardShell } from "~/components/dashboard/dashboard-shell";

/**
 * Оболочка личного кабинета (Dark Engineering Theme) статична и пререндерится;
 * проверка сессии выполняется асинхронно внутри <Suspense>.
 */
export default function CabinetLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0E1014]" />}>
      <DashboardShell routePrefix="/cabinet">
        <Suspense fallback={null}>
          <EnforceCabinetSession />
        </Suspense>
        {children}
      </DashboardShell>
    </Suspense>
  );
}

async function EnforceCabinetSession() {
  const session = await getSession();
  if (!session?.user) redirect(paths.auth.login);
  return null;
}
