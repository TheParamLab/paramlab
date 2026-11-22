import type { Metadata } from "next";
import { AuthShell, UnifiedAuthForm } from "~/components/auth";

export const metadata: Metadata = {
  title: "Вход в пульт управления — ParamLab",
  description:
    "Войдите в личный кабинет параметрической 3D-печати ParamLab для контроля заказов и управления CAD-пресетами.",
};

export default function LoginPage() {
  return (
    <AuthShell withBadge>
      <UnifiedAuthForm
        mode="signin"
        className="rounded-[16px] border-[#262B36] bg-[#161920] text-[#F2F4F7] shadow-2xl"
      />
    </AuthShell>
  );
}
