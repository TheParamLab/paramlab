import { cn } from "@acme/ui";
import { MATERIALS, type MaterialId } from "@acme/validators";

/** Нативный список материалов с тарифом за грамм. */
export function MaterialSelect({
  value,
  onChange,
  className,
  ...props
}: {
  value: MaterialId;
  onChange: (value: MaterialId) => void;
  id?: string;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <select
      {...props}
      value={value}
      onChange={(event) => onChange(event.target.value as MaterialId)}
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
        className,
      )}
    >
      {MATERIALS.map((material) => (
        <option key={material.id} value={material.id}>
          {material.code} — {material.rate} ₽/г
        </option>
      ))}
    </select>
  );
}
