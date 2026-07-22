/**
 * Kullanıcıya format / ton / hazır paket seçiminde rehberlik.
 * Planlayıcı UI buradan beslenir.
 */

export type FormatKey =
  | "FEED_POST"
  | "CAROUSEL"
  | "STORY"
  | "REEL"
  | "LINKEDIN_POST"
  | "GBP_POST";

export type ToneKey =
  | "luxury"
  | "corporate"
  | "friendly"
  | "professional"
  | "minimal"
  | "emotional"
  | "urgent"
  | "premium"
  | "high_converting";

export const FORMAT_GUIDE: Record<
  FormatKey,
  {
    label: string;
    short: string;
    produces: string;
    bestFor: string;
    platforms: string;
  }
> = {
  FEED_POST: {
    label: "Tek gönderi",
    short: "Tek kare + güçlü caption",
    produces: "Başlık, caption, CTA, hashtag, görsel prompt",
    bestFor: "Yeni ilan duyurusu, günlük paylaşımlar",
    platforms: "Instagram · Facebook",
  },
  CAROUSEL: {
    label: "Karusel",
    short: "5–8 kaydırmalı slayt",
    produces: "Slayt metinleri + her slayt için görsel fikri",
    bestFor: "Özellik anlatmak, önce/sonra, oda turu",
    platforms: "Instagram · Facebook · LinkedIn",
  },
  STORY: {
    label: "Story dizisi",
    short: "3–5 kısa story karesi",
    produces: "Sıralı metin + süre önerisi + sticker/CTA",
    bestFor: "Bugün gösterim, açık kapı, hızlı hatırlatma",
    platforms: "Instagram · Facebook",
  },
  REEL: {
    label: "Reel / Shorts",
    short: "15–30 sn dikey video planı",
    produces: "Hook, sahne planı, müzik, altyazı, CTA bitiş",
    bestFor: "Keşfet trafiği, villa/manzara, lifestyle",
    platforms: "Instagram · TikTok · YouTube Shorts",
  },
  LINKEDIN_POST: {
    label: "LinkedIn",
    short: "Yatırımcı / B2B odaklı yazı",
    produces: "Kurumsal paragraf + CTA + SEO anahtar kelime",
    bestFor: "Ticari, ofis, proje lansmanı, network",
    platforms: "LinkedIn",
  },
  GBP_POST: {
    label: "Google İşletme",
    short: "Yerel arama duyurusu",
    produces: "Kısa metin + CTA (ara / yol tarifi)",
    bestFor: "Mahalle görünürlüğü, ofis etkinliği",
    platforms: "Google Business",
  },
};

export const TONE_GUIDE: Record<
  ToneKey,
  { label: string; vibe: string; sample: string; useWhen: string }
> = {
  luxury: {
    label: "Lüks",
    vibe: "Sakin, seçkin, az kelime",
    sample: "Boğaz’a bakan sessiz bir yaşam…",
    useWhen: "Villa, boğaz, ultra yüksek fiyat",
  },
  premium: {
    label: "Premium",
    vibe: "Kaliteli ama erişilebilir lüks",
    sample: "Detaylarda fark yaratan bir adres.",
    useWhen: "Üst segment daire / site içi",
  },
  professional: {
    label: "Profesyonel",
    vibe: "Net, güven veren, abartısız",
    sample: "3+1, ışık alan, metroya 8 dk.",
    useWhen: "Günlük ilanların varsayılanı",
  },
  corporate: {
    label: "Kurumsal",
    vibe: "Ofis dili, yatırımcı tonu",
    sample: "Portföyümüze eklenen yeni fırsat.",
    useWhen: "Kurumsal müşteri, LinkedIn",
  },
  friendly: {
    label: "Samimi",
    vibe: "Komşu gibi, sıcak",
    sample: "Bu evi görünce “evet” diyeceksiniz.",
    useWhen: "Aile, kiralık, mahalle odaklı",
  },
  emotional: {
    label: "Duygusal",
    vibe: "Hayat tarzı, his",
    sample: "Sabah kahvenizi balkonda içebileceğiniz bir yer.",
    useWhen: "Lifestyle, story, reel",
  },
  minimal: {
    label: "Minimal",
    vibe: "Kısa, temiz, modern",
    sample: "Kadıköy. 2+1. Taşınmaya hazır.",
    useWhen: "Genç kitle, sade markalar",
  },
  urgent: {
    label: "Acil",
    vibe: "Tempo yüksek, net CTA",
    sample: "Bu hafta sonu son gösterimler.",
    useWhen: "Fiyat düştü, az kaldı, açık kapı",
  },
  high_converting: {
    label: "Yüksek dönüşüm",
    vibe: "Fayda → kanıt → CTA",
    sample: "Planı inceleyin · WhatsApp’tan randevu alın.",
    useWhen: "Lead toplamak öncelikliyse",
  },
};

export type ContentPack = {
  id: string;
  title: string;
  desc: string;
  format: FormatKey;
  tone: ToneKey;
  /** Listing purpose SALE | RENT | both */
  purposes: Array<"SALE" | "RENT" | "ANY">;
  /** Rough price band in TRY — null = any */
  minPrice?: number;
  maxPrice?: number;
  types?: string[]; // ListingType values
  badge?: string;
  /** AI Stüdyo şablon anahtarı (lib/studio-templates) — video paketleri */
  studioTemplateKey?: string;
};

