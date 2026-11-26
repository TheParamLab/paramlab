"use client";

import { ErrorRecoveryPage } from "~/components/error-pages/error-recovery";

import "~/app/styles.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <html lang="ru" className="dark">
      <body className="min-h-screen bg-lab-bg font-sans text-lab-text antialiased">
        <title>500 — ошибка сервиса | ParamLab</title>
        <ErrorRecoveryPage error={error} retry={retry} />
      </body>
    </html>
  );
}
