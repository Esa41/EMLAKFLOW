"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type mapboxgl from "mapbox-gl";
import { ArrowRight, ChevronDown, ChevronRight, Sparkles, Zap } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  applyEmlakflowMapTheme,
  getMapboxStyleUrl,
  tintMutedLayers,
} from "@/lib/mapbox-style";

/**
 * Scrub hero: 350vh'lik ray boyunca sayfa kaydırıldıkça Mapbox kamerası
 * Kocaeli'nin üstünden mahalleye süzülür, tipografi faz faz değişir,
 * sonda sahne bir karta büzülüp sonraki bölüme yol verir.
 * Scroll doğrudan kamerayı sürer (video scrub hissi) — otomatik oynatma yok.
 */

const HERO_PINS: Array<{ lng: number; lat: number; label: string; rent?: boolean }> = [
  { lng: 29.9187, lat: 40.7654, label: "₺4.2M" },
  { lng: 29.936, lat: 40.712, label: "₺6.5M" },
  { lng: 30.013, lat: 40.747, label: "₺3.1M" },
  { lng: 29.817, lat: 40.717, label: "₺2.8M" },
  { lng: 29.831, lat: 40.7565, label: "₺18K/ay", rent: true },
  { lng: 29.958, lat: 40.7735, label: "₺28K/ay", rent: true },
  { lng: 29.887, lat: 40.735, label: "₺5.9M" },
];

// Kamera rayı: körfezin üstünden İzmit'e dalış
const CAM = {
  from: { lng: 29.72, lat: 40.72, zoom: 9.8, pitch: 5, bearing: -30 },
  to: { lng: 29.928, lat: 40.756, zoom: 12.4, pitch: 55, bearing: 15 },
};

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** p'yi [a,b] aralığında 0→1'e oturtur */
const ramp = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1);

function setFx(el: HTMLElement | null, opacity: number, y: number) {
  if (!el) return;
  el.style.opacity = String(opacity);
  el.style.transform = `translateY(${y}px)`;
  el.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
}

