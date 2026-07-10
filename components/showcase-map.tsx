"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "mapbox-gl/dist/mapbox-gl.css";
import { applyEmlakflowMapTheme, getMapboxStyleUrl } from "@/lib/mapbox-style";

export interface MapListing {
  id: string;
  lat: number;
  lng: number;
  price: number;
  purpose: string;
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

function listingsFingerprint(listings: MapListing[]) {
  return listings
    .map((l) => `${l.id}:${l.lat}:${l.lng}:${l.price}:${l.purpose}`)
    .join("|");
}

/**
 * Vitrin haritası — sabit görünüm, pin tıklayınca detay.
 * Harita yakınlaştırma / hover animasyonu yok.
 */
export function ShowcaseMap({
  listings,
  slug,
  mode = "browse",
  height = 480,
  parcelGeo,
  onPinClick,
  zoomBias = "default",
}: {
  listings: MapListing[];
  slug: string;
  mode?: "browse" | "single";
  height?: number;
  parcelGeo?: unknown;
  onPinClick?: (listingId: string) => void;
  /** close = vitrin kartı / tam ekran için biraz daha yakın */
  zoomBias?: "default" | "close";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onPinClickRef = useRef(onPinClick);
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  const listingsKey = useMemo(() => listingsFingerprint(listings), [listings]);

  useEffect(() => {
    onPinClickRef.current = onPinClick;
  }, [onPinClick]);

  useEffect(() => {
    if (!ref.current || listings.length === 0) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    let cancelled = false;
    let map: mapboxgl.Map | null = null;

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
        setFailed(true);
        return;
      }

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
              .addTo(map!);
            continue;
          }

          const el = document.createElement("div");
          el.className = `fiyat-pin${l.purpose === "RENT" ? " fiyat-pin-kira" : ""}`;
          el.dataset.listingId = l.id;
          el.style.cursor = "pointer";
          el.textContent = `${shortMoney(l.price)}${l.purpose === "RENT" ? "/ay" : ""}`;

          el.addEventListener("click", () => {
            document
              .querySelectorAll(".fiyat-pin-active-select")
              .forEach((n) => n.classList.remove("fiyat-pin-active-select"));
            el.classList.add("fiyat-pin-active-select");
            onPinClickRef.current?.(l.id);
          });

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
            .addTo(map!);

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
            padding: zoomBias === "close" ? 36 : 52,
            maxZoom: zoomBias === "close" ? 13.5 : 12.5,
            duration: 0,
            pitch: zoomBias === "close" ? 34 : 28,
            bearing: zoomBias === "close" ? -5 : -8,
          });
        } else {
          map.jumpTo({
            center: [listings[0].lng, listings[0].lat],
            zoom: zoomBias === "close" ? 14.5 : 14,
          });
        }
      });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [listingsKey, slug, mode, parcelGeo, router, zoomBias]);

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
      className="z-0 h-full w-full overflow-hidden lg:rounded-2xl"
      aria-label="İlan haritası"
    />
  );
}
