"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatedCounter } from "@/components/animated-counter";

type Stat = { value: string; label: string };

export type HeroListing = {
  id: string;
  slug: string | null;
  title: string;
  image: string | null;
  price: number;
  purpose: string;
  rooms: string | null;
  netArea: number | null;
  district: string;
  neighborhood: string | null;
};

type Props = {
  displayName: string;
  district: string | null;
  eyebrow: string;
  headline: string;
  tagline: string;
  stats: Stat[];
  slug: string;
  badges: string[];
  isAuto?: boolean;
  /** Vitrinin öne çıkardığı ilan — hero'da KART içinde gösterilir */
  featured?: HeroListing | null;
  /** İstatistik yoksa basılan, envanterden bağımsız güven vaatleri */
  trustPoints?: string[];
  /** Geriye dönük uyum — artık tam ekran arka plan olarak KULLANILMIYOR */
  heroImage?: string | null;
  video?: { url: string; poster: string | null } | null;
};

const trMoney = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

/**
 * Vitrin hero — İÇERİK ÖNCELİKLİ.
 *
 * Neden yeniden yazıldı: eski hero tam ekran (100svh) bir manifestoydu ve
 * arkasına ilan fotoğrafını gerdiriyordu. İki somut sorun doğuruyordu:
 *
 * 1. Arka plana gerilen görsel `cardUrl` varyantıydı (≈528px) — mobilde
 *    ~1290px'e esnetilince BULANIK çıkıyordu, üstüne okunurluk örtüleri
 *    binince de gri bir buluta dönüşüyordu.
 * 2. Emlak vitrininin ilk ekranında TEK BİR MÜLK görünmüyordu. Ziyaretçi
 *    kaydırmadan hiçbir gayrimenkul göremiyordu; oysa vitrinin tek işi
 *    mülk göstermek ve talep toplamaktır.
 *
 * Yeni düzen: kimlik solda kompakt, öne çıkan ilan sağda GERÇEK BİR KART
 * içinde (fotoğraf kendi ölçüsünde, net). Yükseklik ekranı doldurmuyor —
 * portföy kaydırmadan görünüyor.
 */
export function ShowcaseHero({
  displayName,
  district,
  eyebrow,
  headline,
  tagline,
  stats,
  slug,
  featured = null,
  trustPoints = [],
}: Props) {
  const listingHref = featured
    ? `/ofis/${slug}/ilan/${featured.slug ? `${featured.id}-${featured.slug}` : featured.id}`
    : `/ofis/${slug}#koleksiyon`;

  const specs = featured
    ? [
        featured.rooms,
        featured.netArea ? `${featured.netArea} m²` : null,
        featured.neighborhood || featured.district,
      ].filter(Boolean)
    : [];

  return (
    <section className="fx-grain relative overflow-hidden border-b border-ink/10 bg-ink text-white">
      {/* Renksiz derinlik — gerilmiş fotoğraf yerine ışık ve ızgara */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 30% 30%, black 15%, transparent 80%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-[10%] -top-[25%] h-[70vh] w-[70vh] rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.6), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-[1080px] items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-14">
        {/* ── Kimlik ── */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-[15ch] font-display text-[clamp(30px,5.6vw,52px)] font-extrabold leading-[1.03] tracking-[-0.03em] text-balance">
            {headline}
          </h1>
          <p className="mt-4 max-w-[46ch] text-[15.5px] leading-relaxed text-white/65">
            {tagline}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href="#koleksiyon"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-bold text-ink transition-transform hover:scale-[1.03]"
            >
              Portföyü gör
              <ArrowRight size={16} />
            </a>
            <a
              href="#talep-form"
              className="inline-flex items-center rounded-full border border-white/30 px-6 py-3 text-[15px] font-bold text-white transition-colors hover:bg-white/10"
            >
              Talep bırak
            </a>
          </div>

          {/* İstatistik varsa sayılar, yoksa güven vaatleri — sıfır basılmaz */}
          {stats.length > 0 ? (
            <div className="mt-9 flex flex-wrap gap-x-9 gap-y-4 border-t border-white/12 pt-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="font-display text-[26px] font-extrabold leading-none tracking-tight tabular-nums">
                    <AnimatedCounter value={s.value} />
                  </p>
                  <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/50">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            trustPoints.length > 0 && (
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/12 pt-6">
                {trustPoints.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )
          )}
        </div>

        {/* ── Öne çıkan mülk — ilk ekranda GERÇEK bir gayrimenkul ── */}
        {featured && (
          <Link
            href={listingHref}
            className="group block overflow-hidden rounded-[24px] bg-white text-ink shadow-[0_40px_90px_-40px_rgba(0,0,0,0.7)] transition-transform hover:-translate-y-1"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-n-100">
              {featured.image ? (
                /* Kart içinde, kendi ölçüsünde — tam ekrana gerdirilmiyor,
                   bu yüzden küçük varyantlar da net görünüyor.
                   eslint-disable-next-line @next/next/no-img-element */
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="flex h-full items-center justify-center font-mono text-[11px] uppercase tracking-wider text-ink/30">
                  Fotoğraf yakında
                </div>
              )}
              <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                {featured.purpose === "RENT" ? "Kiralık" : "Satılık"}
              </span>
            </div>
            <div className="p-4">
              <p className="font-display text-[21px] font-extrabold tracking-tight tabular-nums">
                {trMoney.format(featured.price)}
                {featured.purpose === "RENT" && (
                  <span className="text-[14px] font-medium text-ink/45"> /ay</span>
                )}
              </p>
              <p className="mt-1 line-clamp-1 text-[14px] font-semibold">
                {featured.title}
              </p>
              {specs.length > 0 && (
                <p className="mt-0.5 text-[12.5px] text-ink/50">
                  {specs.join(" · ")}
                </p>
              )}
              <span className="mt-3 flex items-center gap-1.5 text-[13px] font-bold">
                İlanı incele
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </Link>
        )}
      </div>

      {district && (
        <p className="relative border-t border-white/10 py-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
          {displayName} · {district}
        </p>
      )}
    </section>
  );
}
