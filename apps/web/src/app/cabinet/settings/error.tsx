"use client";

import { ErrorRecoveryPanel } from "~/components/error-pages/error-recovery";
import { SiteHeader } from "~/components/layout";

export default function SettingsError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <>
      <SiteHeader title="Настройки" />
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 pb-16 lg:p-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
          <p className="text-muted-foreground">
            Управляйте настройками аккаунта и параметрами уведомлений по почте.
          </p>
        </div>

        <ErrorRecoveryPanel
          error={error}
          retry={retry}
          title="Не удалось загрузить настройки"
          description="Раздел настроек временно недоступен. Повторите загрузку — введённые данные аккаунта не потеряются."
          secondaryHref="/cabinet"
          secondaryLabel="Обзор кабинета"
        />
      </div>
    </>
  );
}
