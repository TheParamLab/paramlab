"use client";

import { ErrorRecoveryPage } from "~/components/error-pages/error-recovery";

export default function RootError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return <ErrorRecoveryPage error={error} retry={retry} />;
}
