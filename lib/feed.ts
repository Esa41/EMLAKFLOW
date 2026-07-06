/**
 * Portal XML feed üretimi — emlak ve otomotiv dikeyleri.
 * ?portal=sahibinden | hepsiemlak | emlakjet | arabam | sahibinden-auto
 */

const PURPOSE_TR: Record<string, string> = { SALE: "Satılık", RENT: "Kiralık" };

const ESTATE_TYPE_TR: Record<string, string> = {
  APARTMENT: "Daire",
  HOUSE: "Müstakil Ev",
  VILLA: "Villa",
  LAND: "Arsa",
  COMMERCIAL: "Dükkan",
  OFFICE: "Ofis",
};

const AUTO_TYPE_TR: Record<string, string> = {
  SEDAN: "Sedan",
  HATCHBACK: "Hatchback",
  SUV: "SUV",
  PICKUP: "Pick-up",
  MINIVAN: "Minivan",
  COMMERCIAL_VEHICLE: "Ticari Araç",
  MOTORCYCLE: "Motosiklet",
};

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function tag(name: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return `    <${name}>${esc(String(value))}</${name}>\n`;
}

export interface FeedListing {
  refCode: string;
  title: string;
  purpose: string;
  type: string;
  price: unknown;
  currency: string;
  city: string;
  district: string;
  neighborhood: string | null;
  rooms: string | null;
  grossArea: number | null;
  netArea: number | null;
  floor: number | null;
  totalFloors: number | null;
  buildingAge: number | null;
  heating: string | null;
  dues: unknown;
  deedStatus: string | null;
  creditEligible: boolean;
  furnished: boolean;
  inSite: boolean;
  description: string | null;
  updatedAt: Date;
  feedEnabled?: boolean;
  media: Array<{ url: string }>;
  agent: { name: string; phone: string | null } | null;
  // Araç
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  vehicleKm?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  engineSize?: string | null;
  color?: string | null;
  tramerAmount?: unknown;
  exchangeOk?: boolean;
  warrantyOk?: boolean;
  rentDailyPrice?: unknown;
  rentWeeklyPrice?: unknown;
}

export interface FeedTenant {
  name: string;
  phone: string | null;
  city: string | null;
  vertical?: string;
}

export type FeedPortal =
  | "generic"
  | "sahibinden"
  | "hepsiemlak"
  | "emlakjet"
  | "arabam"
  | "sahibinden-auto";

function photosXml(media: Array<{ url: string }>): string {
  return media
    .map((m, i) => `      <foto sira="${i + 1}">${esc(m.url)}</foto>\n`)
    .join("");
}

function agentXml(agent: FeedListing["agent"]): string {
  if (!agent) return "";
  return (
    `    <danisman>\n` +
    tag("ad", agent.name) +
    tag("telefon", agent.phone) +
    `    </danisman>\n`
  );
}

function isAutoListing(l: FeedListing): boolean {
  return !!(l.vehicleBrand || l.vehicleYear || AUTO_TYPE_TR[l.type]);
}

function buildEstateItem(l: FeedListing, portal: FeedPortal): string {
  const photos = photosXml(l.media);
  const tipLabel =
    portal === "sahibinden"
      ? TYPE_TR_ESTATE_PORTAL[l.type] ?? ESTATE_TYPE_TR[l.type] ?? l.type
      : ESTATE_TYPE_TR[l.type] ?? l.type;

  return (
    `  <ilan>\n` +
    tag("referansNo", l.refCode) +
    tag("baslik", l.title) +
    tag("islemTipi", PURPOSE_TR[l.purpose] ?? l.purpose) +
    tag("emlakTipi", tipLabel) +
    tag("fiyat", Number(l.price)) +
    tag("paraBirimi", l.currency) +
    tag("il", l.city) +
    tag("ilce", l.district) +
    tag("mahalle", l.neighborhood) +
    tag("odaSayisi", l.rooms) +
    tag("brutMetrekare", l.grossArea) +
    tag("netMetrekare", l.netArea) +
    tag("bulunduguKat", l.floor) +
    tag("katSayisi", l.totalFloors) +
    tag("binaYasi", l.buildingAge) +
    tag("isitma", l.heating) +
    tag("aidat", l.dues != null ? Number(l.dues) : null) +
    tag("tapuDurumu", l.deedStatus) +
    tag("krediyeUygun", l.creditEligible ? "Evet" : "Hayır") +
    tag("esyali", l.furnished ? "Evet" : "Hayır") +
    tag("siteIcerisinde", l.inSite ? "Evet" : "Hayır") +
    tag("aciklama", l.description) +
    tag("guncellemeTarihi", l.updatedAt.toISOString()) +
    agentXml(l.agent) +
    (photos ? `    <fotograflar>\n${photos}    </fotograflar>\n` : "") +
    `  </ilan>\n`
  );
}

