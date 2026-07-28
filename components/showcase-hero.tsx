"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { AnimatedCounter } from "@/components/animated-counter";

type Stat = { value: string; label: string };

type Props = {
  displayName: string;
  district: string | null;
  eyebrow: string;
  headline: string;
  tagline: string;
  stats: Stat[];
  slug: string;
  /** Yüzen künye rozetleri, ör. "128 AKTİF İLAN" */
  badges: string[];
  isAuto?: boolean;
  /** Ofisin en iyi ilan fotoğrafı — hero arka planı (Apple×Airbnb v2). */
  heroImage?: string | null;
  /** Geriye dönük uyum — kullanılmıyor (video-hero iptal). */
  video?: { url: string; poster: string | null } | null;
  /** Tema düzen anahtarı — hero şu an tek düzen kullanıyor; tema farkı
      kart/köşe/tipografi değişkenlerinden (globals `--sc-*`) geliyor. */
  layout?: string;
  /** İstatistik gösterilemeyecek kadar azsa basılan, envanterden bağımsız
      güven vaatleri. Sıfır göstermektense bunlar gösterilir. */
  trustPoints?: string[];
};

/**
 * Vitrin hero — Apple × Airbnb: tam ekran gerçek fotoğraf, hafif parallax,
 * ortalanmış dev tipografi, camlı istatistik şeridi.
 */
export function ShowcaseHero({
  displayName,
  district,
  eyebrow,
  headline,
  tagline,
  stats,
  badges,
  heroImage = null,
  trustPoints = [],
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = rootRef.current;
    const img = imgRef.current;
    if (!root || !img) return;
    let heroH = root.offsetHeight || 1;
    let raf = 0;
    const frame = () => {
      raf = 0;
      const y = window.scrollY;
      if (y > heroH * 1.4) return;
      img.style.transform = `translate3d(0, ${(y * 0.22).toFixed(1)}px, 0) scale(1.08)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onResize = () => {
      heroH = root.offsetHeight || 1;
      onScroll();
    };
    frame();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const activeBadge = badges[0] ?? "";

  return (
    <div
      ref={rootRef}
      className="relative flex min-h-[calc(100svh-64px)] flex-col overflow-hidden border-b border-ink/10"
    >
      {/* Katman 0 — gerçek fotoğraf + hafif parallax */}
      <div ref={imgRef} className="absolute inset-0 will-change-transform" style={{ transform: "scale(1.08)" }} aria-hidden>
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImage} alt="" className="h-full w-full object-cover" />
        ) : (
          /* Fotoğraf yoksa TİPOGRAFİK sahne — düz gradyan "yüklenmemiş" gibi
             duruyordu; bu "böyle tasarlanmış" gibi duruyor. Yeni açılan,
             henüz fotoğrafı olmayan ofisin vitrini boş görünmesin. */
          <div className="fx-grain relative h-full w-full overflow-hidden bg-[#1d1d1f]">
            <div
              className="absolute inset-0 opacity-[0.13]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "64px 64px",
                maskImage:
                  "radial-gradient(ellipse 75% 65% at 50% 40%, black 20%, transparent 78%)",
              }}
            />
            <div
              className="absolute -right-[15%] -top-[20%] h-[65vh] w-[65vh] rounded-full opacity-25 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.55), transparent 70%)",
              }}
            />
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-[6%] select-none text-center font-display text-[26vw] font-extrabold leading-none tracking-[-0.05em] text-white/[0.05] sm:text-[18vw]"
            >
              {displayName}
            </span>
          </div>
        )}
      </div>
      {/* okunurluk örtüsü */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/75" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(0,0,0,0.35),transparent_55%)]" aria-hidden />

      {/* Katman 1 — ortalanmış içerik */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-24 text-center text-white sm:px-8">
        <p className="hero-rise font-mono text-[11px] uppercase tracking-[0.22em] text-white/80" style={{ animationDelay: "40ms" }}>
          {eyebrow}
        </p>
        <h1
          className="hero-rise mt-5 max-w-[16ch] font-display text-[clamp(40px,7vw,86px)] font-extrabold leading-[0.98] tracking-[-0.03em] text-balance drop-shadow-[0_2px_30px_rgba(0,0,0,0.35)]"
          style={{ animationDelay: "120ms" }}
        >
          {headline}
        </h1>
        <p
          className="hero-rise mt-6 max-w-[46ch] text-[17px] leading-relaxed text-white/85 drop-shadow-[0_1px_16px_rgba(0,0,0,0.4)]"
          style={{ animationDelay: "200ms" }}
        >
          {tagline}
        </p>
        <div className="hero-rise mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "280ms" }}>
          {/* Beehome dili: ofis rengiyle dolu birincil + camlı ikincil */}
          <a
            href="#koleksiyon"
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_14px_36px_-12px_rgba(0,0,0,0.6)] transition-transform hover:scale-[1.03]"
          >
            Portföyü Gör
            <ArrowRight size={17} />
          </a>
          <a
            href="#talep-form"
            className="inline-flex items-center rounded-full border border-white/35 bg-white/10 px-7 py-3.5 text-[15px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            Talep Bırak
          </a>
        </div>
        {activeBadge && (
          <p className="hero-rise mt-7 font-mono text-[11px] uppercase tracking-[0.16em] text-white/60" style={{ animationDelay: "360ms" }}>
            {[displayName, district].filter(Boolean).join(" · ")} — {activeBadge}
          </p>
        )}
      </div>

      {/* Kaydırma ipucu */}
      <div className="pointer-events-none absolute bottom-[92px] left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-1 text-white/55 md:flex">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Kaydır</span>
        <ChevronDown size={18} className="animate-bounce" />
      </div>

      {/* İstatistik yoksa güven şeridi — "0+ işlem" basmaktansa vaat göster */}
      {stats.length === 0 && trustPoints.length > 0 && (
        <div className="relative z-10 border-t border-white/15 bg-black/25 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-center gap-x-7 gap-y-2 px-4 py-4 sm:px-6">
            {trustPoints.map((t) => (
              <span
                key={t}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/70"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* İstatistik şeridi — camlı */}
      {stats.length > 0 && (
        <div className="relative z-10 border-t border-white/15 bg-black/25 backdrop-blur-md">
          <div className="mx-auto grid max-w-[1080px] grid-cols-2 px-4 sm:px-6 md:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`py-5 text-center text-white ${
                  i > 0 ? "border-l border-white/12 max-md:[&:nth-child(3)]:border-l-0" : ""
                }`}
              >
                <p className="font-display text-[30px] font-extrabold tracking-tight">
                  <AnimatedCounter value={s.value} />
                </p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/60">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
