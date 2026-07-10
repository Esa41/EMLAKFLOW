"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Maximize2, X, Map } from "lucide-react";
import type mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { AnimatedCounter } from "@/components/animated-counter";
import { ShowcaseMap, type MapListing } from "@/components/showcase-map";
import {
  applyEmlakflowMapTheme,
  getMapboxStyleUrl,
  tintMutedLayers,
} from "@/lib/mapbox-style";

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

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const ramp = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1);

function shortMoney(n: number) {
  if (n >= 1_000_000)
    return `₺${(n / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}M`;
  return `₺${(n / 1_000).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}B`;
}

function listingCenter(listings: MapListing[]) {
  const lng = listings.reduce((s, l) => s + l.lng, 0) / listings.length;
  const lat = listings.reduce((s, l) => s + l.lat, 0) / listings.length;
  return { lng, lat };
}

function StaticHero({
  displayName,
  district,
  eyebrow,
  headline,
  tagline,
  stats,
  slug,
  mapListings,
  onExpand,
}: Props & { onExpand: () => void }) {
  const kunyeLabel = [displayName.split(" ")[0]?.toUpperCase(), "VİTRİN", district?.toUpperCase()]
    .filter(Boolean)
    .join(" · ");

  return (
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
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">{eyebrow}</p>
            <h1 className="mt-3.5 font-display text-[38px] font-extrabold leading-[1.02] tracking-tight text-balance sm:text-[52px]">
              {headline}
            </h1>
            <p className="mt-4 max-w-[34ch] text-[17px] leading-snug text-ink/70">{tagline}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#koleksiyon" className="btn-selvi inline-flex items-center rounded-[9px] px-4 py-2.5 text-sm font-bold text-white">
                Portföyü Gör
              </a>
              <a href="#talep-form" className="inline-flex items-center rounded-[9px] border border-ink/15 bg-white px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:border-ink/40">
                Talep Bırak
              </a>
            </div>
          </div>
          <div className="relative max-md:order-first">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] border border-ink bg-brand-50 shadow-[0_12px_40px_-12px_rgba(23,32,28,0.22)]">
              <ShowcaseMap listings={mapListings} slug={slug} height={360} />
              <button
                type="button"
                onClick={onExpand}
                className="absolute bottom-3.5 right-3.5 z-20 inline-flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white/95 px-3 py-2 text-xs font-bold text-ink shadow-sm backdrop-blur-sm transition hover:border-ink/40 hover:bg-white"
              >
                <Maximize2 size={14} />
                Büyüt
              </button>
              <span className="kunye pointer-events-none absolute bottom-3.5 left-3.5 z-20 text-[10px]">{kunyeLabel}</span>
            </div>
          </div>
        </div>
        {stats.length > 0 && (
          <div className="mx-auto grid max-w-[1080px] grid-cols-2 border-t border-ink/15 md:grid-cols-4">
            {stats.map((s, i) => (
              <div key={s.label} className={`py-4 text-center ${i > 0 ? "border-l border-ink/10 max-md:[&:nth-child(3)]:border-l-0" : ""}`}>
                <p className="font-display text-[30px] font-extrabold tracking-tight">
                  <AnimatedCounter value={s.value} />
                </p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink/50">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ShowcaseHero(props: Props) {
  const { slug, mapListings, stats, displayName, district } = props;
  const hasMap = mapListings.length > 0;
  const [expanded, setExpanded] = useState(false);
  const [fullscreenH, setFullscreenH] = useState(600);
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [ready, setReady] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const mapShellRef = useRef<HTMLDivElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const cardAnchorRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const kunyeRef = useRef<HTMLSpanElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const maxProgressRef = useRef(0);
  const latchedRef = useRef(false);

  const introKey = `ef-vitrin-intro-${slug}`;

  const center = useMemo(() => listingCenter(mapListings), [mapListings]);
  /** Scroll sırasında değişmez — yalnızca kabuk küçülür */
  const camFixed = useMemo(
    () => ({
      lng: center.lng - 0.02,
      lat: center.lat - 0.02,
      zoom: 10.8,
      pitch: 28,
      bearing: -12,
    }),
    [center],
  );

  const kunyeLabel = [displayName.split(" ")[0]?.toUpperCase(), "VİTRİN", district?.toUpperCase()]
    .filter(Boolean)
    .join(" · ");

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

  // Mapbox — tek instance, scroll kamerayı sürer
  useEffect(() => {
    if (reduced || !hasMap) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapDivRef.current || !token) return;

    let cancelled = false;
    let map: mapboxgl.Map | null = null;

    const start = async () => {
      const gl = (await import("mapbox-gl")).default;
      if (cancelled || !mapDivRef.current) return;

      gl.accessToken = token;
      try {
        map = new gl.Map({
          container: mapDivRef.current,
          style: getMapboxStyleUrl(),
          center: [camFixed.lng, camFixed.lat],
          zoom: camFixed.zoom,
          pitch: camFixed.pitch,
          bearing: camFixed.bearing,
          interactive: false,
          attributionControl: false,
        });
      } catch {
        return;
      }

      map.addControl(new gl.AttributionControl({ compact: true }), "bottom-left");

      const theme = () => {
        if (cancelled || !map) return;
        applyEmlakflowMapTheme(map);
        tintMutedLayers(map);
      };

      map.on("load", () => {
        if (cancelled || !map) return;
        map.resize();
        theme();
        map.once("idle", theme);
        mapRef.current = map;
        setReady(true);

        for (const l of mapListings) {
          const el = document.createElement("div");
          el.className = `fiyat-pin${l.purpose === "RENT" ? " fiyat-pin-kira" : ""}`;
          el.style.cursor = "pointer";
          el.textContent = `${shortMoney(l.price)}${l.purpose === "RENT" ? "/ay" : ""}`;
          el.addEventListener("click", () => handlePinClick(l.id));
          new gl.Marker({ element: el, anchor: "bottom" })
            .setLngLat([l.lng, l.lat])
            .addTo(map!);
        }
      });
    };

    void start();
    return () => {
      cancelled = true;
      mapRef.current = null;
      map?.remove();
    };
  }, [reduced, hasMap, camFixed, mapListings, handlePinClick]);

  // Scroll scrub — tek yönlü: aşağı kaydırınca bir kez küçülür, yukarıda küçük kalır
  useEffect(() => {
    if (reduced || !hasMap) return;

    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(introKey) === "1") {
      maxProgressRef.current = 1;
      latchedRef.current = true;
    }

    let raf = 0;

    const measureCard = () => {
      const sticky = stickyRef.current;
      const anchor = cardAnchorRef.current;
      if (!sticky || !anchor) return null;
      const s = sticky.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      return {
        top: a.top - s.top,
        left: a.left - s.left,
        width: a.width,
        height: a.height,
      };
    };

    const applyProgress = (p: number) => {
      const shell = mapShellRef.current;
      const t = easeInOut(p);
      const card = measureCard();
      const vh = window.innerHeight;

      if (shell && card) {
        shell.style.top = `${lerp(0, card.top, t)}px`;
        shell.style.left = `${lerp(0, card.left, t)}px`;
        shell.style.width = `${lerp(window.innerWidth, card.width, t)}px`;
        shell.style.height = `${lerp(vh, card.height, t)}px`;
        shell.style.borderRadius = `${lerp(0, 14, t)}px`;
        shell.style.boxShadow =
          t > 0.55
            ? `0 ${12 * t}px ${40 * t}px -12px rgba(23,32,28,${0.22 * t})`
            : "none";
        shell.style.borderWidth = t > 0.7 ? "1px" : "0";
      }

      const m = mapRef.current;
      if (m && t > 0.08) m.resize();

      const textIn = ramp(p, 0.42, 0.72);
      if (textRef.current) {
        textRef.current.style.opacity = String(textIn);
        textRef.current.style.transform = `translateY(${lerp(28, 0, textIn)}px)`;
        textRef.current.style.pointerEvents = textIn > 0.6 ? "auto" : "none";
      }

      const statsIn = ramp(p, 0.78, 0.98);
      if (statsRef.current) {
        statsRef.current.style.opacity = String(statsIn);
        statsRef.current.style.transform = `translateY(${lerp(16, 0, statsIn)}px)`;
      }

      if (scrimRef.current) {
        scrimRef.current.style.opacity = String(1 - 0.65 * ramp(p, 0.1, 0.55));
      }

      if (cueRef.current) {
        cueRef.current.style.opacity = latchedRef.current ? "0" : String(1 - ramp(p, 0.02, 0.12));
        cueRef.current.style.pointerEvents = "none";
      }

      const chromeIn = ramp(p, 0.72, 0.92);
      if (kunyeRef.current) kunyeRef.current.style.opacity = String(chromeIn);
      if (expandRef.current) {
        expandRef.current.style.opacity = String(chromeIn);
        expandRef.current.style.pointerEvents = chromeIn > 0.5 ? "auto" : "none";
      }
      if (gridRef.current) {
        gridRef.current.style.opacity = String(ramp(p, 0.5, 0.88));
      }
    };

    const update = () => {
      raf = 0;
      const wrap = wrapRef.current;
      if (!wrap) return;

      const vh = window.innerHeight;
      const rect = wrap.getBoundingClientRect();
      const rawP = clamp(-rect.top / Math.max(rect.height - vh, 1), 0, 1);

      // Yalnızca ileri — geri kaydırmada küçük boyutta kalır
      maxProgressRef.current = Math.max(maxProgressRef.current, rawP);
      if (maxProgressRef.current >= 0.92 && !latchedRef.current) {
        latchedRef.current = true;
        try {
          sessionStorage.setItem(introKey, "1");
        } catch {
          /* private mode */
        }
      }

      applyProgress(maxProgressRef.current);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) return;

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced, hasMap, introKey]);

  if (!hasMap || reduced) {
    return (
      <>
        <StaticHero {...props} onExpand={() => setExpanded(true)} />
        {hasMap && expanded && (
          <FullscreenMap
            mapListings={mapListings}
            slug={slug}
            height={fullscreenH}
            onClose={() => setExpanded(false)}
            onPinClick={handlePinClick}
            open={expanded}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div ref={wrapRef} className="relative -mx-4 sm:-mx-6" style={{ height: "200vh" }}>
        <div ref={stickyRef} className="sticky top-0 h-screen overflow-hidden border-b border-ink bg-paper">
          <div
            ref={gridRef}
            className="pointer-events-none absolute inset-0 opacity-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(23,32,28,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(23,32,28,0.07) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
              maskImage: "radial-gradient(120% 90% at 70% 0%, #000 40%, transparent 78%)",
            }}
          />

          {/* Hedef kart ölçüsü */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col px-4 pt-8 sm:px-6 md:inset-0 md:items-center md:justify-center md:pt-0">
            <div className="mx-auto grid w-full max-w-[1080px] grid-cols-1 md:grid-cols-[1.15fr_0.85fr] md:items-center md:gap-10">
              <div className="hidden md:block" />
              <div ref={cardAnchorRef} className="mx-auto aspect-[4/3] w-full max-w-lg md:max-w-none" />
            </div>
          </div>

          {/* Harita — scroll ile küçülür */}
          <div
            ref={mapShellRef}
            className="absolute z-10 overflow-hidden border-ink bg-brand-50 will-change-[transform,width,height,top,left]"
            style={{ top: 0, left: 0, width: "100%", height: "100%" }}
          >
            <div
              className={`h-full w-full transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
            >
              <div ref={mapDivRef} className="h-full w-full" />
            </div>
            <span
              ref={kunyeRef}
              className="kunye pointer-events-none absolute bottom-3.5 left-3.5 z-20 text-[10px] opacity-0"
            >
              {kunyeLabel}
            </span>
            <button
              ref={expandRef}
              type="button"
              onClick={() => setExpanded(true)}
              className="absolute bottom-3.5 right-3.5 z-20 inline-flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white/95 px-3 py-2 text-xs font-bold text-ink opacity-0 shadow-sm backdrop-blur-sm transition hover:border-ink/40 hover:bg-white"
            >
              <Maximize2 size={14} />
              Büyüt
            </button>
          </div>

          <div ref={scrimRef} className="pointer-events-none absolute inset-0 z-20" aria-hidden>
            <div className="absolute inset-0 bg-gradient-to-b from-paper/75 via-paper/25 to-paper/85" />
            <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-paper via-paper/55 to-transparent md:w-[62%]" />
          </div>

          <div
            ref={textRef}
            className="absolute inset-0 z-30 flex items-end px-4 pb-32 opacity-0 will-change-transform sm:px-6 md:items-center md:pb-0"
          >
            <div className="mx-auto w-full max-w-[1080px]">
              <div className="max-w-xl md:max-w-[48%]">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">{props.eyebrow}</p>
                <h1 className="mt-3.5 font-display text-[38px] font-extrabold leading-[1.02] tracking-tight text-balance sm:text-[52px]">
                  {props.headline}
                </h1>
                <p className="mt-4 max-w-[34ch] text-[17px] leading-snug text-ink/70">{props.tagline}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="#koleksiyon" className="btn-selvi inline-flex items-center rounded-[9px] px-4 py-2.5 text-sm font-bold text-white">
                    Portföyü Gör
                  </a>
                  <a href="#talep-form" className="inline-flex items-center rounded-[9px] border border-ink/15 bg-white px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:border-ink/40">
                    Talep Bırak
                  </a>
                </div>
              </div>
            </div>
          </div>

          {stats.length > 0 && (
            <div
              ref={statsRef}
              className="absolute inset-x-0 bottom-0 z-30 border-t border-ink/15 bg-paper/90 px-4 opacity-0 backdrop-blur-sm will-change-transform sm:px-6"
            >
              <div className="mx-auto grid max-w-[1080px] grid-cols-2 md:grid-cols-4">
                {stats.map((s, i) => (
                  <div key={s.label} className={`py-3.5 text-center ${i > 0 ? "border-l border-ink/10 max-md:[&:nth-child(3)]:border-l-0" : ""}`}>
                    <p className="font-display text-[26px] font-extrabold tracking-tight sm:text-[30px]">
                      <AnimatedCounter value={s.value} />
                    </p>
                    <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink/50">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            ref={cueRef}
            className="absolute bottom-20 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-1 text-ink/45 md:bottom-24"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Kaydır</span>
            <ChevronDown size={20} className="animate-bounce" />
          </div>
        </div>
      </div>

      <FullscreenMap
        mapListings={mapListings}
        slug={slug}
        height={fullscreenH}
        onClose={() => setExpanded(false)}
        onPinClick={handlePinClick}
        open={expanded}
      />
    </>
  );
}

function FullscreenMap({
  mapListings,
  slug,
  height,
  onClose,
  onPinClick,
  open,
}: {
  mapListings: MapListing[];
  slug: string;
  height: number;
  onClose: () => void;
  onPinClick: (id: string) => void;
  open: boolean;
}) {
  return (
    <div
      className={`fixed inset-0 z-[60] transition-[visibility,opacity] duration-500 ${
        open ? "visible opacity-100" : "invisible opacity-0"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-ink/50 backdrop-blur-sm transition-opacity duration-500 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-label="Haritayı kapat"
      />
      <div
        className={`absolute inset-0 flex flex-col overflow-hidden bg-paper transition-all duration-500 ease-out sm:inset-4 sm:rounded-2xl sm:border sm:border-ink/20 sm:shadow-2xl ${
          open ? "scale-100 opacity-100" : "scale-[0.94] opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3 sm:px-5">
          <div>
            <p className="font-display text-base font-extrabold tracking-tight sm:text-lg">Portföy Haritası</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink/45">
              {mapListings.length} ilan · pin&apos;e dokun
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-ink/15 bg-white p-2 text-ink/60 transition hover:border-ink/30 hover:text-ink"
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>
        <div className="relative min-h-0 flex-1">
          {open && (
            <ShowcaseMap listings={mapListings} slug={slug} height={height} onPinClick={onPinClick} zoomBias="close" />
          )}
        </div>
      </div>
    </div>
  );
}
