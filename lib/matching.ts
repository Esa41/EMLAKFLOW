import type { Lead, Listing } from "@prisma/client";
import type { TenantClient } from "./tenant";

export interface MatchResult {
  lead: Lead;
  score: number; // 0–100
  reasons: string[];
}

export interface ListingMatchResult {
  listing: Listing;
  score: number; // 0–100
  reasons: string[];
}

/**
 * Bir lead ile bir ilanın uyum skorunu hesaplar (0–100).
 * Çift yönlü eşleştirmenin (ilan→lead ve lead→ilan) ortak çekirdeği.
 */
export function scorePair(
  lead: Lead,
  listing: Listing,
): { score: number; reasons: string[] } {
  // Amaç (satılık/kiralık) ön şart
  if (lead.purpose !== listing.purpose) return { score: 0, reasons: [] };

  let score = 0;
  const reasons: string[] = [];

  // Lokasyon (35)
  if (lead.city && lead.city === listing.city) {
    score += 15;
    reasons.push("Şehir uyumlu");
    if (lead.district && lead.district === listing.district) {
      score += 12;
      reasons.push("İlçe uyumlu");
      if (
        listing.neighborhood &&
        lead.neighborhoods.includes(listing.neighborhood)
      ) {
        score += 8;
        reasons.push("Mahalle tercih listesinde");
      }
    }
  } else if (!lead.city) {
    score += 10;
  }

  // Fiyat (30)
  const price = Number(listing.price);
  const min = lead.minPrice ? Number(lead.minPrice) : null;
  const max = lead.maxPrice ? Number(lead.maxPrice) : null;
  if (min === null && max === null) {
    score += 15;
  } else if ((min === null || price >= min) && (max === null || price <= max)) {
    score += 30;
    reasons.push("Bütçe aralığında");
  } else if (max !== null && price <= max * 1.1) {
    score += 12;
    reasons.push("Bütçenin %10 üstünde (pazarlık payı)");
  }

  // Oda (15)
  if (lead.rooms && listing.rooms) {
    if (lead.rooms === listing.rooms) {
      score += 15;
      reasons.push(`Oda sayısı uyumlu (${listing.rooms})`);
    }
  } else if (!lead.rooms) {
    score += 8;
  }

  // Net m² (10)
  if (listing.netArea) {
    const okMin = lead.minArea === null || listing.netArea >= (lead.minArea ?? 0);
    const okMax =
      lead.maxArea === null || listing.netArea <= (lead.maxArea ?? Infinity);
    if (lead.minArea === null && lead.maxArea === null) score += 5;
    else if (okMin && okMax) {
      score += 10;
      reasons.push("Metrekare aralığında");
    }
  }

  // Tip (5)
  if (!lead.type || lead.type === listing.type) {
    score += 5;
    if (lead.type) reasons.push("Gayrimenkul tipi uyumlu");
  }

  // Kredi (5)
  if (!lead.needsCredit || listing.creditEligible) {
    score += 5;
    if (lead.needsCredit) reasons.push("Krediye uygun");
  } else {
    score = Math.max(0, score - 20);
  }

  return { score: Math.min(score, 100), reasons };
}

/**
 * Yeni/güncellenen bir ilana uyan AÇIK lead'leri bulur ve puanlar.
 * Skor bileşenleri:
 *   amaç (satılık/kiralık) → ön şart
 *   şehir/ilçe/mahalle     → 35
 *   fiyat aralığı          → 30
 *   oda ("3+1")            → 15
 *   net m² aralığı         → 10
 *   tip (daire/villa…)     → 5
 *   kredi uygunluğu        → 5
 */
export async function findMatchingLeads(
  db: TenantClient,
  listing: Listing,
  minScore = 50
): Promise<MatchResult[]> {
  const leads = await db.lead.findMany({
    where: { status: "OPEN", purpose: listing.purpose },
  });

  const results: MatchResult[] = [];
  for (const lead of leads) {
    const { score, reasons } = scorePair(lead, listing);
    if (score >= minScore) results.push({ lead, score, reasons });
  }
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Ters yön: yeni/güncellenen bir TALEBE (lead) uyan AKTİF ilanları bulur.
 * Vitrinden ya da elle talep geldiğinde danışmanı bilgilendirmek için kullanılır.
 */
export async function findMatchingListings(
  db: TenantClient,
  lead: Lead,
  minScore = 50
): Promise<ListingMatchResult[]> {
  const listings = await db.listing.findMany({
    where: { status: "ACTIVE", purpose: lead.purpose },
  });

  const results: ListingMatchResult[] = [];
  for (const listing of listings) {
    const { score, reasons } = scorePair(lead, listing);
    if (score >= minScore) results.push({ listing, score, reasons });
  }
  return results.sort((a, b) => b.score - a.score);
}
