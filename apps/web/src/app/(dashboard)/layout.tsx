import type { Metadata } from "next";
import { type ReactNode, Suspense } from "react";
import { DashboardShell } from "~/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0E1014]" />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
