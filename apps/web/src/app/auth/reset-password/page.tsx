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
          <div className="font-mono text-xs text-[#8A93A2]">Загрузка…</div>
        }
      >
        <ResetPasswordForm className="rounded-[16px] border-[#262B36] bg-[#161920] text-[#F2F4F7] shadow-2xl" />
      </Suspense>
    </AuthShell>
  );
}
