import type { Metadata } from "next";
import { AuthShell, ForgotPasswordForm } from "~/components/auth";

export const metadata: Metadata = {
  title: "Восстановление доступа — ParamLab",
  description: "Сбросьте пароль от личного кабинета ParamLab",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordForm className="rounded-[16px] border-lab-border bg-lab-surface text-lab-text shadow-2xl" />
    </AuthShell>
  );
}
