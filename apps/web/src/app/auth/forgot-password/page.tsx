import type { Metadata } from "next";
import { AuthShell, ForgotPasswordForm } from "~/components/auth";

export const metadata: Metadata = {
  title: "Восстановление доступа — ParamLab",
  description: "Сбросьте пароль от личного кабинета ParamLab",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordForm className="rounded-[16px] border-[#262B36] bg-[#161920] text-[#F2F4F7] shadow-2xl" />
    </AuthShell>
  );
}
