"use client";

import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
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
};

/**
 * Katman hızları — scroll * hız kadar kayar.
 * Pozitif: aşağı (arka plan geride kalır), negatif: yukarı (öne çıkar).
 */
const GRID_SPEED = 0.18;
const GHOST_SPEED = 0.3;
const COPY_SPEED = 0.06;
const SKY_BACK_SPEED = -0.08;
const SKY_FRONT_SPEED = -0.18;
const OLCU_SPEED = -0.26;
const BADGE_SPEEDS = [-0.3, -0.38];
const BADGE_POS = ["right-[30%] top-[18%]", "right-[6%] top-[74%]"];

/** Mimari cephe çizimi — ince kontur, marka yeşili. */
function SkylineArt({ muted = false }: { muted?: boolean }) {
  const stroke = muted ? "rgba(30,91,62,0.10)" : "rgba(30,91,62,0.26)";
  const win = (bx: number, by: number, cols: number, rows: number, w = 16, h = 13, gx = 26, gy = 24) => {
    const out: React.ReactNode[] = [];
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < rows; r++)
        out.push(
          <rect key={`${bx}-${c}-${r}`} x={bx + c * gx} y={by + r * gy} width={w} height={h} />,
        );
    return out;
  };
  return (
    <svg
      viewBox="0 0 520 430"
      fill="none"
      stroke={stroke}
      strokeWidth="1.3"
      className="h-full w-full"
      aria-hidden
    >
      {/* zemin çizgisi + ölçü tikleri */}
      <path d="M0 420h520" />
      {[40, 120, 200, 280, 360, 440].map((x) => (
        <path key={x} d={`M${x} 420v6`} />
      ))}
      {/* sol blok */}
      <path d="M46 420V150h118v270" />
      <path d="M46 150l12-22h94l12 22" />
      {win(66, 172, 3, 9)}
      {/* orta blok — en yüksek */}
      <path d="M196 420V56h132v364" />
      <path d="M262 56V30" />
      <path d="M196 96h132M196 380h132" />
      {win(214, 116, 4, 10, 17, 14, 25, 25)}
      <path d="M244 420v-28h36v28" />
      {/* sağ blok */}
      <path d="M360 420V186h116v234" />
      <path d="M360 216h116" />
      {win(378, 236, 3, 7)}
    </svg>
  );
}

