import { Home, LogIn } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  primaryErrorActionClass,
  secondaryErrorActionClass,
} from "~/components/error-pages/action-classes";
import { ErrorPageShell } from "~/components/error-pages/error-page-shell";

export const metadata: Metadata = {
  title: "401 — требуется вход | ParamLab",
  description:
    "Для доступа к этому разделу ParamLab нужно войти в личный кабинет.",
};

export default function Unauthorized() {
  return (
    <ErrorPageShell
      code="401"
      eyebrow="Нужна авторизация"
      title="Сначала откройте допуск в лабораторию"
      description="Этот раздел доступен только после входа. Авторизуйтесь по почте — после проверки сессии можно продолжить работу с заказами и деталями."
      tone="cyan"
      telemetry={[
        { label: "Session", value: "missing" },
        { label: "Auth", value: "passwordless", accent: true },
        { label: "Redirect", value: "safe" },
      ]}
      actions={
        <>
          <Link href="/auth/login" className={primaryErrorActionClass}>
            <LogIn className="size-4" />
            Войти в кабинет
          </Link>
          <Link href="/" className={secondaryErrorActionClass}>
            <Home className="size-4 text-lab-cyan" />
            На главную
          </Link>
        </>
      }
      footnote="Вход занимает меньше минуты: без пароля, через одноразовый код или ссылку из письма."
    />
  );
}
