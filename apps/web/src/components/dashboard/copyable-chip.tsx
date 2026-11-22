"use client";

import {
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
} from "@paramlab/ui";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

function fallbackCopyTextToClipboard(text: string): boolean {
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  let success = false;
  try {
    success = document.execCommand("copy");
  } catch {
    success = false;
  } finally {
    document.body.removeChild(textarea);
  }
  return success;
}

export interface CopyableChipProps {
  /** Значение, которое копируется в буфер обмена */
  value: string;
  /** Опциональная отображаемая подпись (по умолчанию равна value) */
  label?: string;
  /** Префикс перед значением (например, "Ozon · ") */
  prefix?: string;
  /** Текст подсказки при наведении */
  tooltipText?: string;
  /** Размер чипа */
  size?: "sm" | "md";
  className?: string;
}

export function CopyableChip({
  value,
  label,
  prefix,
  tooltipText = "Скопировать в буфер",
  size = "sm",
  className,
}: CopyableChipProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => {
      setCopied(false);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopy(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      if (fallbackCopyTextToClipboard(value)) {
        setCopied(true);
      } else {
        setCopied(false);
        toast.error("Не удалось скопировать значение в буфер обмена");
      }
    }
  }

  return (
    <TooltipProvider delay={150}>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={handleCopy}
              aria-label={`${tooltipText}: ${value}`}
              className={cn(
                "group/chip inline-flex items-center gap-1.5 rounded-lg border font-mono tabular-nums transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]",
                size === "sm"
                  ? "px-2 py-0.5 text-xs"
                  : "px-2.5 py-1 text-xs font-medium",
                copied
                  ? "border-[#10B981]/60 bg-[#10B981]/15 text-[#10B981]"
                  : "border-[#262B36] bg-[#0E1014] text-[#F2F4F7] hover:border-[#00D1FF]/50 hover:text-[#00D1FF]",
                className,
              )}
            >
              {prefix && (
                <span className="text-[#8A93A2] transition-colors group-hover/chip:text-[#8A93A2]">
                  {prefix}
                </span>
              )}
              <span className="truncate">{label ?? value}</span>
              {copied ? (
                <Check
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-[#10B981]"
                />
              ) : (
                <Copy
                  aria-hidden="true"
                  className="size-3 shrink-0 text-[#8A93A2] transition-colors group-hover/chip:text-[#00D1FF]"
                />
              )}
              <span className="sr-only" aria-live="polite">
                {copied ? "Скопировано" : ""}
              </span>
            </button>
          }
        />
        <TooltipContent
          side="top"
          className="border border-[#262B36] bg-[#161920] font-mono text-[11px] text-[#F2F4F7]"
        >
          {copied ? "Скопировано в буфер" : tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
