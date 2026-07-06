"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

type LngLat = [number, number];

interface GeoResult {
  name: string;
  center: LngLat;
}

/**
 * Harita üzerinde ilan konumu seçici.
 * - "Nokta" modu (daire/dükkan): haritaya tıkla → işaretçi + lat/lng.
 * - "Alan" modu (tarla/arsa): tıklayarak köşe ekle → poligon; merkez lat/lng olur,
 *   sınır GeoJSON olarak parcelGeo'ya yazılır (vitrinde 3D + konumda gösterilir).
 * - Arama kutusu: adres/yer yaz → haritayı oraya götür.
 */
export function LocationPicker({
  lat,
  lng,
  parcelGeo,
  isLand,
  onChange,
  height = 360,
}: {
  lat: string;
  lng: string;
  parcelGeo: string; // JSON string ("" = yok)
  isLand: boolean;
  onChange: (patch: {
    lat?: string;
    lng?: string;
    parcelGeo?: string;
  }) => void;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const mapboxRef = useRef<typeof import("mapbox-gl").default | null>(null);

  const [mode, setMode] = useState<"point" | "area">(isLand ? "area" : "point");
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Poligon köşeleri (alan modu)
  const initialVerts = (() => {
    try {
      const g = parcelGeo ? JSON.parse(parcelGeo) : null;
      const ring = g?.coordinates?.[0];
      if (Array.isArray(ring)) return ring.slice(0, -1) as LngLat[]; // kapanış noktasını at
    } catch {}
    return [] as LngLat[];
  })();
  const vertsRef = useRef<LngLat[]>(initialVerts);
  const [vertCount, setVertCount] = useState(initialVerts.length);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Poligon merkezini hesapla (basit ortalama)
  const centroid = (verts: LngLat[]): LngLat | null => {
    if (verts.length === 0) return null;
    const s = verts.reduce((a, v) => [a[0] + v[0], a[1] + v[1]], [0, 0]);
    return [s[0] / verts.length, s[1] / verts.length];
  };

  // parcel kaynağını güncelle + form değerlerini yaz
  const syncArea = useCallback(() => {
    const map = mapRef.current;
    const verts = vertsRef.current;
    setVertCount(verts.length);

    const ringClosed =
      verts.length >= 3 ? [...verts, verts[0]] : verts;
    const src = map?.getSource("parcel") as mapboxgl.GeoJSONSource | undefined;
    if (src) {
      src.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry:
              verts.length >= 3
                ? { type: "Polygon", coordinates: [ringClosed] }
                : { type: "LineString", coordinates: verts },
          },
          ...verts.map((c, i) => ({
            type: "Feature" as const,
            properties: { i },
            geometry: { type: "Point" as const, coordinates: c },
          })),
        ],
      });
    }

    if (verts.length >= 3) {
      const c = centroid(verts)!;
      onChangeRef.current({
        lat: c[1].toFixed(6),
        lng: c[0].toFixed(6),
        parcelGeo: JSON.stringify({
          type: "Polygon",
          coordinates: [ringClosed],
        }),
      });
    } else {
      onChangeRef.current({ parcelGeo: "" });
    }
  }, []);

  const setPoint = useCallback((lngLat: LngLat) => {
    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;
    if (!map || !mapboxgl) return;
    if (markerRef.current) {
      markerRef.current.setLngLat(lngLat);
    } else {
      markerRef.current = new mapboxgl.Marker({ color: "#1e5b3e", draggable: true })
        .setLngLat(lngLat)
        .addTo(map);
      markerRef.current.on("dragend", () => {
        const p = markerRef.current!.getLngLat();
        onChangeRef.current({ lat: p.lat.toFixed(6), lng: p.lng.toFixed(6) });
      });
    }
    onChangeRef.current({
      lat: lngLat[1].toFixed(6),
      lng: lngLat[0].toFixed(6),
    });
  }, []);

  useEffect(() => {
    if (!ref.current || !token) return;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !ref.current) return;
      mapboxRef.current = mapboxgl;
      mapboxgl.accessToken = token;

      const start: LngLat =
        lng && lat ? [Number(lng), Number(lat)] : [35.2433, 39.0]; // TR merkezi

      let map: mapboxgl.Map;
      try {
        map = new mapboxgl.Map({
          container: ref.current,
          style: "mapbox://styles/mapbox/satellite-streets-v12",
          center: start,
          zoom: lng && lat ? 16 : 5.5,
        });
      } catch {
        setFailed(true);
        return;
      }
      map.on("error", () => setFailed(true));
      mapRef.current = map;

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        if (cancelled) return;

        map.addSource("parcel", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "parcel-fill",
          type: "fill",
          source: "parcel",
          filter: ["==", "$type", "Polygon"],
          paint: { "fill-color": "#3b55e6", "fill-opacity": 0.25 },
        });
        map.addLayer({
          id: "parcel-line",
          type: "line",
          source: "parcel",
          filter: ["!=", "$type", "Point"],
          paint: { "line-color": "#3b55e6", "line-width": 2.5 },
        });
        map.addLayer({
          id: "parcel-vertex",
          type: "circle",
          source: "parcel",
          filter: ["==", "$type", "Point"],
          paint: {
            "circle-radius": 5,
            "circle-color": "#fff",
            "circle-stroke-color": "#3b55e6",
            "circle-stroke-width": 2,
          },
        });

        // Mevcut değerleri çiz
        if (vertsRef.current.length >= 3) syncArea();
        else if (lng && lat) setPoint([Number(lng), Number(lat)]);

        setReady(true);
      });

      map.on("click", (e) => {
        const lngLat: LngLat = [e.lngLat.lng, e.lngLat.lat];
        if (modeRef.current === "area") {
          vertsRef.current = [...vertsRef.current, lngLat];
          syncArea();
        } else {
          setPoint(lngLat);
        }
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Arama (debounce) — Mapbox Geocoding
  useEffect(() => {
    if (!token || search.trim().length < 3) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          search.trim(),
        )}.json?access_token=${token}&country=tr&language=tr&limit=5`;
        const r = await fetch(url);
        const d = await r.json();
        setResults(
          (d.features ?? []).map((f: { place_name: string; center: LngLat }) => ({
            name: f.place_name,
            center: f.center,
          })),
        );
      } catch {
        setResults([]);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [search, token]);

  function goTo(r: GeoResult) {
    setSearch(r.name);
    setResults([]);
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: r.center, zoom: 16, duration: 1200 });
    if (modeRef.current === "point") setPoint(r.center);
  }

  function clearArea() {
    vertsRef.current = [];
    syncArea();
  }
  function undoVertex() {
    vertsRef.current = vertsRef.current.slice(0, -1);
    syncArea();
  }

  if (!token) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-xl border border-dashed border-ink/25 bg-ink/[0.03] px-4 text-center text-xs text-ink/45"
      >
        Harita seçici için Mapbox token tanımlı değil — koordinatı aşağıdan elle
        girebilirsiniz.
      </div>
    );
  }

  if (failed) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink/25 bg-ink/[0.03] px-4 text-center text-xs text-ink/45"
      >
        <span>Harita açılamadı (WebGL kapalı olabilir).</span>
        <span className="text-[10px] text-ink/35">
          Koordinatı aşağıdan elle girebilirsiniz.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Arama + mod seçimi */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Adres / mahalle / yer ara → haritada bul"
            className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
          {results.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-ink/15 bg-white shadow-lg">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => goTo(r)}
                    className="block w-full px-3 py-2 text-left text-xs hover:bg-brand-50"
                  >
                    {r.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-ink/20">
          {(["point", "area"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${
                mode === m
                  ? "bg-brand-600 text-white"
                  : "bg-white text-ink/60 hover:bg-slate-50"
              }`}
            >
              {m === "point" ? "📍 Nokta" : "⬠ Alan çiz"}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={ref}
        style={{ height }}
        className="w-full overflow-hidden rounded-xl border border-ink/15"
      />

      {/* Durum + alan araçları */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/55">
        {mode === "area" ? (
          <>
            <span>
              {vertCount < 3
                ? `Alan için haritaya tıklayarak köşe ekleyin (${vertCount}/3+).`
                : `Alan çizildi — ${vertCount} köşe. Merkez konum otomatik atandı.`}
            </span>
            {vertCount > 0 && (
              <>
                <button
                  type="button"
                  onClick={undoVertex}
                  className="font-semibold text-brand-600 hover:underline"
                >
                  Son köşeyi sil
                </button>
                <button
                  type="button"
                  onClick={clearArea}
                  className="font-semibold text-rose-600 hover:underline"
                >
                  Alanı temizle
                </button>
              </>
            )}
          </>
        ) : (
          <span>
            {lat && lng
              ? `Konum işaretlendi: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)} — sürükleyerek düzeltebilirsiniz.`
              : "Haritaya tıklayarak ilan konumunu işaretleyin."}
          </span>
        )}
        {!ready && <span className="text-ink/35">Harita yükleniyor…</span>}
      </div>
    </div>
  );
}
