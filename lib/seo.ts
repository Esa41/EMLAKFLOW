import { TYPE_TR } from "./labels";
import type { Listing, ListingMedia, Tenant } from "@prisma/client";

/**
 * Şablon bazlı (deterministik) SEO üretimi — AI gerektirmez, render anında çalışır.
 * İlan alanları zaten yapılandırılmış olduğundan başlık/açıklama/alt-text
 * kural tabanlı üretilir; depolama ve backfill gerekmez.
 */

type SeoListing = Pick<
  Listing,
  | "title"
  | "purpose"
  | "type"
  | "rooms"
  | "netArea"
  | "grossArea"
  | "city"
  | "district"
  | "neighborhood"
  | "price"
  | "currency"
  | "floor"
  | "buildingAge"
  | "creditEligible"
  | "furnished"
  | "refCode"
> &
  // AI ile üretilen kayıtlı SEO alanları — varsa şablona tercih edilir
  Partial<Pick<Listing, "seoTitle" | "seoDescription">>;

const tl = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

export function seoTitle(l: SeoListing, officeName?: string): string {
  // AI ile üretilmiş kayıtlı başlık öncelikli
  if (l.seoTitle) {
    return officeName ? `${l.seoTitle} | ${officeName}` : l.seoTitle;
  }
  const islem = l.purpose === "SALE" ? "Satılık" : "Kiralık";
  const yer = [l.neighborhood, l.district].filter(Boolean).join(" ");
  const oda = l.rooms ? ` ${l.rooms}` : "";
  const m2 = l.netArea ? ` ${l.netArea} m²` : "";
  const base = `${yer}'de ${islem}${oda} ${TYPE_TR[l.type]}${m2}`;
  return officeName ? `${base} | ${officeName}` : base;
}

export function seoDescription(l: SeoListing, officeName?: string): string {
  // AI ile üretilmiş kayıtlı açıklama öncelikli
  if (l.seoDescription) return l.seoDescription.slice(0, 300);
  const islem = l.purpose === "SALE" ? "satılık" : "kiralık";
  const parts: string[] = [];
  parts.push(
    `${[l.neighborhood, l.district, l.city].filter(Boolean).join(", ")} bölgesinde ${islem} ${TYPE_TR[l.type].toLowerCase()}`,
  );
  if (l.rooms) parts.push(l.rooms);
  if (l.netArea) parts.push(`net ${l.netArea} m²`);
  else if (l.grossArea) parts.push(`brüt ${l.grossArea} m²`);
  if (l.floor != null) parts.push(`${l.floor}. kat`);
  if (l.buildingAge != null)
    parts.push(l.buildingAge === 0 ? "sıfır bina" : `${l.buildingAge} yaşında`);
  if (l.creditEligible && l.purpose === "SALE") parts.push("krediye uygun");
  if (l.furnished) parts.push("eşyalı");
  parts.push(
    l.currency && l.currency !== "TRY"
      ? new Intl.NumberFormat("tr-TR", {
          style: "currency",
          currency: l.currency,
          maximumFractionDigits: 0,
        }).format(Number(l.price))
      : tl.format(Number(l.price)),
  );
  const desc = parts.join(" · ");
  const suffix = officeName
    ? ` ${officeName} güvencesiyle — ilan kodu ${l.refCode}.`
    : "";
  return (desc + "." + suffix).slice(0, 300);
}

export function mediaAltText(l: SeoListing, index: number): string {
  const yer = [l.neighborhood, l.district].filter(Boolean).join(", ");
  const base = `${yer} ${l.purpose === "SALE" ? "satılık" : "kiralık"} ${(TYPE_TR[l.type] ?? "ilan").toLowerCase()}${l.rooms ? ` ${l.rooms}` : ""}`;
  return index === 0
    ? `${base} — kapak fotoğrafı`
    : `${base} — fotoğraf ${index + 1}`;
}

/** schema.org RealEstateListing + Product JSON-LD — vitrin ilan detayına gömülür. */
export function listingJsonLd(
  l: SeoListing & {
    id: string;
    description: string | null;
    media: Pick<ListingMedia, "url">[];
    lat?: number | null;
    lng?: number | null;
  },
  tenant: Pick<Tenant, "name" | "slug" | "phone">,
  baseUrl: string,
  agent?: { name: string; phone?: string | null },
) {
  const url = `${baseUrl}/ofis/${tenant.slug}/ilan/${l.id}`;
  return {
    "@context": "https://schema.org",
    "@type": ["RealEstateListing", "Product"],
    "@id": url,
    name: seoTitle(l, tenant.name),
    description: l.description ?? seoDescription(l, tenant.name),
    url,
    sku: l.refCode,
    image: l.media.slice(0, 5).map((m) => m.url),
    brand: { "@type": "RealEstateAgent", name: tenant.name },
    offers: {
      "@type": "Offer",
      url,
      price: Number(l.price),
      priceCurrency: l.currency ?? "TRY",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "RealEstateAgent",
        name: tenant.name,
        url: `${baseUrl}/ofis/${tenant.slug}`,
        ...(tenant.phone ? { telephone: tenant.phone } : {}),
      },
      priceValidUntil: new Date(Date.now() + 30 * 86400000)
        .toISOString()
        .slice(0, 10),
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: l.district,
      addressRegion: l.city,
      ...(l.neighborhood ? { streetAddress: l.neighborhood } : {}),
      addressCountry: "TR",
    },
    ...(l.lat != null && l.lng != null
      ? { geo: { "@type": "GeoCoordinates", latitude: l.lat, longitude: l.lng } }
      : {}),
    ...(agent
      ? {
          broker: {
            "@type": "Person",
            name: agent.name,
            ...(agent.phone ? { telephone: agent.phone } : {}),
          },
        }
      : {}),
    ...(l.netArea
      ? {
          floorSize: {
            "@type": "QuantitativeValue",
            value: l.netArea,
            unitCode: "MTK",
          },
        }
      : {}),
    ...(l.rooms ? { numberOfRooms: l.rooms } : {}),
  };
}

/** schema.org BreadcrumbList JSON-LD — vitrin sayfalarında gezinme yolu için. */
export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** schema.org RealEstateAgent JSON-LD — ofis vitrin ana sayfasına gömülür. */
export function officeJsonLd(
  tenant: Pick<Tenant, "name" | "slug" | "phone" | "city" | "district">,
  baseUrl: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: tenant.name,
    url: `${baseUrl}/ofis/${tenant.slug}`,
    ...(tenant.phone ? { telephone: tenant.phone } : {}),
    ...(tenant.city
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: tenant.district ?? undefined,
            addressRegion: tenant.city,
            addressCountry: "TR",
          },
        }
      : {}),
  };
}
