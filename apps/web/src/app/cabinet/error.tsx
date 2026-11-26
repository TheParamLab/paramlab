"use client";

import { ErrorRecoveryPanel } from "~/components/error-pages/error-recovery";

export default function DashboardError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <ErrorRecoveryPanel
      error={error}
      retry={retry}
      title="Пульт временно недоступен"
      description="Не удалось загрузить рабочую область кабинета. Повторите запрос — данные аккаунта и заказы не затронуты."
      secondaryHref="/cabinet"
      secondaryLabel="Обзор кабинета"
      className="m-4 lg:m-6"
    />
  );
}