export function ShowcaseHero({
  displayName,
  district,
  eyebrow,
  headline,
  tagline,
  stats,
  badges,
  isAuto = false,
}: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const skyBackRef = useRef<HTMLDivElement>(null);
  const skyFrontRef = useRef<HTMLDivElement>(null);
  const olcuRef = useRef<HTMLDivElement>(null);
  const badgeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const ghostText = (district ?? displayName.split(" ")[0] ?? "").toUpperCase();
  const olcuLabel = [district?.toUpperCase(), "GÜNCEL PORTFÖY"].filter(Boolean).join(" · ");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = rootRef.current;
    if (!root) return;

    let heroH = root.offsetHeight || 1;
    let raf = 0;

    // Tek rAF döngüsü, yalnızca transform yazar — layout tetiklemez.
    const frame = () => {
      raf = 0;
      const y = window.scrollY;
      if (y > heroH * 1.5) return; // hero çoktan görünümden çıktı
      const set = (el: HTMLElement | null, f: number) => {
        if (el) el.style.transform = `translate3d(0,${(y * f).toFixed(1)}px,0)`;
      };
      set(gridRef.current, GRID_SPEED);
      set(ghostRef.current, GHOST_SPEED);
      set(copyRef.current, COPY_SPEED);
      set(skyBackRef.current, SKY_BACK_SPEED);
      set(skyFrontRef.current, SKY_FRONT_SPEED);
      set(olcuRef.current, OLCU_SPEED);
      badgeRefs.current.forEach((el, i) => set(el, BADGE_SPEEDS[i] ?? -0.3));
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

  return (
    <div
      ref={rootRef}
      className="relative flex flex-col overflow-hidden border-b border-ink pb-0 md:min-h-[calc(100svh-64px)]"
    >
      {/* Katman 0 — çizgili grid (en yavaş) */}
      <div
        ref={gridRef}
        className="pointer-events-none absolute inset-x-0 -inset-y-[12%] will-change-transform"
        style={{
          backgroundImage:
            "linear-gradient(rgba(23,32,28,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(23,32,28,0.07) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage: "radial-gradient(130% 95% at 68% 8%, #000 42%, transparent 80%)",
        }}
      />

      {/* Katman 0.5 — dev kontur yazı */}
      {ghostText && (
        <div
          ref={ghostRef}
          aria-hidden
          className="pointer-events-none absolute -right-[2%] top-[5%] hidden select-none font-display text-[min(22vw,280px)] font-extrabold leading-[0.9] tracking-[-0.04em] text-transparent will-change-transform md:block"
          style={{ WebkitTextStroke: "1px rgba(30,91,62,0.09)" }}
        >
          {ghostText}
        </div>
      )}

      {/* Katman 1 — mimari kompozisyon (yalnız emlak; masaüstü) */}
      {!isAuto && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] hidden w-[46%] md:block">
          {/* arka siluet — daha soluk, daha yavaş */}
          <div
            ref={skyBackRef}
            className="absolute inset-x-0 bottom-[8%] top-[22%] translate-x-[7%] will-change-transform"
          >
            <SkylineArt muted />
          </div>
          {/* ön çizim */}
          <div
            ref={skyFrontRef}
            className="absolute inset-x-0 bottom-[12%] top-[14%] will-change-transform"
          >
            <SkylineArt />
          </div>
          {/* ölçü çizgisi */}
          <div
            ref={olcuRef}
            className="olcu absolute left-[6%] right-[10%] top-[10%] will-change-transform"
          >
            <span className="olcu-cizgi" />
            <span>{olcuLabel}</span>
            <span className="olcu-cizgi" />
          </div>
        </div>
      )}

      {/* Katman 2 — künye rozetleri (en hızlı); .kunye display'i hidden'ı ezdiğinden sarmalayıcı gizler */}
      <div className="pointer-events-none absolute inset-0 z-[2] hidden md:block" aria-hidden>
        {badges.map((b, i) => (
          <span
            key={b}
            ref={(el) => {
              badgeRefs.current[i] = el;
            }}
            className={`absolute will-change-transform ${BADGE_POS[i]}`}
          >
            <span className="kunye">{b}</span>
          </span>
        ))}
      </div>

      {/* Katman 3 — metin */}
      <div
        ref={copyRef}
        className="relative z-[3] px-4 pb-14 pt-10 will-change-transform sm:px-6 md:pb-0 md:pt-[10vh]"
      >
        <div className="mx-auto w-full max-w-[1080px]">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">{eyebrow}</p>
          <h1 className="mt-3.5 max-w-[15ch] font-display text-[clamp(38px,5.4vw,58px)] font-extrabold leading-[1.02] tracking-tight text-balance">
            {headline}
          </h1>
          <p className="mt-4 max-w-[36ch] text-[17px] leading-snug text-ink/70">{tagline}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#koleksiyon"
              className="btn-selvi inline-flex items-center rounded-[9px] px-4 py-2.5 text-sm font-bold text-white"
            >
              Portföyü Gör
            </a>
            <a
              href="#talep-form"
              className="inline-flex items-center rounded-[9px] border border-ink/15 bg-white px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:border-ink/40"
            >
              Talep Bırak
            </a>
          </div>
          <div className="olcu mt-7 max-w-[320px]">
            <span className="olcu-cizgi" />
            <span>{displayName.toUpperCase()} · VİTRİN</span>
            <span className="olcu-cizgi" />
          </div>
        </div>
      </div>

      {/* Kaydırma ipucu */}
      <div className="pointer-events-none absolute bottom-[96px] left-1/2 z-[3] hidden -translate-x-1/2 flex-col items-center gap-1 text-ink/45 md:flex">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Kaydır</span>
        <ChevronDown size={18} className="animate-bounce" />
      </div>

      {/* İstatistik şeridi */}
      {stats.length > 0 && (
        <div className="relative z-[3] mt-auto border-t border-ink/15 bg-paper/75 backdrop-blur-sm">
          <div className="mx-auto grid max-w-[1080px] grid-cols-2 px-4 sm:px-6 md:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`py-4 text-center ${
                  i > 0 ? "border-l border-ink/10 max-md:[&:nth-child(3)]:border-l-0" : ""
                }`}
              >
                <p className="font-display text-[30px] font-extrabold tracking-tight">
                  <AnimatedCounter value={s.value} />
                </p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink/50">
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
