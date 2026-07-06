"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type HeroImage = { url: string; alt: string };

/**
 * Vitrin hero carousel — otomatik dönen kapak görselleri,
 * glassmorphism overlay ile ofis adı + tagline + ilan sayacı.
 */
export function HeroCarousel({
  officeName,
  tagline,
  listingCount,
  images,
}: {
  officeName: string;
  tagline: string | null;
  listingCount: number;
  images: HeroImage[];
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = images.length || 1;
  const touchRef = useRef<number | null>(null);

  const go = useCallback(
    (dir: number) => setActive((i) => (i + dir + count) % count),
    [count],
  );

  // Auto-play — 5 saniyede bir ileri
  useEffect(() => {
    if (paused || count <= 1) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    const t = setInterval(() => go(1), 5000);
    return () => clearInterval(t);
  }, [paused, count, go]);

  if (images.length === 0) {
    return (
      <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-2xl border border-ink/15 bg-brand-50 sm:h-72">
        <div className="text-center">
          <p className="font-display text-2xl font-extrabold tracking-tight sm:text-4xl">
            {officeName}
          </p>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">
            Güncel Portföy · {listingCount} ilan
          </p>
          {tagline && (
            <p className="mx-auto mt-3 max-w-md text-sm text-ink/60">{tagline}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchRef.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchRef.current === null) return;
        const dx = e.changedTouches[0].clientX - touchRef.current;
        if (Math.abs(dx) > 50) go(dx > 0 ? -1 : 1);
        touchRef.current = null;
      }}
    >
      {/* Görseller */}
      <div className="relative h-64 sm:h-80 lg:h-96">
        {images.map((img, i) => (
          <div
            key={img.url}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ))}
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/30 to-transparent" />
      </div>

      {/* İçerik */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-6 sm:px-8 sm:pb-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
          Güncel Portföy · {listingCount} ilan
        </p>
        <h1 className="mt-1.5 max-w-xl font-display text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
          {officeName}
        </h1>
        {tagline && (
          <p className="mt-2 max-w-lg text-sm text-white/75">{tagline}</p>
        )}
      </div>

      {/* Ok butonları */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:bg-white/25"
            aria-label="Önceki"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:bg-white/25"
            aria-label="Sonraki"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Dot göstergeler */}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:bottom-4">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${i + 1}. görsel`}
              className={`h-1.5 rounded-full transition-all ${
                i === active
                  ? "w-5 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
