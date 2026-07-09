/** Vitrin kartı künye plakası — mahalle + ilk özellik. */
export function showcaseKunyePlate(listing: {
  neighborhood: string | null;
  district: string;
  features?: string[];
  vehicleYear?: number | null;
  title: string;
  isAuto?: boolean;
}): string {
  if (listing.isAuto && listing.vehicleYear) {
    return `${listing.vehicleYear} · ${listing.title}`;
  }
  const loc = (listing.neighborhood ?? listing.district).toUpperCase();
  const feat = listing.features?.[0]?.toUpperCase();
  return feat ? `${loc} · ${feat}` : loc;
}

export function isNewListing(createdAt: Date, days = 14): boolean {
  return createdAt.getTime() >= Date.now() - days * 86400000;
}
