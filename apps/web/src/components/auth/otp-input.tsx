"use client";

import { cn } from "@paramlab/ui";
import { useEffect, useRef, useState } from "react";

const OTP_LENGTH = 6;
const OTP_SLOT_INDICES = [0, 1, 2, 3, 4, 5] as const;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
  id?: string;
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  autoFocus = true,
  id = "otp-code",
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(
    autoFocus ? 0 : null,
  );
  const lastSubmittedRef = useRef<string | null>(null);

  const digits = OTP_SLOT_INDICES.map((index) => {
    const digit = value[index];
    return digit && /[0-9]/.test(digit) ? digit : "";
  });

  useEffect(() => {
    if (autoFocus && !disabled) inputRefs.current[0]?.focus();
  }, [autoFocus, disabled]);

  useEffect(() => {
    if (!/^[0-9]{6}$/.test(value)) lastSubmittedRef.current = null;
  }, [value]);

  function focusSlot(index: number) {
    const clamped = Math.max(0, Math.min(OTP_LENGTH - 1, index));
    inputRefs.current[clamped]?.focus();
    inputRefs.current[clamped]?.select();
  }

  function applyNextCode(nextDigits: string[], focusTarget?: number) {
    const nextCode = nextDigits
      .map((digit) => digit || " ")
      .join("")
      .trimEnd();
    onChange(nextCode);

    if (typeof focusTarget === "number") {
      window.requestAnimationFrame(() => {
        focusSlot(focusTarget);
      });
    }

    if (/^[0-9]{6}$/.test(nextCode) && lastSubmittedRef.current !== nextCode) {
      lastSubmittedRef.current = nextCode;
      onComplete?.(nextCode);
    }
  }

  function handleSlotChange(index: number, rawInput: string) {
    if (disabled) return;
    const onlyDigits = rawInput.replace(/\D/g, "");

    if (!onlyDigits) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      applyNextCode(nextDigits, index);
      return;
    }

    // Если вставлено или автозаполнено несколько цифр в одну ячейку (напр., WebOTP / iOS autofill)
    if (onlyDigits.length > 1) {
      const nextDigits = [...digits];
      for (let offset = 0; offset < onlyDigits.length; offset++) {
        const targetIdx = index + offset;
        if (targetIdx >= OTP_LENGTH) break;
        nextDigits[targetIdx] = onlyDigits[offset] ?? "";
      }
      const nextFocus = Math.min(index + onlyDigits.length, OTP_LENGTH - 1);
      applyNextCode(nextDigits, nextFocus);
      return;
    }

    const singleDigit = onlyDigits.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = singleDigit;
    const nextFocus = index < OTP_LENGTH - 1 ? index + 1 : index;
    applyNextCode(nextDigits, nextFocus);
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (disabled) return;

    if (event.key === "Backspace") {
      event.preventDefault();
      const nextDigits = [...digits];
      if (nextDigits[index]) {
        nextDigits[index] = "";
        applyNextCode(nextDigits, index);
      } else if (index > 0) {
        nextDigits[index - 1] = "";
        applyNextCode(nextDigits, index - 1);
      }
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      const nextDigits = [...digits];
      nextDigits[index] = "";
      applyNextCode(nextDigits, index);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (index > 0) focusSlot(index - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (index < OTP_LENGTH - 1) focusSlot(index + 1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusSlot(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusSlot(OTP_LENGTH - 1);
      return;
    }
  }

  function handlePaste(
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) {
    if (disabled) return;
    event.preventDefault();
    const pastedText = event.clipboardData.getData("text/plain");
    const pastedDigits = pastedText.replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pastedDigits) return;

    const nextDigits = [...digits];
    // Если вставляется полный 6-значный код, заполняем с первой ячейки
    const startIndex = pastedDigits.length === OTP_LENGTH ? 0 : index;

    for (let i = 0; i < pastedDigits.length; i++) {
      const slot = startIndex + i;
      if (slot >= OTP_LENGTH) break;
      nextDigits[slot] = pastedDigits[i] ?? "";
    }

    const nextFocus = Math.min(
      startIndex + pastedDigits.length,
      OTP_LENGTH - 1,
    );
    applyNextCode(nextDigits, nextFocus);
  }

  return (
    <fieldset
      aria-label="6-значный код подтверждения"
      className="flex min-w-0 items-center justify-between gap-2"
    >
      {OTP_SLOT_INDICES.map((slotIndex) => {
        const digit = digits[slotIndex] ?? "";
        const isFocused = focusedIndex === slotIndex;

        return (
          <input
            key={slotIndex}
            ref={(el) => {
              inputRefs.current[slotIndex] = el;
            }}
            id={slotIndex === 0 ? id : `${id}-${slotIndex + 1}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={OTP_LENGTH}
            autoComplete={slotIndex === 0 ? "one-time-code" : "off"}
            aria-label={`Цифра ${slotIndex + 1} из 6`}
            aria-invalid={hasError}
            disabled={disabled}
            value={digit}
            onFocus={(event) => {
              setFocusedIndex(slotIndex);
              event.currentTarget.select();
            }}
            onBlur={() => {
              setFocusedIndex((prev) => (prev === slotIndex ? null : prev));
            }}
            onChange={(event) =>
              handleSlotChange(slotIndex, event.target.value)
            }
            onKeyDown={(event) => handleKeyDown(slotIndex, event)}
            onPaste={(event) => handlePaste(slotIndex, event)}
            className={cn(
              "h-[56px] min-w-0 max-w-[48px] flex-1 rounded-[12px] border bg-[#0E1014] text-center font-mono text-[24px] leading-none font-bold text-[#F2F4F7] tabular-nums transition-all duration-240 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none select-all disabled:cursor-not-allowed disabled:opacity-50",
              hasError
                ? "border-[#EF4444] text-[#EF4444] shadow-[0_0_14px_rgba(239,68,68,0.18)]"
                : isFocused
                  ? "border-[#00D1FF] shadow-[0_0_0_1px_#00D1FF,0_0_16px_rgba(0,209,255,0.2)]"
                  : digit
                    ? "border-[#262B36] bg-[#0E1014] text-[#F2F4F7]"
                    : "border-[#262B36] text-[#8A93A2] hover:border-[#8A93A2]/50",
            )}
          />
        );
      })}
    </fieldset>
  );
}
