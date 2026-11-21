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
 * Layer-by-Layer Reveal: появление карточек во вьюпорте снизу вверх с
 * тонкой горизонтальной линией сканирования 1px цвета #FF5C1A по верхней
 * кромке (метафора послойной 3D-печати).
 *
 * ВАЖНО: начальное состояние не должно использовать `clip-path`.
 * IntersectionObserver в Chrome считает элемент с собственным `clip-path`
 * полностью невидимым (isIntersecting=false, ratio=0), поэтому анимация
 * `whileInView` с начальным `clipPath: inset(100% …)` никогда бы не
 * запустилась — карточки оставались бы скрытыми навсегда. Transform и
 * opacity на геометрию IntersectionObserver не влияют.
 */
export function LayerReveal({
  children,
  delay = 0,
  className,
  as: Component = "div",
  onPointerEnter,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li";
  onPointerEnter?: React.PointerEventHandler<HTMLElement>;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(false);

  const MotionComponent = Component === "li" ? motion.li : motion.div;

  if (prefersReducedMotion) {
    return <Component className={className}>{children}</Component>;
  }

  return (
    <MotionComponent
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      onAnimationComplete={() => setRevealed(true)}
      onPointerEnter={onPointerEnter}
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
    </MotionComponent>
  );
}
