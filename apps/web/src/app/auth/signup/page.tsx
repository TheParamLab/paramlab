import type { Metadata } from "next";
import { AuthShell, UnifiedAuthForm } from "~/components/auth";

export const metadata: Metadata = {
  title: "Регистрация инженера — ParamLab",
  description:
    "Создайте аккаунт в сервисе параметрической 3D-печати ParamLab с точностью ±0.1 мм.",
};

export default function SignUpPage() {
  return (
    <AuthShell withBadge>
      <UnifiedAuthForm
        mode="signup"
        className="rounded-[16px] border-[#262B36] bg-[#161920] text-[#F2F4F7] shadow-2xl"
      />
    </AuthShell>
  );
}
