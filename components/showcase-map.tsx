"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "mapbox-gl/dist/mapbox-gl.css";
import { applyEmlakflowMapTheme, getMapboxStyleUrl } from "@/lib/mapbox-style";

export interface MapListing {
  id: string;
  lat: number;
  lng: number;
  price: number;
  purpose: string;
  // Browse modunda pin'e tıklayınca açılan önizleme kartı için (opsiyonel)
  title?: string;
  image?: string | null;
  rooms?: string | null;
  area?: number | null;
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );
}

function shortMoney(n: number) {
  if (n >= 1_000_000)
    return `₺${(n / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}M`;
  return `₺${(n / 1_000).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}B`;
}

/**
 * Vitrin haritası (Mapbox GL). mode="browse": tüm ilanlar fiyat plakasıyla,
 * tıkla → detay, ilk yüklemede tüm noktalara şık bir uçuşla (flyTo/fitBounds)
 * odaklanır. mode="single": tek ilanın konumu (detay sayfası mini haritası).
 */
export function ShowcaseMap({
  listings,
  slug,
  mode = "browse",
  height = 480,
  parcelGeo,
  highlightedId,
  onPinClick,
}: {
  listings: MapListing[];
  slug: string;
  mode?: "browse" | "single";
  height?: number;
  parcelGeo?: unknown; // tek ilan modunda çizilen alan sınırı
  highlightedId?: string | null; // split view: vurgulanan ilan
  onPinClick?: (listingId: string) => void; // split view: pin tıklanma callbackı
}) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ref.current || listings.length === 0) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    let map: mapboxgl.Map | null = null;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !ref.current) return;

      mapboxgl.accessToken = token;
      const single = mode === "single";

      try {
        map = new mapboxgl.Map({
          container: ref.current,
          style: getMapboxStyleUrl(),
          center: [listings[0].lng, listings[0].lat],
          zoom: single ? 14 : 11,
          pitch: single ? 0 : 28,
          bearing: single ? 0 : -8,
          dragPan: !single,
          scrollZoom: !single,
          cooperativeGestures: !single,
          doubleClickZoom: !single,
          boxZoom: false,
          interactive: !single,
          attributionControl: false,
        });
      } catch {
        // WebGL yok / token reddi → harita yerine fallback göster
        setFailed(true);
        return;
      }
      // Token geçersiz / stil yüklenemedi gibi runtime hataları
      map.on("error", () => setFailed(true));

      if (!single) {
        map.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          "top-right",
        );
      }
      map.addControl(new mapboxgl.AttributionControl({ compact: true }));

      map.on("load", () => {
        if (cancelled || !map) return;

        applyEmlakflowMapTheme(map);

        const bounds = new mapboxgl.LngLatBounds();
        for (const l of listings) {
          bounds.extend([l.lng, l.lat]);

          if (single) {
            new mapboxgl.Marker({ color: "#1e5b3e" })
              .setLngLat([l.lng, l.lat])
              .addTo(map);
            continue;
          }

          const el = document.createElement("div");
          el.className = `fiyat-pin${l.purpose === "RENT" ? " fiyat-pin-kira" : ""}`;
          el.dataset.listingId = l.id;
          el.style.cursor = "pointer";
          el.textContent = `${shortMoney(l.price)}${l.purpose === "RENT" ? "/ay" : ""}`;

          el.addEventListener("mouseenter", () => el.classList.add("fiyat-pin-active"));
          el.addEventListener("mouseleave", () => el.classList.remove("fiyat-pin-active"));
          el.addEventListener("click", () => {
            document
              .querySelectorAll(".fiyat-pin-active-select")
              .forEach((n) => n.classList.remove("fiyat-pin-active-select"));
            el.classList.add("fiyat-pin-active-select");
            onPinClick?.(l.id);
          });

          // Pin'e tıklayınca önizleme kartı (foto + başlık + oda/m² + İncele)
          const specs = [l.rooms, l.area ? `${l.area} m²` : null]
            .filter(Boolean)
            .join(" · ");
          const href = `/ofis/${slug}/ilan/${l.id}`;
          const popupHtml = `
            <a href="${href}" class="ef-map-card" style="display:block;width:200px;text-decoration:none;color:inherit">
              ${
                l.image
                  ? `<img src="${esc(l.image)}" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:8px 8px 0 0"/>`
                  : ""
              }
              <div style="padding:8px 10px 10px">
                <div style="font-weight:700;font-size:13px;line-height:1.25;margin-bottom:2px">${esc(
                  l.title ?? "İlan",
                )}</div>
                ${specs ? `<div style="font-size:11px;color:#667">${esc(specs)}</div>` : ""}
                <div style="font-weight:800;font-size:15px;margin-top:4px">${shortMoney(
                  l.price,
                )}${l.purpose === "RENT" ? "<span style='font-size:11px;font-weight:500;color:#889'>/ay</span>" : ""}</div>
                <div style="margin-top:6px;font-size:11px;font-weight:700;color:#1e5b3e">İncele →</div>
              </div>
            </a>`;

          const popup = new mapboxgl.Popup({
            offset: 24,
            closeButton: true,
            maxWidth: "220px",
          }).setHTML(popupHtml);

          const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
            .setLngLat([l.lng, l.lat])
            .setPopup(popup)
            .addTo(map);

          // Kartın herhangi bir yerine tıklama → detaya git (SPA gezinme)
          popup.on("open", () => {
            popup
              .getElement()
              ?.querySelector<HTMLAnchorElement>(".ef-map-card")
              ?.addEventListener("click", (ev) => {
                ev.preventDefault();
                router.push(href);
              });
          });
          void marker;
        }

        // Tek ilan modunda çizilen alan sınırı (arsa/tarla)
        if (single && parcelGeo && !map.getSource("parcel")) {
          map.addSource("parcel", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: parcelGeo as GeoJSON.Geometry,
            },
          });
          map.addLayer({
            id: "parcel-fill",
            type: "fill",
            source: "parcel",
            paint: { "fill-color": "#1e5b3e", "fill-opacity": 0.25 },
          });
          map.addLayer({
            id: "parcel-line",
            type: "line",
            source: "parcel",
            paint: { "line-color": "#1e5b3e", "line-width": 2.5 },
          });
        }

        if (single) {
          map.jumpTo({ center: [listings[0].lng, listings[0].lat], zoom: 14 });
        } else if (listings.length > 1) {
          map.fitBounds(bounds, {
            padding: 56,
            maxZoom: 14,
            duration: 1400,
            pitch: 28,
            bearing: -8,
          });
        } else {
          map.flyTo({
            center: [listings[0].lng, listings[0].lat],
            zoom: 14,
            duration: 1200,
          });
        }
      });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [listings, slug, mode, router, parcelGeo, onPinClick]);

  // Dışarıdan gelen highlight değişikliklerini uygula (split view hover)
  useEffect(() => {
    if (!ref.current) return;
    const pins = ref.current.querySelectorAll<HTMLElement>(".fiyat-pin");
    pins.forEach((pin) => {
      if (pin.dataset.listingId === highlightedId) {
        pin.classList.add("fiyat-pin-active");
      } else {
        pin.classList.remove("fiyat-pin-active");
      }
    });
  }, [highlightedId]);

  if (listings.length === 0) return null;

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN || failed) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-ink/25 bg-ink/[0.03] px-4 text-center text-xs text-ink/45"
      >
        <span>Harita şu an görüntülenemiyor.</span>
        <span className="text-[10px] text-ink/35">
          Tarayıcınızda donanım hızlandırma (WebGL) kapalı olabilir.
        </span>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={{ height }}
      className="z-0 w-full overflow-hidden rounded-2xl border border-ink/15 shadow-lg ring-1 ring-ink/5"
      aria-label="İlan haritası"
    />
  );
}
