"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { AnimatedCounter } from "@/components/animated-counter";
import { trMoney } from "@/lib/labels";

type Stat = { value: string; label: string };

export type HeroFeatured = {
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
  /** Yüzen künye rozetleri, ör. "128 AKTİF İLAN" */
  badges: string[];
  isAuto?: boolean;
  /** Ofisin en iyi ilan fotoğrafı — arka plan / kart görseli. */
  heroImage?: string | null;
  /** Galeri düzeni için ek fotoğraflar (mozaik). */
  galleryImages?: string[];
  /** Öne çıkan mülkün künyesi — Klasik kartında ve Galeri etiketinde. */
  featured?: HeroFeatured | null;
  /** Minimal düzenin sağ sütunundaki hızlı geçişler. */
  quickLinks?: { title: string; count: number; href: string }[];
  /**
   * VİTRİN TEMASININ HERO DÜZENİ — temalar arasındaki en büyük fark budur.
   * split = Klasik, editorial = Editoryal, gallery = Galeri, compact = Minimal
   */
  layout?: string;
  /** İstatistik gösterilemeyecek kadar azsa basılan, envanterden bağımsız
      güven vaatleri. Sıfır göstermektense bunlar gösterilir. */
  trustPoints?: string[];
};

/* ── Ortak küçük parçalar ─────────────────────────────────────────── */

function priceLabel(f: HeroFeatured) {
  return `${trMoney.format(f.price)}${f.purpose === "RENT" ? "/ay" : ""}`;
}

function featuredHref(slug: string, f: HeroFeatured) {
  return `/ofis/${slug}/ilan/${f.slug ? `${f.id}-${f.slug}` : f.id}`;
}

/** Fotoğrafı olmayan ofis için tipografik sahne — "yüklenmedi" gibi
    durmasın diye bilinçli tasarlanmış boşluk. */
function TypographicPlate({ displayName, tone = "dark" }: { displayName: string; tone?: "dark" | "light" }) {
  const dark = tone === "dark";
  return (
    <div
      className={`fx-grain relative h-full w-full overflow-hidden ${dark ? "bg-[#1d1d1f]" : "bg-brand-50"}`}
    >
      <div
        className={`absolute inset-0 ${dark ? "opacity-[0.13]" : "opacity-[0.5]"}`}
        style={{
          backgroundImage: dark
            ? "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)"
            : "linear-gradient(rgba(29,29,31,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(29,29,31,0.14) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 75% 65% at 50% 40%, black 20%, transparent 78%)",
        }}
      />
      <span
        aria-hidden
        className={`absolute inset-x-0 bottom-[6%] select-none text-center font-display text-[22vw] font-extrabold leading-none tracking-[-0.05em] ${
          dark ? "text-white/[0.05]" : "text-ink/[0.06]"
        }`}
      >
        {displayName}
      </span>
    </div>
  );
}

