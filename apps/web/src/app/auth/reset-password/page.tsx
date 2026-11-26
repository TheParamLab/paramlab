import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell, ResetPasswordForm } from "~/components/auth";

export const metadata: Metadata = {
  title: "Новый пароль — ParamLab",
  description: "Задайте новый пароль для своего аккаунта ParamLab",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="font-mono text-xs text-lab-muted">Загрузка…</div>
        }
      >
        <ResetPasswordForm className="rounded-[16px] border-lab-border bg-lab-surface text-lab-text shadow-2xl" />
      </Suspense>
    </AuthShell>
  );
}
