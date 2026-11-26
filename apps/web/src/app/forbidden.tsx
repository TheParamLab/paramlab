import { Home, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  primaryErrorActionClass,
  secondaryErrorActionClass,
} from "~/components/error-pages/action-classes";
import { ErrorPageShell } from "~/components/error-pages/error-page-shell";

export const metadata: Metadata = {
  title: "403 — доступ ограничен | ParamLab",
  description:
    "Доступ к этому разделу ParamLab ограничен. Откройте личный кабинет или вернитесь на главную.",
};

export default function Forbidden() {
  return (
    <ErrorPageShell
      code="403"
      eyebrow="Ограничение допуска"
      title="В этот отсек лаборатории доступ закрыт"
      description="У текущей учётной записи нет прав на просмотр запрошенного раздела. Если доступ нужен для работы, обратитесь к администратору проекта."
      tone="orange"
      telemetry={[
        { label: "Access", value: "denied" },
        { label: "Session", value: "verified", accent: true },
        { label: "Policy", value: "role based" },
      ]}
      actions={
        <>
          <Link href="/cabinet" className={primaryErrorActionClass}>
            <Lock className="size-4" />
            Открыть кабинет
          </Link>
          <Link href="/" className={secondaryErrorActionClass}>
            <Home className="size-4 text-[#00D1FF]" />
            На главную
          </Link>
        </>
      }
      footnote="Права доступа проверяются на сервере для каждого запроса, поэтому обойти ограничение через прямую ссылку нельзя."
    />
  );
}
