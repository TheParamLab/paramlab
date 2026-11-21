"use client";

import { cn } from "@paramlab/ui";
import { motion, useReducedMotion, useSpring } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";

const numberFormatter = new Intl.NumberFormat("ru-RU");

/**
 * Счетчик цены с пружинной интерполяцией (stiffness: 300, damping: 26).
 * Обязателен `tabular-nums`, чтобы цифры не вызывали Layout Shift.
 */
export function SpringNumber({
  value,
  suffix = "",
  prefix = "",
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const spring = useSpring(value, {
    stiffness: 300,
    damping: 26,
    mass: 0.8,
  });
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      spring.jump(value);
      return;
    }
    spring.set(value);
  }, [value, spring, prefersReducedMotion]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplayValue(Math.round(latest));
    });
    return unsubscribe;
  }, [spring]);

  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {prefix}
      {numberFormatter.format(displayValue)}
      {suffix}
    </span>
  );
}

/**
 * Layer-by-Layer Reveal: появление карточек во вьюпорте снизу вверх через
 * `clip-path` с тонкой горизонтальной линией сканирования 1px цвета #FF5C1A
 * по верхней кромке (метафора послойной 3D-печати).
 */
export function LayerReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(false);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ clipPath: "inset(100% 0% 0% 0%)", opacity: 0.65 }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      onAnimationComplete={() => setRevealed(true)}
      className={cn("relative", className)}
    >
      {!revealed && (
        <motion.span
          aria-hidden="true"
          initial={{ bottom: "0%", opacity: 1 }}
          whileInView={{ bottom: "100%", opacity: 0 }}
          viewport={{ once: true, amount: 0.16 }}
          transition={{
            duration: 0.4,
            delay,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="pointer-events-none absolute inset-x-0 z-20 h-px bg-[#FF5C1A] shadow-[0_0_12px_#FF5C1A]"
        />
      )}
      {children}
    </motion.div>
  );
}
