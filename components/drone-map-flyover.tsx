"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

const STYLES = {
  street: "mapbox://styles/mapbox/light-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
} as const;

type StyleMode = keyof typeof STYLES;

/**
 * DroneMapFlyover – Mapbox GL JS ile 3D bina katmanlı sinematik kamera uçuşu.
 * İlanın koordinatları etrafında otomatik dönen bir "sanal drone" deneyimi sunar.
 * Sokak (3D bina) ve Uydu görünümü arasında geçiş yapılabilir.
 * NEXT_PUBLIC_MAPBOX_TOKEN ortam değişkeni zorunludur (yoksa harita render edilmez).
 */
export function DroneMapFlyover({
  lat,
  lng,
  parcelGeo,
  height = 400,
  interactive = true,
}: {
  lat: number;
  lng: number;
  parcelGeo?: unknown; // GeoJSON Polygon geometry ({type:"Polygon",coordinates})
  height?: number;
  interactive?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const animRef = useRef<number>(0);
  const [isFlying, setIsFlying] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tokenMissing, setTokenMissing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [styleMode, setStyleMode] = useState<StyleMode>("satellite");

  // 3D bina katmanı + parlayan konum işaretçisi — her stil değişiminde yeniden eklenir
  const addLayers = useCallback(
    (map: mapboxgl.Map) => {
      const layers = map.getStyle()?.layers;
      let labelLayerId: string | undefined;
      if (layers) {
        for (const layer of layers) {
          if (
            layer.type === "symbol" &&
            (layer.layout as Record<string, unknown>)?.["text-field"]
          ) {
            labelLayerId = layer.id;
            break;
          }
        }
      }

      if (!map.getLayer("3d-buildings")) {
        map.addLayer(
          {
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 14,
            paint: {
              "fill-extrusion-color": [
                "interpolate",
                ["linear"],
                ["get", "height"],
                0,
                "#e8e0d8",
                50,
                "#b8a99a",
                200,
                "#8a7b6d",
              ],
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                14,
                0,
                14.5,
                ["get", "height"],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                14,
                0,
                14.5,
                ["get", "min_height"],
              ],
              "fill-extrusion-opacity": 0.85,
            },
          },
          labelLayerId,
        );
      }

      if (!map.getSource("listing-point")) {
        map.addSource("listing-point", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "Point", coordinates: [lng, lat] },
            properties: {},
          },
        });
      }
      if (!map.getLayer("listing-pulse-outer")) {
        map.addLayer({
          id: "listing-pulse-outer",
          type: "circle",
          source: "listing-point",
          paint: {
            "circle-radius": 22,
            "circle-color": "#3b55e6",
            "circle-opacity": 0.15,
            "circle-stroke-width": 0,
          },
        });
      }
      if (!map.getLayer("listing-pulse-inner")) {
        map.addLayer({
          id: "listing-pulse-inner",
          type: "circle",
          source: "listing-point",
          paint: {
            "circle-radius": 8,
            "circle-color": "#3b55e6",
            "circle-opacity": 0.9,
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#ffffff",
          },
        });
      }

      // İşaretlenen alan sınırı (arsa/tarla) — dolgu + çizgi
      if (parcelGeo && !map.getSource("parcel")) {
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
          paint: { "fill-color": "#3b55e6", "fill-opacity": 0.28 },
        });
        map.addLayer({
          id: "parcel-line",
          type: "line",
          source: "parcel",
          paint: { "line-color": "#3b55e6", "line-width": 3 },
        });
      }
    },
    [lat, lng, parcelGeo],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setTokenMissing(true);
      return;
    }

    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !containerRef.current) return;

      mapboxgl.accessToken = token;

      let map: mapboxgl.Map;
      try {
        map = new mapboxgl.Map({
          container: containerRef.current,
          style: STYLES[styleMode],
          center: [lng, lat],
          zoom: 15.5,
          pitch: 62,
          bearing: -20,
          antialias: true,
          interactive,
        });
      } catch {
        // WebGL yok / token reddi → 3D görünüm yerine fallback
        setFailed(true);
        return;
      }
      map.on("error", () => setFailed(true));

      mapRef.current = map;

      map.on("load", () => {
        if (cancelled) return;
        addLayers(map);
        setMapLoaded(true);

        // Sinematik drone uçuşu — kamera bina etrafında döner
        let bearing = -20;
        const speed = 0.15; // derece/frame

        function rotateCam() {
          if (cancelled) return;
          bearing += speed;
          map.rotateTo(bearing % 360, { duration: 0 });
          animRef.current = requestAnimationFrame(rotateCam);
        }

        animRef.current = requestAnimationFrame(rotateCam);
      });
    })();

    return () => {
      cancelled = true;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, interactive]);

  function toggleStyle() {
    const next: StyleMode = styleMode === "satellite" ? "street" : "satellite";
    setStyleMode(next);
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(STYLES[next]);
    map.once("style.load", () => addLayers(map));
  }

  const toggleFlight = () => {
    if (isFlying) {
      cancelAnimationFrame(animRef.current);
      animRef.current = 0;
    } else {
      const map = mapRef.current;
      if (map) {
        let bearing = map.getBearing();
        function rotateCam() {
          bearing += 0.15;
          map!.rotateTo(bearing % 360, { duration: 0 });
          animRef.current = requestAnimationFrame(rotateCam);
        }
        animRef.current = requestAnimationFrame(rotateCam);
      }
    }
    setIsFlying(!isFlying);
  };

  if (tokenMissing || failed) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-1 rounded-[12px] border border-dashed border-ink/25 bg-ink/[0.03] px-4 text-center text-xs text-ink/45"
        style={{ height }}
      >
        <span>3D görünüm şu an açılamadı.</span>
        <span className="text-[10px] text-ink/35">
          {tokenMissing
            ? "Mapbox token tanımlı değil (NEXT_PUBLIC_MAPBOX_TOKEN)."
            : "Tarayıcınızda donanım hızlandırma (WebGL) kapalı olabilir."}
        </span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[12px] border border-ink/15">
      <div ref={containerRef} style={{ height }} className="w-full" />

      {/* Drone kontrol butonları */}
      {mapLoaded && (
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            onClick={toggleStyle}
            className="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink/80 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl"
            title="Görünümü değiştir"
          >
            {styleMode === "satellite" ? "🛰️ Uydu" : "🗺️ Sokak"}
          </button>
          <button
            onClick={toggleFlight}
            className="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink/80 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl"
            title={isFlying ? "Durdur" : "Uçuşa devam"}
          >
            {isFlying ? (
              <>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
                Durdur
              </>
            ) : (
              <>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                Uçuşa Devam
              </>
            )}
          </button>
          <button
            onClick={() => {
              mapRef.current?.flyTo({
                center: [lng, lat],
                zoom: 15.5,
                pitch: 62,
                bearing: -20,
                duration: 2000,
              });
            }}
            className="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink/80 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl"
            title="Başa dön"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Sıfırla
          </button>
        </div>
      )}

      {/* Drone etiketi */}
      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M12 8v4l3 3" />
        </svg>
        3D Drone Görünümü
      </div>
    </div>
  );
}
