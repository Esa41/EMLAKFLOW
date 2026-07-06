import type { Listing, ListingStatus } from "@prisma/client";
import type { TenantClient } from "./tenant";

export interface PriceBand {
  low: number;
  mid: number;
  high: number;
  medianSqm: number;
  confidence: "low" | "medium" | "high";
  sampleSize: number;
  comparables: Array<{
    refCode: string;
    title: string;
    price: number;
    netArea: number;
    sqm: number;
    status: string;
  }>;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * Deterministik emsal fiyat analizi. Aynı ofisin portföyünden benzer ilanların
 * m² birim fiyatını baz alır (satılan + aktif emsaller). Emsal < 3 ise null döner
 * (AI'ya gitmeden "yetersiz veri" gösterilir — uydurma tahmin üretilmez).
 */
export async function computePriceBand(
  db: TenantClient,
  listing: Listing,
): Promise<PriceBand | null> {
  const targetArea = listing.netArea ?? listing.grossArea ?? null;
  if (!targetArea || targetArea <= 0) return null; // m² yoksa birim fiyat çıkmaz

  // Aynı tip + amaç, önce ilçe sonra şehir; ±%35 m² bandı; kendisi hariç.
  const areaLo = Math.round(targetArea * 0.65);
  const areaHi = Math.round(targetArea * 1.35);

  const base = {
    id: { not: listing.id },
    type: listing.type,
    purpose: listing.purpose,
    netArea: { gte: areaLo, lte: areaHi },
    status: { in: ["ACTIVE", "SOLD", "RENTED"] as ListingStatus[] },
  };

  let rows = await db.listing.findMany({
    where: { ...base, district: listing.district },
    select: { refCode: true, title: true, price: true, netArea: true, status: true },
  });
  // İlçede yeterli emsal yoksa şehre genişlet
  if (rows.length < 3) {
    rows = await db.listing.findMany({
      where: { ...base, city: listing.city },
      select: { refCode: true, title: true, price: true, netArea: true, status: true },
    });
  }

  const comps = rows
    .filter((r) => r.netArea && r.netArea > 0)
    .map((r) => ({
      refCode: r.refCode,
      title: r.title,
      price: Number(r.price),
      netArea: r.netArea!,
      sqm: Number(r.price) / r.netArea!,
      status: r.status,
    }))
    .sort((a, b) => a.sqm - b.sqm);

  if (comps.length < 3) return null;

  const sqmValues = comps.map((c) => c.sqm);
  const median = percentile(sqmValues, 0.5);
  const p25 = percentile(sqmValues, 0.25);
  const p75 = percentile(sqmValues, 0.75);

  const confidence: PriceBand["confidence"] =
    comps.length >= 8 ? "high" : comps.length >= 5 ? "medium" : "low";

  return {
    low: Math.round(p25 * targetArea),
    mid: Math.round(median * targetArea),
    high: Math.round(p75 * targetArea),
    medianSqm: Math.round(median),
    confidence,
    sampleSize: comps.length,
    comparables: comps.slice(0, 8),
  };
}
