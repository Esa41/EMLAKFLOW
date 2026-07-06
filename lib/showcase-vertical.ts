import { TYPE_TR, trMoney } from "@/lib/labels";
import {
  FUEL_OPTIONS,
  TRANSMISSION_OPTIONS,
  getVertical,
  isAutoVertical,
} from "@/lib/verticals";

export { FUEL_OPTIONS, TRANSMISSION_OPTIONS };

type ListingLike = {
  purpose: string;
  type: string;
  rooms?: string | null;
  netArea?: number | null;
  grossArea?: number | null;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  vehicleKm?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  engineSize?: string | null;
  enginePower?: number | null;
  color?: string | null;
  tramerAmount?: unknown;
  exchangeOk?: boolean;
  warrantyOk?: boolean;
  floor?: number | null;
  totalFloors?: number | null;
  buildingAge?: number | null;
  heating?: string | null;
  dues?: unknown;
  deedStatus?: string | null;
  creditEligible?: boolean;
  furnished?: boolean;
  inSite?: boolean;
  rentDailyPrice?: unknown;
};

export function formatVehicleKm(km: number | null | undefined): string {
  if (km == null) return "—";
  return `${km.toLocaleString("tr-TR")} km`;
}

export function rentPriceSuffix(isAuto: boolean, purpose: string): string {
  if (purpose !== "RENT") return "";
  return isAuto ? " /gün" : " /ay";
}

