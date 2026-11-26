import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard, AuthShell } from "~/components/auth";

export const metadata: Metadata = {
  title: "Вход и регистрация инженера — ParamLab",
  description:
    "Создайте аккаунт или войдите без пароля в сервис параметрической 3D-печати paramlab.ru с точностью ±0.1 мм.",
};

export default function SignUpPage() {
  return (
    <AuthShell withBadge>
      <Suspense
        fallback={
          <div className="h-[380px] w-full max-w-[400px] animate-pulse rounded-[16px] border border-lab-border bg-lab-surface" />
        }
      >
        <AuthCard initialStep="method" />
      </Suspense>
    </AuthShell>
  );
}