/** Fotoğraf arka planlarında hafif parallax — sadece hareket açıkken. */
function useParallax(root: React.RefObject<HTMLDivElement | null>, img: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = root.current;
    const i = img.current;
    if (!r || !i) return;
    let heroH = r.offsetHeight || 1;
    let raf = 0;
    const frame = () => {
      raf = 0;
      const y = window.scrollY;
      if (y > heroH * 1.4) return;
      i.style.transform = `translate3d(0, ${(y * 0.2).toFixed(1)}px, 0) scale(1.08)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onResize = () => {
      heroH = r.offsetHeight || 1;
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
  }, [root, img]);
}

/** Koyu zeminlerde kullanılan camlı istatistik / güven şeridi. */
function DarkStrip({ stats, trustPoints }: { stats: Stat[]; trustPoints: string[] }) {
  if (stats.length === 0 && trustPoints.length === 0) return null;
  return (
    <div className="relative z-10 border-t border-white/15 bg-black/25 backdrop-blur-md">
      {stats.length > 0 ? (
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
      ) : (
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-center gap-x-7 gap-y-2 px-4 py-4 sm:px-6">
          {trustPoints.map((t) => (
            <span key={t} className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/70">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   1) KLASİK — "split"
   Aydınlık iki sütun: solda kimlik ve çağrı, sağda öne çıkan mülkün
   künyeli kartı. Ücretsiz planın varsayılanı: her portföyde çalışır,
   tek fotoğrafla bile dolu görünür.
   ══════════════════════════════════════════════════════════════════ */
function SplitHero({
  displayName, district, eyebrow, headline, tagline, stats, slug,
  heroImage, featured, trustPoints = [],
}: Props) {
  const points = stats.length > 0 ? [] : trustPoints;
  return (
    <div className="sc-hero relative overflow-hidden border-b border-ink/10 bg-paper">
      {/* zemin dokusu — düz beyaz yerine hafif ışık */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            "radial-gradient(60% 50% at 15% 0%, rgba(29,29,31,0.07), transparent 70%), radial-gradient(45% 45% at 100% 100%, rgba(29,29,31,0.06), transparent 70%)",
        }}
      />
      <div className="relative mx-auto grid max-w-[1180px] items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-24">
        {/* Sol — kimlik */}
        <div className="min-w-0">
          <span
            className="hero-rise inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/60"
            style={{ animationDelay: "40ms" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
            {eyebrow}
          </span>
          <h1
            className="hero-rise sc-title mt-6 max-w-[17ch] font-display font-extrabold leading-[0.97] tracking-[-0.035em] text-balance"
            style={{ animationDelay: "120ms" }}
          >
            {headline}
          </h1>
          <p
            className="hero-rise mt-5 max-w-[46ch] text-[16.5px] leading-relaxed text-ink/60"
            style={{ animationDelay: "200ms" }}
          >
            {tagline}
          </p>
          <div className="hero-rise mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "280ms" }}>
            <a
              href="#koleksiyon"
              className="sc-btn inline-flex items-center gap-2 bg-brand-600 px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_16px_34px_-16px_rgba(29,29,31,0.7)] transition-transform hover:scale-[1.03]"
            >
              Portföyü Gör
              <ArrowRight size={17} />
            </a>
            <a
              href="#talep-form"
              className="sc-btn inline-flex items-center border border-ink/20 bg-white px-7 py-3.5 text-[15px] font-bold text-ink transition-colors hover:border-ink/50"
            >
              Talep Bırak
            </a>
          </div>

          {/* Aydınlık şerit — koyu hero'daki camlı şeridin karşılığı */}
          {stats.length > 0 && (
            <div
              className="hero-rise mt-10 flex flex-wrap gap-x-9 gap-y-4 border-t border-ink/10 pt-6"
              style={{ animationDelay: "360ms" }}
            >
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="font-display text-[26px] font-extrabold leading-none tracking-tight">
                    <AnimatedCounter value={s.value} />
                  </p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink/45">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          )}
          {points.length > 0 && (
            <div
              className="hero-rise mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-ink/10 pt-6"
              style={{ animationDelay: "360ms" }}
            >
              {points.map((t) => (
                <span key={t} className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Sağ — öne çıkan mülkün kartı */}
        <div className="hero-rise min-w-0" style={{ animationDelay: "240ms" }}>
          <div className="group relative overflow-hidden rounded-[26px] border border-ink/10 bg-white shadow-[0_40px_80px_-50px_rgba(29,29,31,0.6)]">
            <div className="relative aspect-[4/3.2] overflow-hidden">
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImage}
                  alt={featured?.title ?? displayName}
                  className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
                />
              ) : (
                <TypographicPlate displayName={displayName} tone="light" />
              )}
              {featured && (
                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-ink backdrop-blur">
                  Öne Çıkan
                </span>
              )}
            </div>
            {featured ? (
              <Link href={featuredHref(slug, featured)} className="block px-5 py-4 transition-colors hover:bg-ink/[0.03]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-[15.5px] font-semibold tracking-tight">{featured.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-[13px] text-ink/55">
                      {featured.district}
                      {featured.neighborhood ? ` · ${featured.neighborhood}` : ""}
                      {[featured.rooms, featured.netArea ? `${featured.netArea} m²` : null]
                        .filter(Boolean)
                        .map((x) => ` · ${x}`)
                        .join("")}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-[17px] font-extrabold tracking-tight">
                    {priceLabel(featured)}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="px-5 py-4">
                <p className="text-[15.5px] font-semibold tracking-tight">
                  {[displayName, district].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-0.5 text-[13px] text-ink/55">Portföy hazırlanıyor — talebinizi şimdi bırakın.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   2) EDİTORYAL — "editorial"
   Koyu dergi kapağı: dev tipografi sayfayı taşır, fotoğraf dar bir
   dikey sütuna çekilir. Az fotoğrafı olan butik ofis için.
   ══════════════════════════════════════════════════════════════════ */
function EditorialHero({
  displayName, district, eyebrow, headline, tagline, stats, badges,
  heroImage, trustPoints = [],
}: Props) {
  const words = headline.split(" ");
  const cut = Math.ceil(words.length / 2);
  const line1 = words.slice(0, cut).join(" ");
  const line2 = words.slice(cut).join(" ");

  return (
    <div className="sc-hero relative flex flex-col overflow-hidden border-b border-ink/10 bg-[#111114] text-white">
      <div className="fx-grain pointer-events-none absolute inset-0 opacity-[0.5]" aria-hidden />
      <div className="relative z-10 mx-auto grid w-full max-w-[1180px] flex-1 items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.35fr_0.65fr] lg:gap-14 lg:py-20">
        {/* Sol — künye + dev başlık */}
        <div className="min-w-0">
          <div className="hero-rise flex items-center gap-4" style={{ animationDelay: "40ms" }}>
            <span className="font-mono text-[42px] font-extrabold leading-none tracking-tighter text-white/15">01</span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/55">{eyebrow}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
                {[displayName, district].filter(Boolean).join(" — ")}
              </p>
            </div>
          </div>

          <div className="mt-8 border-y border-white/12 py-8">
            <h1 className="sc-title font-display font-extrabold leading-[0.92] tracking-[-0.04em]">
              <span className="hero-rise block text-balance" style={{ animationDelay: "120ms" }}>
                {line1}
              </span>
              {line2 && (
                <span
                  className="hero-rise block text-balance text-white/45"
                  style={{ animationDelay: "200ms" }}
                >
                  {line2}
                </span>
              )}
            </h1>
          </div>

          <div className="mt-7 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
            <p
              className="hero-rise max-w-[38ch] text-[15px] leading-relaxed text-white/60"
              style={{ animationDelay: "280ms" }}
            >
              {tagline}
            </p>
            <div className="hero-rise flex shrink-0 flex-wrap gap-3" style={{ animationDelay: "340ms" }}>
              {/* Editoryal dilde buton değil, altı çizili bağlantı */}
              <a
                href="#koleksiyon"
                className="group inline-flex items-center gap-2 border-b-2 border-white pb-1 text-[15px] font-bold tracking-tight"
              >
                Portföyü Gör
                <ArrowUpRight size={17} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <a
                href="#talep-form"
                className="group inline-flex items-center gap-2 border-b-2 border-white/25 pb-1 text-[15px] font-bold tracking-tight text-white/60 transition-colors hover:border-white/60 hover:text-white"
              >
                Talep Bırak
              </a>
            </div>
          </div>
        </div>

        {/* Sağ — dar dikey fotoğraf sütunu */}
        <div className="hero-rise relative hidden lg:block" style={{ animationDelay: "180ms" }}>
          <div className="relative aspect-[3/4.2] overflow-hidden">
            {heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroImage} alt="" className="h-full w-full object-cover grayscale-[0.15]" />
            ) : (
              <TypographicPlate displayName={displayName} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" aria-hidden />
          </div>
          {badges[0] && (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{badges[0]}</p>
          )}
        </div>
      </div>

      {/* Alt defter şeridi — sayılar solda hizalı, dergi künyesi gibi */}
      {(stats.length > 0 || trustPoints.length > 0) && (
        <div className="relative z-10 border-t border-white/12">
          <div className="mx-auto flex max-w-[1180px] flex-wrap gap-x-12 gap-y-4 px-5 py-6 sm:px-8">
            {stats.length > 0
              ? stats.map((s) => (
                  <div key={s.label}>
                    <p className="font-display text-[27px] font-extrabold leading-none tracking-tight">
                      <AnimatedCounter value={s.value} />
                    </p>
                    <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
                      {s.label}
                    </p>
                  </div>
                ))
              : trustPoints.map((t) => (
                  <span key={t} className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                    {t}
                  </span>
                ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   3) GALERİ — "gallery"
   Tam ekran fotoğraf mozaiği; metin altta camlı bir kartta durur.
   Görseli güçlü, lüks segment portföyleri için.
   ══════════════════════════════════════════════════════════════════ */
function GalleryHero({
  displayName, district, eyebrow, headline, tagline, stats, slug, badges,
  heroImage, galleryImages = [], featured, trustPoints = [],
}: Props) {
  const side = galleryImages.filter((u) => u && u !== heroImage).slice(0, 2);

  return (
    <div className="sc-hero relative flex flex-col overflow-hidden border-b border-ink/10 bg-[#1d1d1f]">
      {/* Mozaik: solda dev görsel, sağda iki dikey kare.
          Parallax YOK: yuvarlatılmış hücreyi kaydırmak üst kenarda boşluk
          açıyordu. Yerine çok yavaş bir yakınlaşma (fx-kenburns) var. */}
      <div className="absolute inset-0 grid gap-1.5 p-1.5 md:grid-cols-[2.1fr_1fr]" aria-hidden>
        <div className="relative overflow-hidden rounded-[26px]">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImage} alt="" className="fx-kenburns h-full w-full object-cover" />
          ) : (
            <TypographicPlate displayName={displayName} />
          )}
        </div>
        {side.length > 0 && (
          <div className="hidden grid-rows-2 gap-1.5 md:grid">
            {side.map((u) => (
              <div key={u} className="relative overflow-hidden rounded-[26px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* okunurluk */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.3) 100%)" }}
      />

      {/* Üstte künye satırı */}
      <div className="relative z-10 flex items-start justify-between gap-4 px-6 pt-8 sm:px-10">
        <p className="hero-rise font-mono text-[10px] uppercase tracking-[0.22em] text-white/70" style={{ animationDelay: "40ms" }}>
          {eyebrow}
        </p>
        {badges[0] && (
          <p className="hero-rise font-mono text-[10px] uppercase tracking-[0.22em] text-white/55" style={{ animationDelay: "40ms" }}>
            {badges[0]}
          </p>
        )}
      </div>

      <div className="flex-1" />

      {/* Altta camlı içerik kartı — fotoğrafın önünde durur, üstünü kapatmaz */}
      <div className="relative z-10 px-4 pb-6 sm:px-8 sm:pb-8">
        {/* Mobilde kart hero'nun tamamını yutmasın: tanıtım metni ve sayı
            şeridi küçük ekranda gizlenir, fotoğraf nefes alır. */}
        <div className="mx-auto w-full max-w-[1180px] rounded-[28px] border border-white/15 bg-black/35 p-5 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1
                className="hero-rise sc-title max-w-[20ch] font-display font-extrabold leading-[0.98] tracking-[-0.035em] text-balance text-white"
                style={{ animationDelay: "120ms" }}
              >
                {headline}
              </h1>
              <p
                className="hero-rise mt-4 hidden max-w-[52ch] text-[15.5px] leading-relaxed text-white/70 sm:block"
                style={{ animationDelay: "200ms" }}
              >
                {tagline}
              </p>
            </div>
            <div className="hero-rise flex shrink-0 gap-3" style={{ animationDelay: "280ms" }}>
              <a
                href="#koleksiyon"
                className="sc-btn inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap bg-white px-4 py-3.5 text-[15px] font-bold text-ink transition-transform hover:scale-[1.03] sm:flex-none sm:px-7"
              >
                Portföyü Gör
                <ArrowRight size={17} />
              </a>
              <a
                href="#talep-form"
                className="sc-btn inline-flex flex-1 items-center justify-center whitespace-nowrap border border-white/35 bg-white/10 px-4 py-3.5 text-[15px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:flex-none sm:px-7"
              >
                Talep Bırak
              </a>
            </div>
          </div>

          {/* Künye satırı: öne çıkan mülk + sayılar */}
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/12 pt-4 sm:mt-7 sm:pt-5">
            {featured && (
              <Link
                href={featuredHref(slug, featured)}
                className="group inline-flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-white"
              >
                <span className="rounded-full bg-white/15 px-2.5 py-1 font-bold text-white">
                  {priceLabel(featured)}
                </span>
                <span className="line-clamp-1 max-w-[34ch] normal-case tracking-normal">{featured.title}</span>
                <ArrowUpRight size={13} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            )}
            <div className="ml-auto hidden flex-wrap gap-x-7 gap-y-2 sm:flex">
              {(stats.length > 0 ? stats : []).map((s) => (
                <span key={s.label} className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
                  <b className="font-display text-[15px] font-extrabold tracking-tight text-white">{s.value}</b>{" "}
                  {s.label}
                </span>
              ))}
              {stats.length === 0 &&
                trustPoints.map((t) => (
                  <span key={t} className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
                    {t}
                  </span>
                ))}
            </div>
          </div>
          {!featured && (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
              {[displayName, district].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   4) MİNİMAL — "compact"
   Alçak banner: fotoğraf yok, ziyaretçi iki saniyede ilanlara iner.
   Sağda kategori kısayolları. Geniş portföylü kurumsal ofisler için.
   ══════════════════════════════════════════════════════════════════ */
function CompactHero({
  displayName, district, eyebrow, headline, stats, badges,
  quickLinks = [], trustPoints = [],
}: Props) {
  const line = stats.length > 0 ? stats.map((s) => `${s.value} ${s.label}`) : trustPoints;
  return (
    <div className="sc-hero relative overflow-hidden border-b border-ink/15 bg-paper">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:py-14">
        <div className="min-w-0">
          <p className="hero-rise font-mono text-[10px] uppercase tracking-[0.22em] text-ink/45" style={{ animationDelay: "40ms" }}>
            {[eyebrow, badges[0]].filter(Boolean).join(" · ")}
          </p>
          <h1
            className="hero-rise sc-title mt-3 max-w-[22ch] font-display font-extrabold leading-[1.02] tracking-[-0.035em] text-balance"
            style={{ animationDelay: "110ms" }}
          >
            {headline}
          </h1>
          <div className="hero-rise mt-5 flex flex-wrap items-center gap-3" style={{ animationDelay: "180ms" }}>
            <a
              href="#portfoy"
              className="sc-btn inline-flex items-center gap-2 bg-brand-600 px-6 py-3 text-[14.5px] font-bold text-white transition-transform hover:scale-[1.02]"
            >
              Tüm Portföy
              <ArrowRight size={16} />
            </a>
            <a
              href="#talep-form"
              className="sc-btn inline-flex items-center border border-ink/20 bg-white px-6 py-3 text-[14.5px] font-bold text-ink transition-colors hover:border-ink/50"
            >
              Talep Bırak
            </a>
            {line.length > 0 && (
              <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/40">
                {line.join("  ·  ")}
              </span>
            )}
          </div>
        </div>

        {/* Sağ — kategori kısayolları (fotoğraf yok, sadece satırlar) */}
        <div className="hero-rise min-w-0" style={{ animationDelay: "220ms" }}>
          {quickLinks.length > 0 ? (
            <ul className="divide-y divide-ink/10 border-y border-ink/10">
              {quickLinks.slice(0, 3).map((qk) => (
                <li key={qk.title}>
                  <Link
                    href={qk.href}
                    className="group flex items-center justify-between gap-4 py-3.5 transition-colors hover:text-brand-600"
                  >
                    <span className="text-[15px] font-semibold tracking-tight">{qk.title}</span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-ink/45">{qk.count}</span>
                      <ArrowUpRight
                        size={16}
                        className="text-ink/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-y border-ink/10 py-3.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
              {[displayName, district].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   5) Varsayılan tam ekran fotoğraf hero'su — düzen anahtarı tanınmazsa.
   ══════════════════════════════════════════════════════════════════ */
function FullBleedHero(p: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  useParallax(rootRef, imgRef);
  const activeBadge = p.badges[0] ?? "";

  return (
    <div ref={rootRef} className="sc-hero relative flex flex-col overflow-hidden border-b border-ink/10">
      <div ref={imgRef} className="absolute inset-0 will-change-transform" style={{ transform: "scale(1.08)" }} aria-hidden>
        {p.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.heroImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <TypographicPlate displayName={p.displayName} />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/75" aria-hidden />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-24 text-center text-white sm:px-8">
        <p className="hero-rise font-mono text-[11px] uppercase tracking-[0.22em] text-white/80" style={{ animationDelay: "40ms" }}>
          {p.eyebrow}
        </p>
        <h1
          className="hero-rise sc-title mt-5 max-w-[16ch] font-display font-extrabold leading-[0.98] tracking-[-0.03em] text-balance drop-shadow-[0_2px_30px_rgba(0,0,0,0.35)]"
          style={{ animationDelay: "120ms" }}
        >
          {p.headline}
        </h1>
        <p
          className="hero-rise mt-6 max-w-[46ch] text-[17px] leading-relaxed text-white/85"
          style={{ animationDelay: "200ms" }}
        >
          {p.tagline}
        </p>
        <div className="hero-rise mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "280ms" }}>
          <a
            href="#koleksiyon"
            className="sc-btn inline-flex items-center gap-2 bg-brand-600 px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_14px_36px_-12px_rgba(0,0,0,0.6)] transition-transform hover:scale-[1.03]"
          >
            Portföyü Gör
            <ArrowRight size={17} />
          </a>
          <a
            href="#talep-form"
            className="sc-btn inline-flex items-center border border-white/35 bg-white/10 px-7 py-3.5 text-[15px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            Talep Bırak
          </a>
        </div>
        {activeBadge && (
          <p className="hero-rise mt-7 font-mono text-[11px] uppercase tracking-[0.16em] text-white/60" style={{ animationDelay: "360ms" }}>
            {[p.displayName, p.district].filter(Boolean).join(" · ")} — {activeBadge}
          </p>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-[92px] left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-1 text-white/55 md:flex">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Kaydır</span>
        <ChevronDown size={18} className="animate-bounce" />
      </div>

      <DarkStrip stats={p.stats} trustPoints={p.trustPoints ?? []} />
    </div>
  );
}

/**
 * Vitrin hero'su — DÜZEN TEMADAN GELİR.
 * Temalar arasındaki fark yalnızca köşe/boşluk değil; her tema farklı bir
 * hero mimarisi kullanır. Ücretsiz plan Klasik'i alır, diğerleri Premium.
 */
export function ShowcaseHero(props: Props) {
  switch (props.layout) {
    case "editorial":
      return <EditorialHero {...props} />;
    case "gallery":
      return <GalleryHero {...props} />;
    case "compact":
      return <CompactHero {...props} />;
    case "split":
      return <SplitHero {...props} />;
    default:
      return <FullBleedHero {...props} />;
  }
}
