"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { paths } from "@paramlab/config";
import { cn, toast } from "@paramlab/ui";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authClient } from "~/auth/client";
import { normalizeAuthCallback } from "~/lib/auth-callback";
import {
  hasStoredDraftPart,
  readDraftPartFromSearchParams,
  restoreDraftPart,
} from "~/lib/draft-part";
import { OtpInput } from "./otp-input";

const emailStepSchema = z.object({
  email: z.email("Укажите корректный адрес электронной почты"),
});

type EmailStepValues = z.infer<typeof emailStepSchema>;

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_ERROR_MESSAGE = "Код не совпал или истёк. Проверьте письмо";

function formatCountdownTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function YandexIdIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <circle cx="12" cy="12" r="10" fill="#FC3F1D" />
      <path
        d="M13.42 7.2h-.95c-1.54 0-2.36.79-2.36 1.98 0 1.32.57 1.96 1.74 2.77l.96.66-2.79 4.19H8.06l2.52-3.73c-1.45-1.02-2.26-2.02-2.26-3.71 0-2.16 1.5-3.64 4.14-3.64h2.66v11.08h-1.7V7.2Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

interface AuthCardProps {
  initialStep?: "method" | "otp";
  className?: string;
}

export function AuthCard({ initialStep = "method", className }: AuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = Boolean(useReducedMotion());

  const [step, setStep] = useState<"method" | "otp">(initialStep);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [targetEmail, setTargetEmail] = useState("");
  const targetEmailRef = useRef("");
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);

  const emailForm = useForm<EmailStepValues>({
    resolver: zodResolver(emailStepSchema),
    defaultValues: { email: "" },
  });

  // Сохраняем черновик из URL query-параметров, если клиент перешёл из конфигуратора
  useEffect(() => {
    restoreDraftPart(searchParams);
  }, [searchParams]);

  // Если открыта страница /auth/otp напрямую — подтягиваем сохранённый email
  useEffect(() => {
    if (typeof window === "undefined") return;
    let storedEmail: string | null = null;
    try {
      storedEmail = window.localStorage.getItem("otp_email");
    } catch {
      // Вход работает и без доступа к браузерному хранилищу.
    }
    if (storedEmail) {
      targetEmailRef.current = storedEmail;
      setTargetEmail(storedEmail);
      emailForm.setValue("email", storedEmail);
    } else if (initialStep === "otp" && !targetEmailRef.current) {
      setStep("method");
    }
  }, [emailForm, initialStep]);

  // Обратный отсчёт таймера повторной отправки (60 сек)
  useEffect(() => {
    if (step !== "otp" || countdown <= 0) return;
    const timerId = window.setTimeout(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timerId);
  }, [step, countdown]);

  function resolvePostAuthDestination(): Route {
    const callback = normalizeAuthCallback(
      searchParams.get("callbackUrl"),
      window.location.origin,
    );
    if (callback) return callback as Route;

    const hasDraft =
      hasStoredDraftPart() ||
      readDraftPartFromSearchParams(searchParams) !== null;

    if (hasDraft) {
      return paths.parts.root;
    }

    return paths.dashboard.root;
  }

  async function handleSendOtp(values: EmailStepValues) {
    const cleanEmail = values.email.trim();
    setIsSendingCode(true);
    setOtpError(null);

    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: cleanEmail,
        type: "sign-in",
      });

      if (error) {
        toast.error(
          error.message || "Не удалось отправить код. Попробуйте ещё раз.",
        );
        return;
      }

      try {
        window.localStorage.setItem("otp_email", cleanEmail);
      } catch {
        // Адрес остаётся доступным до ухода со страницы.
      }

      targetEmailRef.current = cleanEmail;
      setTargetEmail(cleanEmail);
      setOtpValue("");
      setOtpError(null);
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setDirection(1);
      setStep("otp");
    } catch {
      toast.error("Не удалось отправить код. Проверьте подключение.");
    } finally {
      setIsSendingCode(false);
    }
  }

  async function verifyOtpCode(codeToVerify: string) {
    const cleanCode = codeToVerify.replace(/\D/g, "");
    if (cleanCode.length !== 6 || !targetEmail || isVerifyingOtp) return;

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      const { error } = await authClient.signIn.emailOtp({
        email: targetEmail,
        otp: cleanCode,
      });

      if (error) {
        setOtpError(OTP_ERROR_MESSAGE);
        return;
      }

      const destination = resolvePostAuthDestination();
      router.push(destination);
    } catch {
      setOtpError(OTP_ERROR_MESSAGE);
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  async function handleResendCode() {
    if (!targetEmail || countdown > 0 || isResending) return;
    const requestEmail = targetEmail;
    setIsResending(true);
    setOtpError(null);

    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: requestEmail,
        type: "sign-in",
      });

      if (targetEmailRef.current !== requestEmail) return;

      if (error) {
        toast.error(
          error.message ||
            "Не удалось отправить код повторно. Попробуйте позже.",
        );
        return;
      }

      setOtpValue("");
      setCountdown(RESEND_COOLDOWN_SECONDS);
      toast.success("Новый 6-значный код отправлен на вашу почту.");
    } catch {
      if (targetEmailRef.current === requestEmail) {
        toast.error("Не удалось отправить код повторно.");
      }
    } finally {
      setIsResending(false);
    }
  }

  function handleBackToEmailStep() {
    targetEmailRef.current = "";
    setOtpError(null);
    setOtpValue("");
    setDirection(-1);
    setStep("method");
  }

  function handleYandexLogin() {
    toast.info(
      "Вход через Яндекс ID скоро будет доступен. Используйте 6-значный код по почте.",
    );
    const emailInput = document.getElementById("auth-email-input");
    emailInput?.focus();
  }

  const slideVariants = {
    enter: (dir: number) =>
      prefersReducedMotion
        ? { opacity: 0, x: 0 }
        : { opacity: 0, x: dir > 0 ? 28 : -28 },
    center: { opacity: 1, x: 0 },
    exit: (dir: number) =>
      prefersReducedMotion
        ? { opacity: 0, x: 0 }
        : { opacity: 0, x: dir > 0 ? -28 : 28 },
  };

  return (
    <div
      className={cn(
        "w-full max-w-[400px] overflow-hidden rounded-[16px] border border-lab-border bg-lab-surface p-6 text-lab-text shadow-2xl sm:p-7",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        {step === "method" ? (
          <motion.div
            key="step-method"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: prefersReducedMotion ? 0 : 0.24,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex flex-col gap-5"
          >
            {/* Заголовок шлюза */}
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-lab-cyan/30 bg-lab-cyan/10 px-2 py-0.5 font-mono text-[11px] font-medium text-lab-cyan">
                <ShieldCheck className="size-3.5" />
                <span>ШЛЮЗ БЕЗ ПАРОЛЕЙ · 10 СЕК</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-lab-text sm:text-2xl">
                Вход в ParamLab
              </h1>
              <p className="mt-1 text-xs leading-relaxed text-lab-muted sm:text-sm">
                Единый вход и регистрация без паролей. Новые аккаунты создаются
                автоматически.
              </p>
            </div>

            {/* 1. Поле ввода Email + кнопка «Получить код» (#FF5C1A) */}
            <form
              onSubmit={emailForm.handleSubmit(handleSendOtp)}
              noValidate
              className="flex flex-col gap-3.5"
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="auth-email-input"
                  className="font-mono text-xs font-medium text-lab-muted"
                >
                  Рабочая или личная почта
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-lab-muted" />
                  <input
                    id="auth-email-input"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    placeholder="engineer@kb-mechatronica.ru"
                    disabled={isSendingCode}
                    aria-invalid={Boolean(emailForm.formState.errors.email)}
                    {...emailForm.register("email")}
                    className={cn(
                      "h-11 w-full rounded-[12px] border bg-lab-bg pr-3.5 pl-10 text-sm text-lab-text placeholder:text-lab-muted/70 transition-colors duration-240 outline-none",
                      emailForm.formState.errors.email
                        ? "border-destructive focus:border-destructive"
                        : "border-lab-border focus:border-lab-cyan",
                    )}
                  />
                </div>
                {emailForm.formState.errors.email && (
                  <p
                    role="alert"
                    className="font-mono text-xs text-destructive"
                  >
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSendingCode}
                className="cta-border-beam relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-[12px] bg-brand px-5 text-sm font-bold text-brand-foreground transition-transform duration-240 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none focus-visible:ring-2 focus-visible:ring-lab-cyan active:scale-[0.99] disabled:cursor-wait disabled:opacity-90"
              >
                <span>{isSendingCode ? "Проверка..." : "Получить код"}</span>
                {!isSendingCode && <ArrowRight className="size-4" />}

                {isSendingCode && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-lab-bg/35"
                  >
                    <span className="block h-full w-1/2 animate-pulse rounded-full bg-lab-cyan" />
                  </span>
                )}
              </button>
            </form>

            {/* 2. Разделитель «или» */}
            <div className="relative flex items-center py-0.5">
              <div className="flex-grow border-t border-lab-border" />
              <span className="mx-3 shrink-0 font-mono text-xs text-lab-muted">
                или
              </span>
              <div className="flex-grow border-t border-lab-border" />
            </div>

            {/* 3. Кнопка «Войти через Яндекс ID» */}
            <button
              type="button"
              onClick={handleYandexLogin}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-[12px] border border-lab-border bg-lab-bg/75 px-3.5 text-xs font-medium text-lab-muted transition-colors duration-240 outline-none hover:border-lab-muted/50 hover:text-lab-text focus-visible:ring-2 focus-visible:ring-lab-cyan"
            >
              <YandexIdIcon className="size-4 shrink-0" />
              <span>Войти через Яндекс ID</span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="step-otp"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: prefersReducedMotion ? 0 : 0.24,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex flex-col gap-5"
          >
            {/* Заголовок Шага 2 + email и кнопка Изменить */}
            <div>
              <span className="font-mono text-[11px] font-medium tracking-wider text-lab-cyan uppercase">
                {"ШАГ 02 // ПОДТВЕРЖДЕНИЕ ДОСТУПА"}
              </span>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-lab-text sm:text-2xl">
                Введите код из письма
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-lab-muted">
                <span>Отправили 6 цифр на</span>
                <span className="font-mono font-semibold text-lab-text">
                  {targetEmail}
                </span>
                <button
                  type="button"
                  onClick={handleBackToEmailStep}
                  disabled={isVerifyingOtp}
                  className="font-mono text-xs font-medium text-lab-cyan underline-offset-4 transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-lab-cyan focus-visible:outline-none disabled:opacity-50"
                >
                  Изменить
                </button>
              </div>
            </div>

            {/* 6 ячеек OtpInput */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void verifyOtpCode(otpValue);
              }}
              noValidate
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <OtpInput
                  value={otpValue}
                  onChange={(nextVal) => {
                    if (otpError) {
                      setOtpError(null);
                    }
                    setOtpValue(nextVal);
                  }}
                  onComplete={(completedCode) => {
                    void verifyOtpCode(completedCode);
                  }}
                  disabled={isVerifyingOtp}
                  hasError={Boolean(otpError)}
                />

                {otpError && (
                  <p
                    role="alert"
                    data-testid="otp-error-message"
                    className="mt-1 font-mono text-xs leading-relaxed text-destructive"
                  >
                    {otpError}
                  </p>
                )}
              </div>

              {/* Главная кнопка действия с линейной полосой прогресса по нижней кромке */}
              <button
                type="submit"
                disabled={isVerifyingOtp || !/^[0-9]{6}$/.test(otpValue)}
                className="cta-border-beam relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-[12px] bg-brand px-5 text-sm font-bold text-brand-foreground transition-transform duration-240 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none focus-visible:ring-2 focus-visible:ring-lab-cyan disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span>
                  {isVerifyingOtp ? "Проверка..." : "Подтвердить и войти"}
                </span>

                {isVerifyingOtp && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-lab-bg/35"
                  >
                    <span className="block h-full w-2/3 animate-pulse rounded-full bg-lab-cyan" />
                  </span>
                )}
              </button>
            </form>

            {/* Таймер повторной отправки */}
            <div className="border-t border-lab-border pt-3.5 text-center">
              {countdown > 0 ? (
                <p
                  data-testid="otp-resend-timer"
                  className="font-mono text-xs text-lab-muted tabular-nums"
                >
                  Отправить повторно через {formatCountdownTimer(countdown)}
                </p>
              ) : (
                <button
                  type="button"
                  data-testid="otp-resend-button"
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="font-mono text-xs font-semibold text-lab-cyan underline-offset-4 transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-lab-cyan focus-visible:outline-none disabled:opacity-50"
                >
                  {isResending ? "Отправка кода..." : "Отправить код повторно"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
