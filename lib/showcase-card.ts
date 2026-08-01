import type { ShowcaseCardListing } from "@/components/showcase-card";

/**
 * Prisma ilan kaydı → vitrin kartı verisi.
 *
 * Tek eşleyici: hem vitrin ana sayfası (`app/ofis/[slug]/page.tsx`) hem ilan
 * detayındaki "benzer ilanlar" bölümü buradan geçer. İkisi ayrı eşleyici
 * kullandığı sürece kartlar sessizce birbirinden ayrışıyordu (detaydaki kart
 * eski blueprint tasarımında kalmıştı ve vitrin temasını hiç okumuyordu).
 */
export function toShowcaseCardListing(l: {
  id: string;
  title: string;
  slug: string | null;
  purpose: string;
  price: unknown;
  rooms: string | null;
  netArea: number | null;
  grossArea: number | null;
  district: string;
  neighborhood: string | null;
  features: string[];
  vehicleYear?: number | null;
  media: Array<{ cardUrl: string | null; url: string; alt: string | null }>;
  _count?: { media: number };
}): ShowcaseCardListing {
  return {
    id: l.id,
    title: l.title,
    slug: l.slug,
    purpose: l.purpose,
    price: Number(l.price),
    rooms: l.rooms,
    netArea: l.netArea,
    grossArea: l.grossArea,
    district: l.district,
    neighborhood: l.neighborhood,
    features: l.features,
    vehicleYear: l.vehicleYear,
    mediaCount: l._count?.media,
    image: l.media[0]?.cardUrl ?? l.media[0]?.url ?? null,
    imageAlt: l.media[0]?.alt ?? l.title,
  };
}

export function isNewListing(createdAt: Date, days = 14): boolean {
  return createdAt.getTime() >= Date.now() - days * 86400000;
}
