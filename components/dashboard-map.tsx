"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  applyEmlakflowMapTheme,
  getMapboxStyleUrl,
  tintMutedLayers,
} from "@/lib/mapbox-style";

/**
 * Dashboard portföy mini-haritası — landing hero'nun sakin hâli.
 * Aktif ilanlar fiyat plakasıyla düşer, pin tıklanınca portföy detayına gider.
 */

export interface DashMapListing {
  id: string;
  lat: number;
  lng: number;
  price: number;
  purpose: string;
}

function shortMoney(n: number) {
  if (n >= 1_000_000)
    return `₺${(n / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}M`;
  return `₺${(n / 1_000).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}K`;
}

export function DashboardMap({ listings }: { listings: DashMapListing[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const routerRef = useRef(router);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!ref.current || !token || listings.length === 0) return;

    let cancelled = false;
    let map: mapboxgl.Map | null = null;

    (async () => {
      const gl = (await import("mapbox-gl")).default;
      if (cancelled || !ref.current) return;

      gl.accessToken = token;

      const bounds = new gl.LngLatBounds();
      for (const l of listings) bounds.extend([l.lng, l.lat]);

      try {
        map = new gl.Map({
          container: ref.current,
          style: getMapboxStyleUrl(),
          bounds,
          fitBoundsOptions: { padding: 48, maxZoom: 13 },
          pitch: 30,
          bearing: -10,
          interactive: false,
          attributionControl: false,
        });
      } catch {
        return;
      }

      map.addControl(new gl.AttributionControl({ compact: true }), "bottom-left");

      map.on("load", () => {
        if (cancelled || !map) return;
        map.resize();
        applyEmlakflowMapTheme(map);
        tintMutedLayers(map);
        map.once("idle", () => {
          if (!cancelled && map) {
            applyEmlakflowMapTheme(map);
            tintMutedLayers(map);
          }
        });
        setReady(true);

        listings.forEach((l, i) => {
          // Marker konumu dış elemanın transform'una yazılır — animasyon içte
          const wrap = document.createElement("div");
          const el = document.createElement("div");
          el.className = `fiyat-pin landing-pin-drop${l.purpose === "RENT" ? " fiyat-pin-kira" : ""}`;
          el.style.animationDelay = `${200 + i * 90}ms`;
          el.style.fontSize = "10px";
          el.textContent = `${shortMoney(l.price)}${l.purpose === "RENT" ? "/ay" : ""}`;
          el.addEventListener("click", () => routerRef.current.push(`/portfoy/${l.id}`));
          wrap.appendChild(el);
          new gl.Marker({ element: wrap, anchor: "bottom" })
            .setLngLat([l.lng, l.lat])
            .addTo(map!);
        });
      });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
    // Konum parmak izi değişmedikçe haritayı yeniden kurma
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings.map((l) => l.id).join("|")]);

  if (listings.length === 0) {
    return (
      <div className="relative flex h-full min-h-[200px] items-center justify-center overflow-hidden rounded-[16px] bg-[#e8ebe4]">
        <div className="landing-hero-grid absolute inset-0 opacity-60" aria-hidden />
        <p className="relative px-6 text-center text-sm text-ink/50">
          Konumlu ilan yok — ilan formunda haritadan yer seçin, portföyünüz
          burada belirsin.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[200px] overflow-hidden rounded-[16px]">
      <div className={`absolute inset-0 bg-[#e8ebe4] ${ready ? "hidden" : ""}`} aria-hidden>
        <div className="landing-hero-grid absolute inset-0 opacity-60" />
      </div>
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
      >
        <div ref={ref} className="h-full w-full" />
      </div>
    </div>
  );
}
