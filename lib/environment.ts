import type { Listing } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Konum ve Çevre Analizörü — Overpass API (OpenStreetMap) ile mülkün
 * çevresindeki ulaşım, eğitim, sağlık, park ve market noktalarını tarar,
 * mesafe bazlı 0-100 arası "Çevresel Değerlendirme Puanı" hesaplar.
 * Ücretsizdir, API anahtarı gerektirmez.
 */

export interface EnvironmentCategory {
  key: string;
  label: string;
  count: number;
  nearestName: string | null;
  nearestDistance: number | null; // metre
  score: number;
  maxScore: number;
}

export interface EnvironmentResult {
  score: number; // 0-100
  lat: number;
  lng: number;
  analyzedAt: string;
  categories: EnvironmentCategory[];
}

interface OverpassElement {
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// Kategori tanımı: ağırlık + mesafe eşikleri (dFull altı tam puan, dZero üstü 0)
const CATEGORIES = [
  { key: "rail", label: "Raylı Ulaşım (Metro/Tramvay)", max: 25, dFull: 500, dZero: 2000 },
  { key: "bus", label: "Otobüs Durağı", max: 10, dFull: 250, dZero: 1000 },
  { key: "education", label: "Eğitim Kurumları", max: 20, dFull: 800, dZero: 2000 },
  { key: "health", label: "Sağlık Kurumları", max: 20, dFull: 1000, dZero: 2500 },
  { key: "park", label: "Park & Yeşil Alan", max: 15, dFull: 500, dZero: 1500 },
  { key: "market", label: "Market & AVM", max: 10, dFull: 400, dZero: 1200 },
] as const;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function categorize(tags: Record<string, string>): string | null {
  if (
    tags.railway === "station" ||
    tags.railway === "tram_stop" ||
    tags.station === "subway"
  )
    return "rail";
  if (tags.highway === "bus_stop") return "bus";
  if (["school", "university", "college", "kindergarten"].includes(tags.amenity ?? ""))
    return "education";
  if (["hospital", "clinic", "pharmacy", "doctors"].includes(tags.amenity ?? ""))
    return "health";
  if (tags.leisure === "park") return "park";
  if (["supermarket", "convenience", "mall"].includes(tags.shop ?? ""))
    return "market";
  return null;
}

export async function analyzeEnvironment(
  lat: number,
  lng: number,
): Promise<EnvironmentResult> {
  const query = `[out:json][timeout:15];
(
  node(around:2000,${lat},${lng})[railway=station];
  node(around:2000,${lat},${lng})[station=subway];
  node(around:2000,${lat},${lng})[railway=tram_stop];
  node(around:1000,${lat},${lng})[highway=bus_stop];
  nwr(around:2000,${lat},${lng})[amenity~"^(school|university|college|kindergarten)$"];
  nwr(around:2500,${lat},${lng})[amenity~"^(hospital|clinic|pharmacy|doctors)$"];
  nwr(around:1500,${lat},${lng})[leisure=park];
  nwr(around:1200,${lat},${lng})[shop~"^(supermarket|convenience|mall)$"];
);
out center 300;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Overpass API hatası: ${res.status}`);
  const json = (await res.json()) as { elements: OverpassElement[] };

  // Kategori bazında en yakın nokta + adet
  const buckets = new Map<
    string,
    { count: number; nearestName: string | null; nearestDistance: number | null }
  >();
  for (const el of json.elements) {
    const tags = el.tags ?? {};
    const cat = categorize(tags);
    if (!cat) continue;
    const pLat = el.lat ?? el.center?.lat;
    const pLng = el.lon ?? el.center?.lon;
    if (pLat == null || pLng == null) continue;
    const dist = haversine(lat, lng, pLat, pLng);
    const b = buckets.get(cat) ?? {
      count: 0,
      nearestName: null,
      nearestDistance: null,
    };
    b.count += 1;
    if (b.nearestDistance == null || dist < b.nearestDistance) {
      b.nearestDistance = dist;
      b.nearestName = tags.name ?? null;
    }
    buckets.set(cat, b);
  }

  const categories: EnvironmentCategory[] = CATEGORIES.map((c) => {
    const b = buckets.get(c.key);
    let score = 0;
    if (b?.nearestDistance != null) {
      if (b.nearestDistance <= c.dFull) score = c.max;
      else if (b.nearestDistance >= c.dZero) score = 0;
      else
        score = Math.round(
          c.max * (1 - (b.nearestDistance - c.dFull) / (c.dZero - c.dFull)),
        );
    }
    return {
      key: c.key,
      label: c.label,
      count: b?.count ?? 0,
      nearestName: b?.nearestName ?? null,
      nearestDistance: b?.nearestDistance ?? null,
      score,
      maxScore: c.max,
    };
  });

  return {
    score: categories.reduce((s, c) => s + c.score, 0),
    lat,
    lng,
    analyzedAt: new Date().toISOString(),
    categories,
  };
}

type EnvListingRow = Pick<Listing, "id" | "lat" | "lng" | "environmentData">;

/**
 * Konum varsa ve daha önce bu koordinat için analiz yapılmadıysa çalıştırır.
 * Route'larda after() ile arka planda çağrılır — kayıt akışını bloklamaz.
 */
export async function ensureEnvironmentAnalysis(
  listing: EnvListingRow,
): Promise<void> {
  if (listing.lat == null || listing.lng == null) return;
  const prev = listing.environmentData as { lat?: number; lng?: number } | null;
  if (prev && prev.lat === listing.lat && prev.lng === listing.lng) return;

  const result = await analyzeEnvironment(listing.lat, listing.lng);
  await prisma.listing.update({
    where: { id: listing.id },
    data: {
      environmentScore: result.score,
      environmentData: result as unknown as object,
    },
  });
}
