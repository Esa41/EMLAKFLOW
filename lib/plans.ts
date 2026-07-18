import { prisma } from "./prisma";
import { forTenant } from "./tenant";
import { getSession } from "./auth";

/** Ücretsiz (Pro/Premium olmayan) planda izin verilen maksimum ilan sayısı. */
export const FREE_LISTING_LIMIT = 3;

/**
 * Paket mimarisi: Başlangıç + Pro + Premium (white-label).
 * Premium = Pro hakları + kendi marka / alan adı + panelde EmlakFlow gizleme.
 * Tenant.plan: trial | starter | free | pro | premium
 */
export const PLANS = {
  free: {
    key: "free",
    name: "Başlangıç",
    monthlyTRY: 0,
    yearlyTRY: 0,
    listingLimit: FREE_LISTING_LIMIT,
    userLimit: 1,
    tagline: "Tek başına çalışan danışman için",
  },
  pro: {
    key: "pro",
    name: "Pro",
    monthlyTRY: 2000,
    yearlyTRY: 20000, // 10 × aylık — 2 ay hediye
    listingLimit: null, // sınırsız
    userLimit: null,
    tagline: "Emlak ofisinin tüm işletim sistemi",
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
 * AI Stüdyo aylık dahil kredileri (plan bazlı reset).
 * Video pahalı (~₺100/adet gerçek maliyet) → cömert bundle'lanmaz; fazlası
 * top-up. Foto ucuz (~₺3.5) → cömert. Tek kaynak — app/actions/studio.ts
 * PLAN_CREDITS buradan türer.
 */
export const STUDIO_ALLOTMENT = {
  free: { image: 0, video: 0 },
  pro: { image: 100, video: 5 },
  premium: { image: 500, video: 15 },
} as const;

/**
 * Video kredisi top-up paketleri (şimdilik manuel havale → süper-admin yükler).
 * Fiyatlar ~₺100/video maliyet üzerine marjlı; kur değişince güncellenmeli.
 */
export const CREDIT_TOPUP_PACKS = [
  { key: "v5", videos: 5, priceTRY: 999 },
  { key: "v10", videos: 10, priceTRY: 1799, badge: "Popüler" },
  { key: "v25", videos: 25, priceTRY: 3999, badge: "En avantajlı" },
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
