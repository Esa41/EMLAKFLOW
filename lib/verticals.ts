/**
 * Dikey (vertical) konfigürasyon katmanı — tek kaynak.
 *
 * Aynı altyapı iki ürün gibi tanıtılır:
 *   REAL_ESTATE → EmlakFlow  (emlak ofisleri)
 *   AUTO_DEALER → GaleriFlow (oto galericiler)
 *
 * Marka adı, nav etiketleri, pipeline aşama adları, ilan tipleri ve
 * referans kodu öneki buradan okunur; UI hiçbir yerde dikeye özel
 * sabit string taşımaz.
 */

export type VerticalKey = "REAL_ESTATE" | "AUTO_DEALER" | "MULTI";

export interface VerticalConfig {
  key: VerticalKey;
  /** Ürün adı: "EmlakFlow" / "GaleriFlow" */
  productName: string;
  /** Marka logosu iki parça render edilir: <b>{brandHead}</b><accent>{brandTail}</accent> */
  brandHead: string;
  brandTail: string;
  /** Kayıt/landing tanıtım cümlesi */
  tagline: string;
  /** refCode öneki: EF-2026-0001 / GF-2026-0001 */
  refPrefix: string;
  /** Public vitrin rota tabanı: /ofis | /galeri */
  showcaseBase: string;
  /** Kayıt formunda "Ofis adı" alanı etiketi */
  officeNameLabel: string;
  officeNamePlaceholder: string;
  /** Nav ve genel UI etiketleri */
  labels: {
    portfolio: string; // "Portföy" | "Araç Parkı"
    listing: string; // "İlan" | "Araç"
    listingPlural: string; // "İlanlar" | "Araçlar"
    newListing: string; // "Yeni İlan" | "Yeni Araç"
    pipeline: string; // "Satış Hattı"
    rentals: string; // "Kira Takibi" | "Kiralık Araçlar"
    social: string; // "İçerik Takibi"
    showcase: string; // "Vitrin"
  };
  /** Deal pipeline aşama etiketleri */
  stageLabels: Record<string, string>;
  /** Bu dikeyde geçerli ilan tipleri (ListingType alt kümesi) */
  listingTypes: Record<string, string>;
  /** Varsayılan ilan tipi */
  defaultListingType: string;
}

const REAL_ESTATE: VerticalConfig = {
  key: "REAL_ESTATE",
  productName: "EmlakFlow",
  brandHead: "Emlak",
  brandTail: "Flow",
  tagline: "Emlak ofisiniz için portföy, müşteri ve satış yönetimi",
  refPrefix: "EF",
  showcaseBase: "/ofis",
  officeNameLabel: "Ofis adı",
  officeNamePlaceholder: "Örn. Atlas Gayrimenkul",
  labels: {
    portfolio: "Portföy",
    listing: "İlan",
    listingPlural: "İlanlar",
    newListing: "Yeni İlan",
    pipeline: "Satış Hattı",
    rentals: "Kira Takibi",
    social: "İçerik Takibi",
    showcase: "Vitrin",
  },
  stageLabels: {
    NEW: "Yeni",
    CONTACTED: "İletişimde",
    VIEWING: "Yer Gösterildi",
    OFFER: "Teklif",
    CONTRACT: "Sözleşme",
    CLOSED_WON: "Kazanıldı",
    CLOSED_LOST: "Kaybedildi",
  },
  listingTypes: {
    APARTMENT: "Daire",
    HOUSE: "Müstakil Ev",
    VILLA: "Villa",
    LAND: "Arsa",
    COMMERCIAL: "Dükkan / Ticari",
    OFFICE: "Ofis",
  },
  defaultListingType: "APARTMENT",
};

const AUTO_DEALER: VerticalConfig = {
  key: "AUTO_DEALER",
  productName: "GaleriFlow",
  brandHead: "Galeri",
  brandTail: "Flow",
  tagline: "Galeriniz için araç parkı, müşteri ve satış yönetimi",
  refPrefix: "GF",
  showcaseBase: "/galeri",
  officeNameLabel: "Galeri adı",
  officeNamePlaceholder: "Örn. Akdeniz Otomotiv",
  labels: {
    portfolio: "Araç Parkı",
    listing: "Araç",
    listingPlural: "Araçlar",
    newListing: "Yeni Araç",
    pipeline: "Satış Hattı",
    rentals: "Kiralık Araçlar",
    social: "İçerik Takibi",
    showcase: "Vitrin",
  },
  stageLabels: {
    NEW: "Yeni",
    CONTACTED: "İletişimde",
    VIEWING: "Test Sürüşü",
    OFFER: "Teklif",
    CONTRACT: "Noter / Devir",
    CLOSED_WON: "Kazanıldı",
    CLOSED_LOST: "Kaybedildi",
  },
  listingTypes: {
    SEDAN: "Sedan",
    HATCHBACK: "Hatchback",
    SUV: "SUV / Arazi",
    PICKUP: "Pick-up",
    MINIVAN: "Minivan / Panelvan",
    COMMERCIAL_VEHICLE: "Ticari Araç",
    MOTORCYCLE: "Motosiklet",
  },
  defaultListingType: "SEDAN",
};

const CONFIGS: Record<string, VerticalConfig> = {
  REAL_ESTATE,
  AUTO_DEALER,
  // MULTI şimdilik emlak deneyimiyle açılır; talep gelince ayrı UI yapılır.
  MULTI: REAL_ESTATE,
};

/** Tenant.vertical değerinden konfigürasyon döndürür (bilinmeyen → emlak). */
export function getVertical(key: string | null | undefined): VerticalConfig {
  return CONFIGS[key ?? "REAL_ESTATE"] ?? REAL_ESTATE;
}

/** Araç dikeyi mi? (form/feed dallanmaları için kısayol) */
export function isAutoVertical(key: string | null | undefined): boolean {
  return key === "AUTO_DEALER";
}

/** Kayıt ekranında sunulan ürün seçenekleri */
export const PRODUCT_CHOICES: Array<{
  key: VerticalKey;
  param: string; // ?v= değeri
  config: VerticalConfig;
}> = [
  { key: "REAL_ESTATE", param: "emlak", config: REAL_ESTATE },
  { key: "AUTO_DEALER", param: "galeri", config: AUTO_DEALER },
];

/** ?v= parametresinden vertical anahtarı çözer */
export function verticalFromParam(v: string | null | undefined): VerticalKey {
  return v === "galeri" ? "AUTO_DEALER" : "REAL_ESTATE";
}

// ── Araç form seçenekleri (listing-form + lead formu ortak) ──

export const FUEL_OPTIONS = ["Benzin", "Dizel", "Hibrit", "Elektrik", "LPG"];
export const TRANSMISSION_OPTIONS = ["Manuel", "Otomatik", "Yarı Otomatik"];

export const VEHICLE_FEATURE_SUGGESTIONS = [
  "Sunroof",
  "Deri Döşeme",
  "Geri Görüş Kamerası",
  "Park Sensörü",
  "Şerit Takip",
  "Adaptif Hız Sabitleyici",
  "Isıtmalı Koltuk",
  "Elektrikli Bagaj",
  "Anahtarsız Çalıştırma",
  "Apple CarPlay",
  "Android Auto",
  "Yokuş Kalkış Desteği",
  "Kör Nokta Uyarı",
  "LED Far",
];
