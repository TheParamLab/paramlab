import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard, AuthShell } from "~/components/auth";

export const metadata: Metadata = {
  title: "Подтверждение кода — ParamLab",
  description: "Введите 6-значный код подтверждения для входа в ParamLab",
};

export default function OTPPage() {
  return (
    <AuthShell width="xs">
      <Suspense
        fallback={
          <div className="h-[340px] w-full max-w-[400px] animate-pulse rounded-[16px] border border-[#262B36] bg-[#161920]" />
        }
      >
        <AuthCard initialStep="otp" />
      </Suspense>
    </AuthShell>
  );
}