export function ScrubHero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const phaseARef = useRef<HTMLDivElement>(null);
  const phaseBRef = useRef<HTMLDivElement>(null);
  const phaseCRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLAnchorElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);

  // Harita kurulumu
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapDivRef.current || !token) return;

    let cancelled = false;
    let map: mapboxgl.Map | null = null;

    (async () => {
      const gl = (await import("mapbox-gl")).default;
      if (cancelled || !mapDivRef.current) return;

      gl.accessToken = token;
      try {
        map = new gl.Map({
          container: mapDivRef.current,
          style: getMapboxStyleUrl(),
          center: [CAM.from.lng, CAM.from.lat],
          zoom: CAM.from.zoom,
          pitch: CAM.from.pitch,
          bearing: CAM.from.bearing,
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

        HERO_PINS.forEach((p, i) => {
          // Marker konumu dış elemanın transform'una yazılır — animasyon içte
          const wrap = document.createElement("div");
          const el = document.createElement("div");
          el.className = `fiyat-pin landing-pin-drop${p.rent ? " fiyat-pin-kira" : ""}`;
          el.style.animationDelay = `${400 + i * 160}ms`;
          el.textContent = p.label;
          wrap.appendChild(el);
          new gl.Marker({ element: wrap, anchor: "bottom" })
            .setLngLat([p.lng, p.lat])
            .addTo(map!);
        });
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current = null;
      map?.remove();
    };
  }, []);

  // Scroll scrub
  useEffect(() => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(isReduced);

    if (isReduced) {
      // Sabit sahne: giriş fazı görünür, kamera bitiş karesinde
      setFx(phaseARef.current, 1, 0);
      setFx(phaseBRef.current, 0, 0);
      setFx(phaseCRef.current, 0, 0);
      return;
    }

    let raf = 0;
    let lastP = -1;

    const update = () => {
      raf = 0;
      const wrap = wrapRef.current;
      const sticky = stickyRef.current;
      if (!wrap || !sticky) return;

      const vh = window.innerHeight;
      const rect = wrap.getBoundingClientRect();
      const p = clamp(-rect.top / (rect.height - vh), 0, 1);
      if (p === lastP) return;
      lastP = p;

      // Kamera — scroll'un kendisi oynatıcıdır
      const m = mapRef.current;
      if (m) {
        const t = easeInOut(p);
        m.jumpTo({
          center: [lerp(CAM.from.lng, CAM.to.lng, t), lerp(CAM.from.lat, CAM.to.lat, t)],
          zoom: lerp(CAM.from.zoom, CAM.to.zoom, t),
          pitch: lerp(CAM.from.pitch, CAM.to.pitch, easeInOut(ramp(p, 0.25, 0.9))),
          bearing: lerp(CAM.from.bearing, CAM.to.bearing, t),
        });
      }

      // Faz A: manifesto (0 → 0.28'de yukarı süzülüp kaybolur)
      const aOut = ramp(p, 0.08, 0.28);
      setFx(phaseARef.current, 1 - aOut, -56 * aOut);

      // Faz B: vitrin hikâyesi (0.3'te girer, 0.62'de çıkar)
      const bIn = ramp(p, 0.3, 0.42);
      const bOut = ramp(p, 0.62, 0.76);
      setFx(phaseBRef.current, bIn - bOut, 48 * (1 - bIn) - 56 * bOut);

      // Faz C: sistem devrede (0.76'da girer, sonda kalır)
      const cIn = ramp(p, 0.76, 0.9);
      setFx(phaseCRef.current, cIn, 48 * (1 - cIn));

      // Scrim: metin uzaklaştıkça harita nefes alsın
      if (scrimRef.current) {
        scrimRef.current.style.opacity = String(1 - 0.55 * ramp(p, 0.15, 0.5));
      }

      // Kaydırma ipucu + ilerleme çizgisi
      if (cueRef.current) cueRef.current.style.opacity = String(1 - ramp(p, 0.02, 0.1));
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`;

      // Final: sahne karta büzülür, sonraki bölüm üstüne akar
      const shrink = easeInOut(ramp(p, 0.9, 1));
      sticky.style.transform = `scale(${1 - 0.045 * shrink})`;
      sticky.style.borderRadius = `${32 * shrink}px`;
      sticky.style.boxShadow = shrink > 0
        ? `0 ${40 * shrink}px ${90 * shrink}px -30px rgba(23,32,28,${0.4 * shrink})`
        : "none";
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative" style={{ height: reduced ? "100svh" : "350vh" }}>
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen overflow-hidden will-change-transform"
      >
        {/* Harita / fallback zemin */}
        <div className="absolute inset-0 bg-[#e8ebe4]" aria-hidden>
          <div className="landing-hero-grid absolute inset-0 opacity-60" />
        </div>
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
          aria-hidden
        >
          <div ref={mapDivRef} className="h-full w-full" />
        </div>

        {/* Okunabilirlik scrimi */}
        <div ref={scrimRef} className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-b from-paper/70 via-transparent to-paper/80" />
          <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-paper via-paper/50 to-transparent lg:w-[70%]" />
        </div>

        {/* ── Faz A: manifesto ── */}
        <div
          ref={phaseARef}
          className="absolute inset-0 flex items-center will-change-transform"
        >
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-white/70 px-4 py-1.5 text-sm font-medium text-brand-700 backdrop-blur">
                <Sparkles size={14} className="text-brand-600" />
                Yeni nesil emlak ofisi platformu
              </div>
              <h1 className="mt-6 font-display text-[clamp(2.75rem,7.5vw,5.5rem)] font-extrabold leading-[1.02] tracking-tight">
                İlan sizden,
                <br />
                <span className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 bg-clip-text text-transparent">
                  gerisi EmlakFlow&apos;dan.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/65 sm:text-xl">
                Harita vitrini, müşteri takibi, satış hattı ve kazanç — hepsi
                tek akıcı panelde. Kaydırın, ofisinizin nasıl aktığını görün.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand-600 px-7 py-3.5 text-base font-bold text-white shadow-[0_8px_28px_-6px_rgba(30,91,62,0.45)] transition-all hover:bg-brand-700"
                >
                  14 gün ücretsiz dene
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/ofis/atlas-gayrimenkul"
                  className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-ink/12 bg-white/90 px-7 py-3.5 text-base font-bold text-ink backdrop-blur transition-all hover:bg-white"
                >
                  Canlı vitrini gez
                  <ChevronRight size={18} />
                </Link>
              </div>
              <p className="mt-4 text-sm text-ink/50">
                Kredi kartı gerekmez · 5 dakikada kurulum
              </p>
            </div>
          </div>
        </div>

        {/* ── Faz B: vitrin hikâyesi ── */}
        <div
          ref={phaseBRef}
          className="absolute inset-0 flex items-center opacity-0 will-change-transform"
        >
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
            <div className="max-w-xl">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-600">
                Harita vitrini
              </p>
              <h2 className="mt-4 font-display text-[clamp(2.25rem,5.5vw,4.25rem)] font-extrabold leading-[1.04] tracking-tight">
                Portföyünüz haritada,
                <br />
                müşteriniz evinde.
              </h2>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-ink/65">
                Fiyat etiketleri, zengin detaylar, gerçek konum — müşteriniz
                vitrini gezer, her tık sizin için veriye dönüşür.
              </p>
            </div>
          </div>
        </div>

        {/* ── Faz C: harita sahnede, ürün kartları eşlik eder ── */}
        <div
          ref={phaseCRef}
          className="absolute inset-0 opacity-0 will-change-transform"
        >
          {/* Yüzen ürün kartları */}
          <div className="pointer-events-none absolute bottom-24 right-6 hidden w-[240px] flex-col gap-3 sm:flex lg:right-14">
            <div className="landing-float-b rounded-2xl border border-ink/10 bg-white/95 p-4 shadow-[0_20px_50px_-16px_rgba(23,32,28,0.35)] backdrop-blur">
              <p className="font-mono text-[9px] uppercase tracking-wider text-brand-600">
                ● Canlı — yeni lead
              </p>
              <p className="mt-1.5 text-sm font-semibold text-ink">Ayşe Y. — 3+1 arıyor</p>
              <p className="mt-0.5 text-[11px] text-ink/50">Vitrin formu · az önce</p>
            </div>
            <div className="landing-float-a rounded-2xl border border-ink/10 bg-white/95 p-4 shadow-[0_20px_50px_-16px_rgba(23,32,28,0.35)] backdrop-blur">
              <p className="font-mono text-[9px] uppercase tracking-wider text-ink/40">Eşleşme</p>
              <p className="font-display text-2xl font-extrabold text-brand-600">94</p>
              <p className="text-[11px] text-ink/50">3+1 talep ↔ yeni ilan</p>
            </div>
            <div className="landing-float-c rounded-2xl bg-ink p-4 text-white shadow-[0_20px_50px_-16px_rgba(23,32,28,0.5)]">
              <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-white/50">
                <Zap size={11} /> Kazanç
              </p>
              <p className="font-display text-xl font-extrabold">₺145.000</p>
              <p className="text-[11px] text-white/60">Payınız otomatik hesaplandı</p>
            </div>
          </div>
        </div>

        {/* Kaydırma ipucu + ilerleme çizgisi */}
        <a
          ref={cueRef}
          href="#yolculuk"
          className="absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-ink/45 transition-colors hover:text-ink"
          aria-label="Aşağı kaydır"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Kaydır</span>
          <ChevronDown size={20} className="animate-bounce" />
        </a>
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-ink/5" aria-hidden>
          <div
            ref={progressRef}
            className="h-full origin-left bg-brand-600"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>
    </div>
  );
}