const TYPE_TR_ESTATE_PORTAL: Record<string, string> = { ...ESTATE_TYPE_TR };

function buildAutoItem(l: FeedListing, portal: FeedPortal): string {
  const photos = photosXml(l.media);
  const marka = l.vehicleBrand ?? "";
  const model = l.vehicleModel ?? l.title;
  const rootTag = portal === "arabam" ? "arac" : "ilan";

  return (
    `  <${rootTag}>\n` +
    tag("referansNo", l.refCode) +
    tag("baslik", l.title) +
    tag("islemTipi", PURPOSE_TR[l.purpose] ?? l.purpose) +
    tag("marka", marka) +
    tag("model", model) +
    tag("yil", l.vehicleYear) +
    tag("km", l.vehicleKm) +
    tag("yakit", l.fuel) +
    tag("vites", l.transmission) +
    tag("motorHacmi", l.engineSize) +
    tag("renk", l.color) +
    tag("kasaTipi", AUTO_TYPE_TR[l.type] ?? l.type) +
    tag("tramer", l.tramerAmount != null ? Number(l.tramerAmount) : null) +
    tag("takas", l.exchangeOk ? "Evet" : "Hayır") +
    tag("garanti", l.warrantyOk ? "Evet" : "Hayır") +
    tag("fiyat", Number(l.price)) +
    tag("gunlukKira", l.rentDailyPrice != null ? Number(l.rentDailyPrice) : null) +
    tag("haftalikKira", l.rentWeeklyPrice != null ? Number(l.rentWeeklyPrice) : null) +
    tag("paraBirimi", l.currency) +
    tag("il", l.city) +
    tag("ilce", l.district) +
    tag("aciklama", l.description) +
    tag("guncellemeTarihi", l.updatedAt.toISOString()) +
    agentXml(l.agent) +
    (photos ? `    <fotograflar>\n${photos}    </fotograflar>\n` : "") +
    `  </${rootTag}>\n`
  );
}

export function buildFeedXml(
  tenant: FeedTenant,
  listings: FeedListing[],
  portal: FeedPortal = "generic",
): string {
  const active = listings.filter((l) => l.feedEnabled !== false);
  const autoMode =
    portal === "arabam" ||
    portal === "sahibinden-auto" ||
    tenant.vertical === "AUTO_DEALER";

  const filtered = autoMode
    ? active.filter(isAutoListing)
    : active.filter((l) => !isAutoListing(l));

  const items = filtered
    .map((l) =>
      autoMode || isAutoListing(l)
        ? buildAutoItem(l, portal)
        : buildEstateItem(l, portal),
    )
    .join("");

  const source =
    autoMode ? "GaleriFlow" : portal === "generic" ? "EmlakFlow" : portal;
  const root = autoMode ? "araclar" : "ilanlar";
  const officeTag = autoMode ? "galeri" : "ofis";

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<${root} kaynak="${source}" portal="${portal}" olusturma="${new Date().toISOString()}">\n` +
    `  <${officeTag}>\n` +
    tag("ad", tenant.name) +
    tag("telefon", tenant.phone) +
    tag("sehir", tenant.city) +
    `  </${officeTag}>\n` +
    items +
    `</${root}>\n`
  );
}

/** Portal push API — partner anlaşması gerektirir (Faz 4). */
export async function pushListingToPortal(
  _portal: FeedPortal,
  _listingId: string,
): Promise<{ ok: false; message: string }> {
  return {
    ok: false,
    message:
      "Portal API push henüz aktif değil. XML feed URL ile yayınlayın veya partner entegrasyonu için bizimle iletişime geçin.",
  };
}
