import { Compass, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  primaryErrorActionClass,
  secondaryErrorActionClass,
} from "~/components/error-pages/action-classes";
import { ErrorPageShell } from "~/components/error-pages/error-page-shell";

export const metadata: Metadata = {
  title: "404 — страница не найдена | ParamLab",
  description:
    "Запрошенная страница не найдена. Вернитесь в параметрический конфигуратор ParamLab или откройте личный кабинет.",
};

export default function NotFound() {
  return (
    <ErrorPageShell
      code="404"
      eyebrow="Потерянная координата"
      title="Такой страницы нет в сборке"
      description="Запрошенный маршрут не совпадает ни с одной деталью проекта. Проверьте адрес или вернитесь в конфигуратор — оттуда собираются все рабочие сценарии лаборатории."
      tone="cyan"
      telemetry={[
        { label: "Route", value: "not indexed" },
        { label: "CAD core", value: "online", accent: true },
        { label: "Tolerance", value: "±0.1 mm" },
      ]}
      actions={
        <>
          <Link href="/" className={primaryErrorActionClass}>
            <Compass className="size-4" />
            Открыть конфигуратор
          </Link>
          <Link href="/cabinet" className={secondaryErrorActionClass}>
            <User className="size-4 text-lab-cyan" />
            Личный кабинет
          </Link>
        </>
      }
      footnote="Подсказка: рабочие разделы живут на главной странице, в /cabinet и /auth. Если ссылка пришла из письма, она могла устареть."
    />
  );
}