/** Tek tıkla format+ton seçen hazır paketler */
export const CONTENT_PACKS: ContentPack[] = [
  {
    id: "new-listing",
    title: "Yeni ilan duyurusu",
    desc: "Tek kare + net caption. Portföye yeni giren her ilan için.",
    format: "FEED_POST",
    tone: "professional",
    purposes: ["ANY"],
    badge: "En çok kullanılan",
  },
  {
    id: "feature-carousel",
    title: "Özellik karuseli",
    desc: "Oda oda / avantaj avantaj kaydırma. Detay anlatmak için.",
    format: "CAROUSEL",
    tone: "friendly",
    purposes: ["ANY"],
  },
  {
    id: "luxury-reel",
    title: "Lüks reel",
    desc: "Hook + sahne planı. Villa ve yüksek segment için Keşfet. Stüdyo: Lüks Vitrin.",
    format: "REEL",
    tone: "luxury",
    purposes: ["SALE"],
    minPrice: 15_000_000,
    types: ["VILLA", "HOUSE"],
    badge: "Villa / lüks",
    studioTemplateKey: "luxury_showcase",
  },
  {
    id: "rental-fast",
    title: "Kiralık hızlı",
    desc: "Samimi ton + acil CTA. Boş kalan daireyi hızla doldur.",
    format: "FEED_POST",
    tone: "urgent",
    purposes: ["RENT"],
    badge: "Kiralık",
  },
  {
    id: "open-house",
    title: "Açık kapı / gösterim",
    desc: "Story dizisi: tarih, saat, adres, RSVP.",
    format: "STORY",
    tone: "friendly",
    purposes: ["ANY"],
  },
  {
    id: "price-drop",
    title: "Fiyat güncellemesi",
    desc: "Dikkat çeken ama abartısız ‘fırsat’ dili.",
    format: "FEED_POST",
    tone: "high_converting",
    purposes: ["SALE", "RENT"],
  },
  {
    id: "investor-linkedin",
    title: "Yatırımcı LinkedIn",
    desc: "Getiri / lokasyon / potansiyel — B2B ton.",
    format: "LINKEDIN_POST",
    tone: "corporate",
    purposes: ["SALE"],
    types: ["OFFICE", "COMMERCIAL", "LAND"],
    badge: "Ticari",
  },
  {
    id: "local-gbp",
    title: "Mahalle Google post",
    desc: "Yerel aramada ofisi öne çıkarır.",
    format: "GBP_POST",
    tone: "professional",
    purposes: ["ANY"],
  },
  {
    id: "lifestyle",
    title: "Yaşam tarzı",
    desc: "Duygusal caption + reel. Stüdyo: FPV Reels veya Sosyal Medya Reklamı.",
    format: "REEL",
    tone: "emotional",
    purposes: ["SALE", "RENT"],
    studioTemplateKey: "fpv_reels",
  },
  {
    id: "social-promo-reel",
    title: "Sosyal reklam reeli",
    desc: "9:16 reklam ritmi. Caption + Stüdyo Sosyal Medya Reklamı şablonu.",
    format: "REEL",
    tone: "high_converting",
    purposes: ["ANY"],
    badge: "Stüdyo",
    studioTemplateKey: "social_promo",
  },
  {
    id: "minimal-genz",
    title: "Minimal / genç",
    desc: "Kısa metin, temiz estetik. Stüdyo ve 1+1 için.",
    format: "FEED_POST",
    tone: "minimal",
    purposes: ["RENT", "SALE"],
  },
];

export type ListingHint = {
  purpose: string;
  type: string;
  price: number;
};

export function scorePack(pack: ContentPack, listing: ListingHint | null): number {
  if (!listing) return pack.id === "new-listing" ? 10 : 0;
  let score = 0;
  const purposeOk =
    pack.purposes.includes("ANY") ||
    pack.purposes.includes(listing.purpose as "SALE" | "RENT");
  if (!purposeOk) return -1;
  score += 2;
  if (pack.types?.includes(listing.type)) score += 5;
  if (pack.minPrice != null && listing.price >= pack.minPrice) score += 3;
  if (pack.maxPrice != null && listing.price <= pack.maxPrice) score += 2;
  if (pack.id === "new-listing") score += 1;
  if (listing.purpose === "RENT" && pack.id === "rental-fast") score += 4;
  return score;
}

export function recommendedPacks(
  listing: ListingHint | null,
  limit = 4,
): ContentPack[] {
  return CONTENT_PACKS.map((p) => ({ p, s: scorePack(p, listing) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.p);
}

/** Geriye dönük uyum — eski select listeleri */
export const FORMAT_OPTIONS = (Object.keys(FORMAT_GUIDE) as FormatKey[]).map(
  (value) => ({ value, ...FORMAT_GUIDE[value] }),
);

export const TONE_OPTIONS = (Object.keys(TONE_GUIDE) as ToneKey[]).map(
  (value) => ({ value, ...TONE_GUIDE[value] }),
);