export function listingCardMeta(listing: ListingLike, isAuto: boolean): string {
  if (isAuto) {
    const parts = [
      listing.vehicleYear?.toString(),
      listing.vehicleKm != null ? formatVehicleKm(listing.vehicleKm) : null,
      listing.fuel,
      listing.transmission,
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : (TYPE_TR[listing.type] ?? "—");
  }
  return `${listing.rooms ?? "—"} · net ${listing.netArea ?? listing.grossArea ?? "—"} m²`;
}

export function showcaseMetadata(
  tenant: { name: string; city: string | null; district: string | null },
  vertical: string | null | undefined,
) {
  const isAuto = isAutoVertical(vertical);
  const v = getVertical(vertical);
  if (isAuto) {
    return {
      title: `${tenant.name} — Satılık ve Kiralık Araçlar`,
      description: `${tenant.name} güncel araç parkı: ${tenant.city ?? "Türkiye"} — ekspertizli, şeffaf fiyatlı otomobil ilanları.`,
      productName: v.productName,
    };
  }
  return {
    title: `${tenant.name} — Satılık ve Kiralık Portföy`,
    description: `${tenant.name} güncel portföyü: ${tenant.city ?? "Türkiye"} genelinde satılık ve kiralık gayrimenkuller.`,
    productName: v.productName,
  };
}

export function showcaseHeroCopy(
  tenant: {
    district: string | null;
    city: string | null;
    name: string;
    showcaseTagline: string | null;
  },
  vertical: string | null | undefined,
  count: number,
) {
  const isAuto = isAutoVertical(vertical);
  const v = getVertical(vertical);
  const place = tenant.district ?? tenant.city ?? "Bölgenizde";

  if (isAuto) {
    return {
      badge: `Güncel ${v.labels.listingPlural} · ${count} araç`,
      title: `${place} aradığınız araç, künyesiyle burada.`,
      subtitle:
        tenant.showcaseTagline ??
        `Her araç ${tenant.name} tarafından ekspertizden geçirilir — kilometre, hasar kaydı ve fiyat olduğu gibidir.`,
      searchPlaceholder: "Marka, model veya kelime ara — ör. Passat, hibrit, SUV",
      emptyMessage: "Bu kriterlere uyan araç şu an vitrinde yok — filtreleri genişletmeyi deneyin.",
      mapTitle: "Galeri Konumu",
      mapHint: "Konuma dokun → önizleme",
      requestTitle: "Aradığınız aracı bulamadınız mı?",
      requestBody: "Kriterlerinizi bırakın — uyan bir araç stoğa girdiği an sizi arayalım.",
      portfolioLabel: "Tüm araç parkı",
      similarTitle: "Benzer Araçlar",
      detailsTitle: "Araç Detayları",
      agentLabel: "Satış Danışmanı",
      refHint: "Görüşmede",
    };
  }

  return {
    badge: `Güncel Portföy · ${count} ilan`,
    title: `${place} aradığınız ev, künyesiyle burada.`,
    subtitle:
      tenant.showcaseTagline ??
      `Her ilan ${tenant.name} tarafından yerinde incelenip künyelenmiştir — fiyat, metrekare ve tapu bilgisi olduğu gibidir.`,
    searchPlaceholder: "Kelime, mahalle veya ilçe ara — ör. Moda, deniz manzaralı, 3+1",
    emptyMessage: "Bu kriterlere uyan ilan şu an vitrinde yok — filtreleri genişletmeyi deneyin.",
    mapTitle: "Portföy Haritası",
    mapHint: "Fiyat plakasına dokun → önizleme · yeşil alanlar ve deniz tonu ofis temasına göre özelleştirildi.",
    requestTitle: "Aradığınızı bulamadınız mı?",
    requestBody: "Kriterlerinizi bırakın — uyan bir mülk portföye girdiği an sizi arayalım.",
    portfolioLabel: "Tüm portföy",
    similarTitle: "Benzer İlanlar",
    detailsTitle: "İlan Detayları",
    agentLabel: "İlan Danışmanı",
    refHint: "Görüşmede",
  };
}

export function buildListingSpecs(
  l: ListingLike & {
    price: unknown;
    features?: string[];
  },
  isAuto: boolean,
): Array<[string, string | null]> {
  if (isAuto) {
    const tramer =
      l.tramerAmount != null
        ? Number(l.tramerAmount) === 0
          ? "Yok"
          : trMoney.format(Number(l.tramerAmount))
        : null;
    return [
      ["İşlem", l.purpose === "SALE" ? "Satılık" : "Kiralık"],
      ["Tip", TYPE_TR[l.type] ?? l.type],
      ["Marka", l.vehicleBrand ?? null],
      ["Model", l.vehicleModel ?? null],
      ["Model yılı", l.vehicleYear?.toString() ?? null],
      ["Kilometre", l.vehicleKm != null ? formatVehicleKm(l.vehicleKm) : null],
      ["Yakıt", l.fuel ?? null],
      ["Vites", l.transmission ?? null],
      ["Renk", l.color ?? null],
      ["Motor", l.engineSize ?? null],
      ["Güç", l.enginePower != null ? `${l.enginePower} HP` : null],
      ["Tramer", tramer],
      ["Takas", l.exchangeOk ? "Kabul edilir" : "Hayır"],
      ["Garanti", l.warrantyOk ? "Devam ediyor" : "—"],
      ["Kredi", l.creditEligible ? "Uygun" : "Uygun değil"],
    ];
  }

  return [
    ["İşlem", l.purpose === "SALE" ? "Satılık" : "Kiralık"],
    ["Tip", TYPE_TR[l.type]],
    ["Oda", l.rooms ?? null],
    ["Brüt m²", l.grossArea?.toString() ?? null],
    ["Net m²", l.netArea?.toString() ?? null],
    [
      "Kat",
      l.floor != null
        ? `${l.floor}${l.totalFloors ? ` / ${l.totalFloors}` : ""}`
        : null,
    ],
    [
      "Bina yaşı",
      l.buildingAge != null
        ? l.buildingAge === 0
          ? "Sıfır"
          : String(l.buildingAge)
        : null,
    ],
    ["Isıtma", l.heating ?? null],
    ["Aidat", l.dues != null ? trMoney.format(Number(l.dues)) : null],
    ["Tapu", l.deedStatus ?? null],
    ["Kredi", l.creditEligible ? "Uygun" : "Uygun değil"],
    ["Eşya", l.furnished ? "Eşyalı" : "Eşyasız"],
    ["Site", l.inSite ? "Site içinde" : "—"],
  ];
}

export function autoListingTypeKeys(): string[] {
  return Object.keys(getVertical("AUTO_DEALER").listingTypes);
}

export function realEstateListingTypeKeys(): string[] {
  return Object.keys(getVertical("REAL_ESTATE").listingTypes);
}

export function headerSubtitle(
  vertical: string | null | undefined,
  district: string | null,
  city: string | null,
): string {
  const loc = [district, city].filter(Boolean).join(" · ");
  if (isAutoVertical(vertical)) {
    return loc ? `${loc} · Otomotiv` : "Otomotiv";
  }
  return loc || "Gayrimenkul";
}
