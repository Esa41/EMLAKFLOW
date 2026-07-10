"use client";

import { useCallback, useEffect, useState } from "react";
import { Maximize2, X, Map } from "lucide-react";
import { AnimatedCounter } from "@/components/animated-counter";
import { ShowcaseMap, type MapListing } from "@/components/showcase-map";

type Stat = { value: string; label: string };

type Props = {
  displayName: string;
  district: string | null;
  eyebrow: string;
  headline: string;
  tagline: string;
  stats: Stat[];
  slug: string;
  mapListings: MapListing[];
};

export function ShowcaseHero({
  displayName,
  district,
  eyebrow,
  headline,
  tagline,
  stats,
  slug,
  mapListings,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [fullscreenH, setFullscreenH] = useState(600);
  const hasMap = mapListings.length > 0;

  const handlePinClick = useCallback(
    (listingId: string) => {
      window.location.href = `/ofis/${slug}/ilan/${listingId}`;
    },
    [slug],
  );

  useEffect(() => {
    if (!expanded) return;
    const update = () => setFullscreenH(window.innerHeight - 88);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const kunyeLabel = [displayName.split(" ")[0]?.toUpperCase(), "VİTRİN", district?.toUpperCase()]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="relative overflow-hidden border-b border-ink">
        <div
          className="pointer-events-none absolute inset-0 opacity-100"
          style={{
            backgroundImage:
              "linear-gradient(rgba(23,32,28,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(23,32,28,0.07) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
            maskImage: "radial-gradient(120% 90% at 70% 0%, #000 40%, transparent 78%)",
          }}
        />
        <div className="relative px-4 sm:px-6">
          <div className="mx-auto grid max-w-[1080px] grid-cols-1 items-center gap-10 py-10 md:grid-cols-[1.15fr_0.85fr] md:gap-10 md:py-14">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">
                {eyebrow}
              </p>
              <h1 className="mt-3.5 font-display text-[38px] font-extrabold leading-[1.02] tracking-tight text-balance sm:text-[52px]">
                {headline}
              </h1>
              <p className="mt-4 max-w-[34ch] text-[17px] leading-snug text-ink/70">
                {tagline}
              </p>
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

            <div className="relative max-md:order-first">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] border border-ink bg-brand-50 shadow-[0_12px_40px_-12px_rgba(23,32,28,0.22)]">
                {hasMap ? (
                  <>
                    <ShowcaseMap
                      listings={mapListings}
                      slug={slug}
                      height={360}
                      onPinClick={handlePinClick}
                    />
                    <button
                      type="button"
                      onClick={() => setExpanded(true)}
                      className="absolute bottom-3.5 right-3.5 z-20 inline-flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white/95 px-3 py-2 text-xs font-bold text-ink shadow-sm backdrop-blur-sm transition hover:border-ink/40 hover:bg-white"
                    >
                      <Maximize2 size={14} />
                      Büyüt
                    </button>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-brand-600/30">
                    <Map size={48} strokeWidth={1.4} />
                    <p className="font-mono text-[10px] uppercase tracking-wider text-ink/35">
                      Konum verisi yok
                    </p>
                  </div>
                )}
                <span className="kunye pointer-events-none absolute bottom-3.5 left-3.5 z-20 text-[10px]">
                  {kunyeLabel}
                </span>
              </div>
            </div>
          </div>

          {stats.length > 0 && (
            <div className="mx-auto grid max-w-[1080px] grid-cols-2 border-t border-ink/15 md:grid-cols-4">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`py-4 text-center ${i > 0 ? "border-l border-ink/10 max-md:[&:nth-child(3)]:border-l-0" : ""}`}
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
          )}
        </div>
      </div>

      {hasMap && (
        <div
          className={`fixed inset-0 z-[60] transition-[visibility,opacity] duration-500 ${
            expanded ? "visible opacity-100" : "invisible opacity-0"
          }`}
          aria-hidden={!expanded}
        >
          <button
            type="button"
            className={`absolute inset-0 bg-ink/50 backdrop-blur-sm transition-opacity duration-500 ${
              expanded ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setExpanded(false)}
            aria-label="Haritayı kapat"
          />
          <div
            className={`absolute inset-0 flex flex-col overflow-hidden bg-paper transition-all duration-500 ease-out sm:inset-4 sm:rounded-2xl sm:border sm:border-ink/20 sm:shadow-2xl ${
              expanded ? "scale-100 opacity-100" : "scale-[0.94] opacity-0"
            }`}
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3 sm:px-5">
              <div>
                <p className="font-display text-base font-extrabold tracking-tight sm:text-lg">
                  Portföy Haritası
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink/45">
                  {mapListings.length} ilan · pin&apos;e dokun
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded-full border border-ink/15 bg-white p-2 text-ink/60 transition hover:border-ink/30 hover:text-ink"
                aria-label="Kapat"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative min-h-0 flex-1">
              {expanded && (
                <ShowcaseMap
                  listings={mapListings}
                  slug={slug}
                  height={fullscreenH}
                  onPinClick={handlePinClick}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
