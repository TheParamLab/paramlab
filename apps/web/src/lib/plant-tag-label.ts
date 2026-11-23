export function normalizePlantTagLabel(label?: string | null): string {
  return (label?.trim() || "ТОМАТ").toUpperCase().slice(0, 12).trimEnd();
}
