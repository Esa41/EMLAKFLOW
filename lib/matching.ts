import type { Lead, Listing } from "@prisma/client";
import type { TenantClient } from "./tenant";
import { isAutoVertical } from "./verticals";

export interface MatchResult {
  lead: Lead;
  score: number;
  reasons: string[];
}

export interface ListingMatchResult {
  listing: Listing;
  score: number;
  reasons: string[];
}

function isVehicleListing(l: Listing): boolean {
  return !!(l.vehicleBrand || l.vehicleYear);
}

/**
 * Bir lead ile bir ilanın uyum skorunu hesaplar (0–100).
 * Emlak ve araç dikeyleri için ortak çekirdek + dikeye özel kriterler.
 */
export function scorePair(
  lead: Lead,
  listing: Listing,
): { score: number; reasons: string[] } {
  if (lead.purpose !== listing.purpose) return { score: 0, reasons: [] };

  const vehicleLead = !!(lead.vehicleBrand || lead.minYear || lead.maxKm);
  const vehicleListing = isVehicleListing(listing);

  if (vehicleLead || vehicleListing) {
    return scoreVehiclePair(lead, listing);
  }

  let score = 0;
  const reasons: string[] = [];

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

  if (lead.rooms && listing.rooms) {
    if (lead.rooms === listing.rooms) {
      score += 15;
      reasons.push(`Oda sayısı uyumlu (${listing.rooms})`);
    }
  } else if (!lead.rooms) {
    score += 8;
  }

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

  if (!lead.type || lead.type === listing.type) {
    score += 5;
    if (lead.type) reasons.push("Gayrimenkul tipi uyumlu");
  }

  if (!lead.needsCredit || listing.creditEligible) {
    score += 5;
    if (lead.needsCredit) reasons.push("Krediye uygun");
  } else {
    score = Math.max(0, score - 20);
  }

  return { score: Math.min(score, 100), reasons };
}

function scoreVehiclePair(
  lead: Lead,
  listing: Listing,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (lead.city && listing.city && lead.city === listing.city) {
    score += 20;
    reasons.push("Şehir uyumlu");
  } else if (!lead.city) {
    score += 10;
  }

  const price = Number(listing.price);
  const min = lead.minPrice ? Number(lead.minPrice) : null;
  const max = lead.maxPrice ? Number(lead.maxPrice) : null;
  if (min === null && max === null) score += 20;
  else if ((min === null || price >= min) && (max === null || price <= max)) {
    score += 30;
    reasons.push("Bütçe aralığında");
  } else if (max !== null && price <= max * 1.1) {
    score += 15;
    reasons.push("Bütçenin %10 üstünde");
  }

  if (lead.vehicleBrand && listing.vehicleBrand) {
    if (
      lead.vehicleBrand.toLowerCase() === listing.vehicleBrand.toLowerCase()
    ) {
      score += 15;
      reasons.push(`Marka uyumlu (${listing.vehicleBrand})`);
    }
  } else if (!lead.vehicleBrand) {
    score += 5;
  }

  if (lead.vehicleModel && listing.vehicleModel) {
    if (
      listing.vehicleModel.toLowerCase().includes(lead.vehicleModel.toLowerCase())
    ) {
      score += 10;
      reasons.push("Model uyumlu");
    }
  }

  if (lead.minYear && listing.vehicleYear) {
    if (listing.vehicleYear >= lead.minYear) {
      score += 10;
      reasons.push(`Model yılı uygun (${listing.vehicleYear})`);
    }
  } else if (!lead.minYear) {
    score += 5;
  }

  if (lead.maxKm != null && listing.vehicleKm != null) {
    if (listing.vehicleKm <= lead.maxKm) {
      score += 10;
      reasons.push(`Km uygun (${listing.vehicleKm.toLocaleString("tr-TR")})`);
    }
  } else if (lead.maxKm == null) {
    score += 5;
  }

  if (lead.fuel && listing.fuel) {
    if (lead.fuel.toLowerCase() === listing.fuel.toLowerCase()) {
      score += 5;
      reasons.push("Yakıt tipi uyumlu");
    }
  }

  if (lead.transmission && listing.transmission) {
    if (lead.transmission.toLowerCase() === listing.transmission.toLowerCase()) {
      score += 5;
      reasons.push("Vites uyumlu");
    }
  }

  if (!lead.type || lead.type === listing.type) {
    score += 5;
  }

  return { score: Math.min(score, 100), reasons };
}

export async function findMatchingLeads(
  db: TenantClient,
  listing: Listing,
  minScore = 50,
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

export async function findMatchingListings(
  db: TenantClient,
  lead: Lead,
  minScore = 50,
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

/** Lead oluştururken dikeye göre varsayılan tip */
export function defaultLeadTypeForVertical(vertical: string | null | undefined) {
  return isAutoVertical(vertical) ? "SEDAN" : "APARTMENT";
}
