/**
 * Portal XML feed üretimi.
 *
 * Çıktı, Türkiye emlak portallarının XML aktarım araçlarında kullanılan
 * ortak alan kümesini taşıyan jenerik bir formattır. Her portalın kendi
 * şema doğrulaması netleştiğinde (?portal=sahibinden gibi) bu modüle
 * portal-özel serializer eklenir — feed URL'i hiç değişmez.
 */

const PURPOSE_TR: Record<string, string> = { SALE: "Satılık", RENT: "Kiralık" };
const TYPE_TR: Record<string, string> = {
  APARTMENT: "Daire",
  HOUSE: "Müstakil Ev",
  VILLA: "Villa",
  LAND: "Arsa",
  COMMERCIAL: "Dükkan",
  OFFICE: "Ofis",
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
  price: unknown; // Prisma Decimal
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
  media: Array<{ url: string }>;
  agent: { name: string; phone: string | null } | null;
}

export interface FeedTenant {
  name: string;
  phone: string | null;
  city: string | null;
}

export function buildFeedXml(tenant: FeedTenant, listings: FeedListing[]): string {
  const items = listings
    .map((l) => {
      const photos = l.media
        .map((m, i) => `      <foto sira="${i + 1}">${esc(m.url)}</foto>\n`)
        .join("");
      return (
        `  <ilan>\n` +
        tag("referansNo", l.refCode) +
        tag("baslik", l.title) +
        tag("islemTipi", PURPOSE_TR[l.purpose] ?? l.purpose) +
        tag("emlakTipi", TYPE_TR[l.type] ?? l.type) +
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
        (l.agent
          ? `    <danisman>\n` +
            `  ${tag("ad", l.agent.name)}` +
            `  ${tag("telefon", l.agent.phone)}` +
            `    </danisman>\n`
          : "") +
        (photos ? `    <fotograflar>\n${photos}    </fotograflar>\n` : "") +
        `  </ilan>\n`
      );
    })
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<ilanlar kaynak="EmlakFlow" olusturma="${new Date().toISOString()}">\n` +
    `  <ofis>\n` +
    `  ${tag("ad", tenant.name)}` +
    `  ${tag("telefon", tenant.phone)}` +
    `  ${tag("sehir", tenant.city)}` +
    `  </ofis>\n` +
    items +
    `</ilanlar>\n`
  );
}
