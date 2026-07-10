"use client";

import { useEffect, useRef, useState } from "react";

/** Scroll'da beliren blok — IntersectionObserver ile bir kez tetiklenir. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`transition-[opacity,transform] duration-500 ease-out ${
        inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Bölüm arkasındaki dev kontur etiket ("RAF 01", "PORTFÖY") —
 * viewport merkezine göre hafif parallax kayar.
 */
export function GhostTag({
  text,
  speed = 0.08,
  className = "",
}: {
  text: string;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let applied = 0; // rect transform içerir — geri çıkararak taban konum bulunur

    const frame = () => {
      raf = 0;
      const vh = window.innerHeight;
      const r = el.getBoundingClientRect();
      const baseCenter = r.top - applied + r.height / 2;
      if (baseCenter < -vh || baseCenter > vh * 2) return; // görünümden uzak
      applied = (baseCenter - vh / 2) * speed;
      el.style.transform = `translate3d(0,${applied.toFixed(1)}px,0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    frame();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [speed]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute -top-2 right-6 select-none font-display text-[56px] font-extrabold tracking-[-0.04em] text-transparent will-change-transform md:-top-3.5 md:text-[84px] ${className}`}
      style={{ WebkitTextStroke: "1px rgba(30,91,62,0.13)" }}
    >
      {text}
    </div>
  );
}
