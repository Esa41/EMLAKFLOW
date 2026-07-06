"use client";

import { useEffect, useRef, useState } from "react";
import { ShowcaseMap } from "@/components/showcase-map";
import { ATLAS_DEMO_LISTINGS } from "@/lib/landing-demo-listings";

/**
 * Landing hero — Atlas Gayrimenkul vitrininden örnek harita görünümü.
 * Tarayıcı mockup'ının sağ panelinde gerçek Mapbox haritası + fiyat plakaları.
 */
export function LandingHeroMap() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(340);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const sync = () => setHeight(Math.max(el.clientHeight, 280));
    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0 min-h-[280px] sm:min-h-[340px]">
      <ShowcaseMap
        listings={ATLAS_DEMO_LISTINGS}
        slug="atlas-gayrimenkul"
        height={height}
        interactive={false}
        flat
      />

      <div className="landing-float-b pointer-events-none absolute bottom-4 right-4 z-10 max-w-[200px] rounded-xl border border-ink/10 bg-white p-3 shadow-lg">
        <p className="font-mono text-[9px] uppercase tracking-wider text-brand-600">
          Yeni lead
        </p>
        <p className="mt-1 text-xs font-semibold text-ink">Ayşe Y. — 3+1 arıyor</p>
        <p className="mt-0.5 text-[10px] text-ink/50">Vitrin formu · az önce</p>
      </div>
    </div>
  );
}
