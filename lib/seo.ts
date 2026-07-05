import { TYPE_TR } from "./labels";
import type { Listing, ListingMedia, Tenant } from "@prisma/client";

/**
 * Şablon bazlı (deterministik) SEO üretimi — AI gerektirmez, render anında çalışır.
 * İlan alanları zaten yapılandırılmış olduğundan başlık/açıklama/alt-text
 * kural tabanlı üretilir; depolama ve backfill gerekmez.
 */

type SeoListing = Pick<
  Listing,
  | "title" | "purpose" | "type" | "rooms" | "netArea" | "grossArea"
  | "city" | "district" | "neighborhood" | "price" | "floor" | "buildingAge"
  | "creditEligible" | "furnished" | "refCode"
>;

const tl = new Intl.NumberFormat("tr-TR", {
  style: "currency", currency: "TRY", maximumFractionDigits: 0,
});

export function seoTitle(l: SeoListing, officeName?: string): string {
  const islem = l.purpose === "SALE" ? "Satılık" : "Kiralık";
  const yer = [l.neighborhood, l.district].filter(Boolean).join(" ");
  const oda = l.rooms ? ` ${l.rooms}` : "";
  const m2 = l.netArea ? ` ${l.netArea} m²` : "";
  const base = `${yer}'de ${islem}${oda} ${TYPE_TR[l.type]}${m2}`;
  return officeName ? `${base} | ${officeName}` : base;
}

export function seoDescription(l: SeoListing, officeName?: string): string {
  const islem = l.purpose === "SALE" ? "satılık" : "kiralık";
  const parts: string[] = [];
  parts.push(
    `${[l.neighborhood, l.district, l.city].filter(Boolean).join(", ")} bölgesinde ${islem} ${TYPE_TR[l.type].toLowerCase()}`
  );
  if (l.rooms) parts.push(l.rooms);
  if (l.netArea) parts.push(`net ${l.netArea} m²`);
  else if (l.grossArea) parts.push(`brüt ${l.grossArea} m²`);
  if (l.floor != null) parts.push(`${l.floor}. kat`);
  if (l.buildingAge != null) parts.push(l.buildingAge === 0 ? "sıfır bina" : `${l.buildingAge} yaşında`);
  if (l.creditEligible && l.purpose === "SALE") parts.push("krediye uygun");
  if (l.furnished) parts.push("eşyalı");
  parts.push(tl.format(Number(l.price)));
  const desc = parts.join(" · ");
  const suffix = officeName ? ` ${officeName} güvencesiyle — ilan kodu ${l.refCode}.` : "";
  return (desc + "." + suffix).slice(0, 300);
}

export function mediaAltText(l: SeoListing, index: number): string {
  const yer = [l.neighborhood, l.district].filter(Boolean).join(", ");
  const base = `${yer} ${l.purpose === "SALE" ? "satılık" : "kiralık"} ${TYPE_TR[l.type].toLowerCase()}${l.rooms ? ` ${l.rooms}` : ""}`;
  return index === 0 ? `${base} — kapak fotoğrafı` : `${base} — fotoğraf ${index + 1}`;
}

/** schema.org RealEstateListing JSON-LD — vitrin ilan detayına gömülür. */
export function listingJsonLd(
  l: SeoListing & { id: string; description: string | null; media: Pick<ListingMedia, "url">[] },
  tenant: Pick<Tenant, "name" | "slug">,
  baseUrl: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: seoTitle(l, tenant.name),
    description: l.description ?? seoDescription(l, tenant.name),
    url: `${baseUrl}/ofis/${tenant.slug}/ilan/${l.id}`,
    image: l.media.map((m) => m.url),
    offers: {
      "@type": "Offer",
      price: Number(l.price),
      priceCurrency: "TRY",
      availability: "https://schema.org/InStock",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: l.district,
      addressRegion: l.city,
      ...(l.neighborhood ? { streetAddress: l.neighborhood } : {}),
      addressCountry: "TR",
    },
    ...(l.netArea
      ? { floorSize: { "@type": "QuantitativeValue", value: l.netArea, unitCode: "MTK" } }
      : {}),
    ...(l.rooms ? { numberOfRooms: l.rooms } : {}),
  };
}
