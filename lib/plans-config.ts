// ── Plan / fiyat sabitleri — İSTEMCİ-GÜVENLİ tek kaynak ──
// Server bağımlılığı yok (prisma/auth burada YASAK) — hem landing hem admin
// modalı hem server action'lar buradan okur. Server yardımcıları lib/plans.ts.
// Fiyat kararları: Esa, 24 Tem 2026 — video ₺450; Premium 10 video/ay ₺4.500;
// Kurumsal 50 video/ay ₺14.900; yıllıkta 2 ay hediye. Kur çalışması ₺50/$:
// AI video maliyeti ~₺100–137 → marj %70+; zarar eşiği kur ₺95+.

/**
 * Ücretsiz planda izin verilen maksimum ilan sayısı.
 * Merdiven: Ücretsiz 5 ilan → Pro 20 ilan (tek kullanıcı) → Premium sınırsız
 * ilan + sınırsız kullanıcı → Kurumsal (50+ ilanlı ofis, 50 video/ay).
 */
export const FREE_LISTING_LIMIT = 5;

/**
 * Paket mimarisi: Ücretsiz 5 ilan / Pro 20 ilan + TEK kullanıcı /
 * Premium sınırsız + 10 video/ay / Kurumsal sınırsız + 50 video/ay.
 * Video kredisi bakiyesi SIFIRLANMAZ; premium+ planlarda her ay plan hakkı
 * bakiyeye EKLENİR (bkz. STUDIO_ALLOTMENT).
 * Tenant.plan: trial | free | pro | premium | kurumsal
 */
export const PLANS = {
  free: {
    key: "free",
    name: "Ücretsiz",
    monthlyTRY: 0,
    yearlyTRY: 0,
    listingLimit: FREE_LISTING_LIMIT,
    userLimit: 1,
    tagline: "Emlak ofisinin ücretsiz işletim sistemi",
  },
  pro: {
    key: "pro",
    name: "Pro",
    monthlyTRY: 0, // yalnızca yıllık
    yearlyTRY: 25000,
    listingLimit: 20,
    userLimit: 1, // tek üye — ekip hesabı Premium'da
    tagline: "Büyüyen portföy için — 20 ilana kadar",
  },
  premium: {
    key: "premium",
    name: "Premium",
    monthlyTRY: 4500, // ayda 10 AI video dahil (video başı ₺450 çapası)
    yearlyTRY: 45000, // 2 ay hediye — krediyle alınsa 120 video = ₺54.000
    listingLimit: null, // sınırsız
    userLimit: null, // sınırsız — tüm ekip
    tagline: "Sınırsız ilan ve ekip + kendi markanız + ayda 10 AI video",
  },
  kurumsal: {
    key: "kurumsal",
    name: "Kurumsal",
    monthlyTRY: 14900, // ayda 50 AI video — video başı ₺298 (%34 hacim indirimi)
    yearlyTRY: 149000, // 2 ay hediye
    listingLimit: null,
    userLimit: null,
    tagline: "50+ ilanlı ofisler: ayda 50 AI video + tüm Premium haklar",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

/**
 * KREDİ BİRİMİ (Esa kararı, 24 Tem 2026): 1 tam video = 100 kredi.
 * Eski birim "1 kredi = 1 sahne" idi; ×20 çarpanıyla geçildi (5 sn sahne
 * 20, 10 sn 40, referans tur 100, avatar klip 60). Pazarlama algısı:
 * "1000 kredi" > "10 video". Mevcut bakiyeler deploy ile birlikte
 * scripts/migrate-credits-x20.ts ile ×20 taşınır.
 */
export const CREDITS_PER_VIDEO = 100;

/**
 * AI Stüdyo AYLIK plan hakları.
 * image: her ay bu değere RESET edilir (hediye — birikmez).
 * video: her ay bakiyeye EKLENİR (increment) — satın alınan krediler
 * korunur, plan hakkı üstüne biner. Kullanılmayan kredi devreder; bedeli
 * zaten plan ücretinde tahsil edildiği için maliyet riski sınırlıdır.
 * Tek kaynak — app/actions/studio.ts aylık reset buradan okur.
 */
export const STUDIO_ALLOTMENT = {
  free: { image: 10, video: 0 },
  pro: { image: 100, video: 0 },
  premium: { image: 500, video: 10 * CREDITS_PER_VIDEO }, // ayda 10 video
  kurumsal: { image: 1000, video: 50 * CREDITS_PER_VIDEO }, // ayda 50 video
} as const;

/**
 * Kredi ek paketleri — 100 kredi = ₺450 SABİT birim (Esa kararı: paket
 * indirimi yok, indirim Premium/Kurumsal aboneliğinde). Bakiye sıfırlanmaz.
 * Maliyet ~₺100–137/video (kur ₺50) → marj %70+.
 * Şimdilik manuel havale → süper-admin bakiyeyi yükler (CreditLog'a işlenir);
 * online ödeme (iyzico) bağlanınca webhook aynı CreditLog akışını kullanacak.
 */
export const CREDIT_TOPUP_PACKS = [
  { key: "k100", credits: 100, priceTRY: 450 },
  { key: "k500", credits: 500, priceTRY: 2250, badge: "Popüler" },
  { key: "k1000", credits: 1000, priceTRY: 4500, badge: "En avantajlı" },
] as const;

/** Tenant.plan (serbest string) → paket anahtarı. */
export function planKeyFromTenant(plan: string | null | undefined): PlanKey {
  if (plan === "kurumsal") return "kurumsal";
  if (plan === "premium") return "premium";
  if (plan === "pro") return "pro";
  return "free";
}

/** Sınırsız ilan / Pro özellikleri (Premium ve Kurumsal dahil). */
export function isPro(plan: string | null | undefined): boolean {
  return plan === "pro" || plan === "premium" || plan === "kurumsal";
}

/** White-label + panelde EmlakFlow gizleme hakkı (Kurumsal dahil). */
export function isPremium(plan: string | null | undefined): boolean {
  return plan === "premium" || plan === "kurumsal";
}

/**
 * AI Stüdyo TEST MODU — kredi kapıları kapalı, üretim sınırsız.
 * Test bitince env'den kaldırılır; kredi muhasebesi kaldığı yerden işler.
 * Not: kötüye kullanım tavanları (eşzamanlı/günlük iş sayısı) BU BAYRAKTAN
 * ETKİLENMEZ — kaçak döngü Fal bakiyesini yakmasın diye açık kalır.
 * Env çağrı anında okunur (Vercel'de değişince build gerekmesin).
 */
export function isStudioUnlimited(): boolean {
  return process.env.STUDIO_UNLIMITED === "true";
}

/**
 * Super-admin (site yöneticisi) e-posta kontrolü.
 * SUPER_ADMIN_EMAILS env'i virgülle ayrılmış e-posta listesi tutar.
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase().trim());
}
