import { prisma } from "./prisma";
import { forTenant } from "./tenant";
import { getSession } from "./auth";

/**
 * Ücretsiz planda izin verilen maksimum ilan sayısı. Bunu aşan ofis Pro'ya
 * (₺25.000/yıl) geçmek zorunda. Model: CRM ücretsiz (edinme kancası) →
 * gelir AI video kredilerinden + 20+ ilanlı ofisin yıllık paketinden.
 */
export const FREE_LISTING_LIMIT = 20;

/**
 * Paket mimarisi: CRM ÜCRETSİZ (20 ilana kadar) → 20+ ilan mecburi Pro.
 * Video her planda AYRI KREDİ (satın alınır, sıfırlanmaz). Foto aylık hediye.
 * Tenant.plan: trial | free | pro | premium
 */
export const PLANS = {
  free: {
    key: "free",
    name: "Ücretsiz",
    monthlyTRY: 0,
    yearlyTRY: 0,
    listingLimit: FREE_LISTING_LIMIT,
    userLimit: null,
    tagline: "Emlak ofisinin ücretsiz işletim sistemi",
  },
  pro: {
    key: "pro",
    name: "Pro",
    monthlyTRY: 0, // yalnızca yıllık
    yearlyTRY: 25000, // 20+ ilanlı ofis için mecburi yıllık paket
    listingLimit: null, // sınırsız
    userLimit: null,
    tagline: "20+ ilanlı ofisler için — sınırsız portföy",
  },
  premium: {
    key: "premium",
    name: "Premium",
    monthlyTRY: 0, // satış / özel fiyat
    yearlyTRY: 0,
    listingLimit: null,
    userLimit: null,
    tagline: "Kendi markanız, kendi alan adınız",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

/**
 * AI Stüdyo aylık ÜCRETSİZ FOTO hakkı (plan bazlı reset).
 * VIDEO buraya girmez — video satın alınan kredidir (sıfırlanmaz, bkz.
 * CREDIT_TOPUP_PACKS). Foto ucuz (~₺5/adet) → aylık hediye, edinme kancası.
 * Tek kaynak — app/actions/studio.ts PLAN_CREDITS buradan türer.
 */
export const STUDIO_ALLOTMENT = {
  free: { image: 10, video: 0 }, // ücretsiz aylık 10 foto (video: satın alınır)
  pro: { image: 100, video: 0 },
  premium: { image: 500, video: 0 },
} as const;

/**
 * Video kredisi paketleri. Video her planda satın alınır — kredi bakiyesi
 * ay sonunda SIFIRLANMAZ, kullanılana dek kalır. Gerçek maliyet ~₺125/video
 * (10sn/720p); fiyatlar 2.4-3.2x marjlı. Kur değişince güncellenmeli.
 * Şimdilik manuel havale → süper-admin bakiyeyi yükler.
 */
export const CREDIT_TOPUP_PACKS = [
  { key: "v1", videos: 1, priceTRY: 400 },
  { key: "v5", videos: 5, priceTRY: 2000, badge: "Popüler" },
  { key: "v10", videos: 10, priceTRY: 3000, badge: "En avantajlı" },
] as const;

/** Tenant.plan (serbest string) → paket anahtarı. */
export function planKeyFromTenant(plan: string | null | undefined): PlanKey {
  if (plan === "premium") return "premium";
  if (plan === "pro") return "pro";
  return "free";
}

/** Sınırsız ilan / Pro özellikleri (Premium dahil). */
export function isPro(plan: string | null | undefined): boolean {
  return plan === "pro" || plan === "premium";
}

/** White-label + panelde EmlakFlow gizleme hakkı. */
export function isPremium(plan: string | null | undefined): boolean {
  return plan === "premium";
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

/**
 * Giriş yapan kullanıcının süper-admin olup olmadığını güvenilir şekilde
 * kontrol eder. E-postayı JWT yerine DB'den (userId üzerinden) okur; böylece
 * session token'ında email taşınmasa bile doğru çalışır.
 */
export async function currentUserIsSuperAdmin(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  });
  return isSuperAdmin(user?.email);
}

export interface ListingUsage {
  plan: string;
  isPro: boolean;
  count: number;
  limit: number | null; // null = sınırsız
  canCreate: boolean;
}

/**
 * Bir ofisin (tenant) plan durumunu ve ilan kullanımını döndürür.
 * Sayım ofis bazında ve tüm ilanları kapsar (statü farketmez).
 */
export async function getListingUsage(tenantId: string): Promise<ListingUsage> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });
  const plan = tenant?.plan ?? "trial";
  const pro = isPro(plan);

  const db = forTenant(tenantId);
  const count = await db.listing.count();

  const limit = pro ? null : FREE_LISTING_LIMIT;
  const canCreate = pro || count < FREE_LISTING_LIMIT;

  return { plan, isPro: pro, count, limit, canCreate };
}
