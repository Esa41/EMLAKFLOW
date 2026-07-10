"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Building2, Car, ChevronDown } from "lucide-react";
import { AnimatedCounter } from "@/components/animated-counter";
import { trMoney } from "@/lib/labels";
import { rentPriceSuffix } from "@/lib/showcase-vertical";
import { showcaseKunyePlate } from "@/lib/showcase-card";
import type { ShowcaseCardListing } from "@/components/showcase-card";

type Stat = { value: string; label: string };

type Props = {
  displayName: string;
  district: string | null;
  eyebrow: string;
  headline: string;
  tagline: string;
  stats: Stat[];
  slug: string;
  /** Hero'da yüzen kartlar — öne çıkanlardan ilk 3 */
  floatCards: ShowcaseCardListing[];
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
const CARD_SPEEDS = [-0.16, -0.28, -0.4];
const BADGE_SPEEDS = [-0.22, -0.34];

const CARD_POS = [
  "right-[4%] top-[6%] w-[230px] md:right-[6%] md:top-[12%]",
  "left-[4%] top-[30%] w-[206px] md:left-auto md:right-[24%] md:top-[44%]",
  "right-[12%] top-[52%] w-[196px] md:right-[2%] md:top-[58%]",
];
const CARD_IMG_H = ["h-[120px]", "h-[104px]", "h-[96px]"];
const BADGE_POS = ["right-[38%] top-[20%]", "right-[14%] top-[82%]"];

export function ShowcaseHero({
  displayName,
  district,
  eyebrow,
  headline,
  tagline,
  stats,
  slug,
  floatCards,
  badges,
  isAuto = false,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tiltRefs = useRef<(HTMLDivElement | null)[]>([]);
  const badgeRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const EmptyIcon = isAuto ? Car : Building2;
  const ghostText = (district ?? displayName.split(" ")[0] ?? "").toUpperCase();

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
      cardRefs.current.forEach((el, i) => set(el, CARD_SPEEDS[i] ?? -0.2));
      badgeRefs.current.forEach((el, i) => set(el, BADGE_SPEEDS[i] ?? -0.25));
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

    // Masaüstü tilt — yüzen kartlar imleci hafifçe takip eder.
    const fine = window.matchMedia("(pointer: fine)").matches;
    let tiltRaf = 0;
    let mx = 0;
    let my = 0;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
      if (!tiltRaf)
        tiltRaf = requestAnimationFrame(() => {
          tiltRaf = 0;
          tiltRefs.current.forEach((el, i) => {
            if (!el) return;
            const depth = 6 + i * 5;
            el.style.transform = `translate3d(${(-mx * depth).toFixed(1)}px,${(-my * depth).toFixed(1)}px,0)`;
          });
        });
    };
    if (fine) root.addEventListener("mousemove", onMove);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(tiltRaf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (fine) root.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative flex min-h-[calc(100svh-64px)] flex-col overflow-hidden border-b border-ink"
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
          className="pointer-events-none absolute -right-[2%] top-[6%] hidden select-none font-display text-[min(24vw,300px)] font-extrabold leading-[0.9] tracking-[-0.04em] text-transparent will-change-transform md:block"
          style={{ WebkitTextStroke: "1px rgba(30,91,62,0.10)" }}
        >
          {ghostText}
        </div>
      )}

      {/* Katman 1 — metin */}
      <div ref={copyRef} className="relative z-[3] px-4 pt-10 will-change-transform sm:px-6 md:pt-[9vh]">
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
        </div>
      </div>

      {/* Katman 2 — yüzen kartlar (en hızlı) */}
      {floatCards.length > 0 && (
        <div className="pointer-events-none z-[2] max-md:relative max-md:mx-4 max-md:mt-6 max-md:h-[300px] md:absolute md:inset-0">
          {floatCards.slice(0, 3).map((l, i) => (
            <div
              key={l.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className={`absolute will-change-transform ${CARD_POS[i]}`}
            >
              <div
                ref={(el) => {
                  tiltRefs.current[i] = el;
                }}
                className="will-change-transform"
              >
                <Link
                  href={`/ofis/${slug}/ilan/${l.slug ? `${l.id}-${l.slug}` : l.id}`}
                  data-imp={l.id}
                  className="pointer-events-auto block overflow-hidden rounded-xl border border-ink bg-white shadow-[0_18px_50px_-18px_rgba(23,32,28,0.35)] transition-shadow hover:shadow-[0_26px_60px_-18px_rgba(23,32,28,0.45)]"
                >
                  <div className={`relative bg-brand-50 ${CARD_IMG_H[i]}`}>
                    {l.image ? (
                      <Image
                        src={l.image}
                        alt={l.imageAlt}
                        fill
                        priority={i === 0}
                        sizes="230px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-brand-600/25">
                        <EmptyIcon size={26} strokeWidth={1.4} />
                      </div>
                    )}
                    <span className="kunye absolute -bottom-3 left-2.5 max-w-[85%] truncate text-[9px]">
                      {showcaseKunyePlate({ ...l, isAuto })}
                    </span>
                  </div>
                  <div className="px-3 pb-3 pt-[18px]">
                    <h4 className="truncate text-[12.5px] font-bold">{l.title}</h4>
                    <p className="mt-1 font-display text-base font-extrabold tracking-tight">
                      {trMoney.format(l.price)}
                      {rentPriceSuffix(isAuto, l.purpose) && (
                        <span className="text-xs font-medium text-ink/50">
                          {rentPriceSuffix(isAuto, l.purpose)}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 font-mono text-[9.5px] text-ink/50">
                      {isAuto
                        ? (l.vehicleYear ?? "")
                        : `${l.rooms ?? "—"} · net ${l.netArea ?? l.grossArea ?? "—"} m²`}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          ))}

          {badges.map((b, i) => (
            <span
              key={b}
              ref={(el) => {
                badgeRefs.current[i] = el;
              }}
              className={`kunye absolute hidden will-change-transform md:inline-flex ${BADGE_POS[i]}`}
            >
              {b}
            </span>
          ))}
        </div>
      )}

      {/* Kaydırma ipucu */}
      <div className="pointer-events-none absolute bottom-[92px] left-1/2 z-[3] hidden -translate-x-1/2 flex-col items-center gap-1 text-ink/45 md:flex">
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
