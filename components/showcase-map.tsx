"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";

export interface MapListing {
  id: string;
  lat: number;
  lng: number;
  price: number;
  purpose: string;
  refCode: string;
}

function shortMoney(n: number) {
  if (n >= 1_000_000)
    return `₺${(n / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}M`;
  return `₺${(n / 1_000).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}B`;
}

/**
 * Vitrin haritası. mode="browse": tüm ilanlar fiyat plakasıyla, tıkla → detay.
 * mode="single": tek ilanın konumu (detay sayfası mini haritası).
 */
export function ShowcaseMap({
  listings,
  slug,
  mode = "browse",
  height = 340,
}: {
  listings: MapListing[];
  slug: string;
  mode?: "browse" | "single";
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!ref.current || listings.length === 0) return;
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;

      const single = mode === "single";
      map = L.map(ref.current, {
        scrollWheelZoom: false,
        dragging: !single,
        zoomControl: !single,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);

      const bounds = L.latLngBounds([]);
      for (const l of listings) {
        const label = single
          ? l.refCode
          : `${shortMoney(l.price)}${l.purpose === "RENT" ? "/ay" : ""}`;
        const icon = L.divIcon({
          className: "",
          html: `<div class="fiyat-pin${l.purpose === "RENT" ? " fiyat-pin-kira" : ""}">${label}</div>`,
          iconAnchor: [30, 34],
        });
        const m = L.marker([l.lat, l.lng], { icon }).addTo(map);
        if (!single) {
          m.on("click", () => router.push(`/ofis/${slug}/ilan/${l.id}`));
        }
        bounds.extend([l.lat, l.lng]);
      }

      if (single) map.setView([listings[0].lat, listings[0].lng], 14);
      else map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [listings, slug, mode, router]);

  if (listings.length === 0) return null;

  return (
    <div
      ref={ref}
      style={{ height }}
      className="z-0 w-full overflow-hidden rounded-[10px] border border-ink"
      aria-label="İlan haritası"
    />
  );
}
