"use client";

import { useEffect, useRef, useState } from "react";

/**
 * IntersectionObserver ile tetiklenen animasyonlu sayaç.
 * Hakkımızda istatistik plakalarında kullanılır.
 * Sayısal olmayan değerleri (ör. "%92") doğru parse eder.
 */
export function AnimatedCounter({
  value,
  duration = 1200,
}: {
  value: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayed, setDisplayed] = useState(value);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasAnimated) return;

    // Sayısal kısmı ayıkla
    const match = value.match(/^([%+]?)(\d+)([%+.,]?.*)$/);
    if (!match) {
      setDisplayed(value);
      return;
    }
    const prefix = match[1];
    const target = parseInt(match[2], 10);
    const suffix = match[3];

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setHasAnimated(true);

        if (prefersReduced || isNaN(target)) {
          setDisplayed(value);
          return;
        }

        const start = performance.now();
        const step = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          // easeOutCubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(target * eased);
          setDisplayed(`${prefix}${current}${suffix}`);
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration, hasAnimated]);

  return <span ref={ref}>{displayed}</span>;
}
