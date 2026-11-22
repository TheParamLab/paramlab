import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard, AuthShell } from "~/components/auth";

export const metadata: Metadata = {
  title: "Вход и регистрация — ParamLab",
  description:
    "Единый вход без паролей в сервис параметрической 3D-печати paramlab.ru по 6-значному Email OTP-коду или через Яндекс ID.",
};

export default function LoginPage() {
  return (
    <AuthShell withBadge>
      <Suspense
        fallback={
          <div className="h-[380px] w-full max-w-[400px] animate-pulse rounded-[16px] border border-[#262B36] bg-[#161920]" />
        }
      >
        <AuthCard initialStep="method" />
      </Suspense>
    </AuthShell>
  );
}
