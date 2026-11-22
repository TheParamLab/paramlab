import type { Metadata } from "next";
import { AuthShell, OTPForm } from "~/components/auth";

export const metadata: Metadata = {
  title: "Подтверждение кода — ParamLab",
  description: "Введите 6-значный код подтверждения для входа в ParamLab",
};

export default function OTPPage() {
  return (
    <AuthShell width="xs">
      <OTPForm className="rounded-[16px] border-[#262B36] bg-[#161920] text-[#F2F4F7] shadow-2xl" />
    </AuthShell>
  );
}
