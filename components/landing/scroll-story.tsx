"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Sticky scroll-story: solda adımlar akar, sağda görsel sabit durup
 * aktif adıma göre çapraz geçiş yapar. Mobilde görsel her adımın içine gömülür.
 */

export type StoryStep = {
  no: string;
  title: string;
  body: string;
  visual: ReactNode;
};

export function ScrollStory({ steps }: { steps: StoryStep[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const observers = refs.current.map((el, i) => {
      if (!el) return null;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(i);
        },
        { rootMargin: "-45% 0px -45% 0px" },
      );
      io.observe(el);
      return io;
    });
    return () => observers.forEach((io) => io?.disconnect());
  }, []);

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-16">
      {/* Adımlar */}
      <div>
        {steps.map((s, i) => (
          <div
            key={s.no}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="flex flex-col justify-center py-14 lg:min-h-[80vh] lg:py-0"
          >
            <div
              className={`transition-all duration-500 ${
                active === i ? "lg:opacity-100" : "lg:opacity-30"
              }`}
            >
              <span className="font-mono text-sm font-semibold tracking-[0.25em] text-brand-600">
                {s.no}
              </span>
              <h3 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                {s.title}
              </h3>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-ink/60">{s.body}</p>
            </div>

            {/* Mobil: görsel adımın hemen altında */}
            <div className="mt-8 lg:hidden">
              <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-[0_20px_50px_-20px_rgba(23,32,28,0.25)] sm:p-6">
                {s.visual}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky görsel — sadece desktop */}
      <div className="hidden lg:block">
        <div className="sticky top-0 flex h-screen items-center">
          <div className="relative w-full">
            {steps.map((s, i) => (
              <div
                key={s.no}
                className={`landing-story-visual ${i === 0 ? "relative" : "absolute inset-0"} ${
                  active === i ? "landing-story-visual-active" : ""
                }`}
              >
                <div className="flex min-h-[420px] flex-col justify-center rounded-3xl border border-ink/10 bg-white p-8 shadow-[0_32px_80px_-24px_rgba(23,32,28,0.3)]">
                  {s.visual}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
