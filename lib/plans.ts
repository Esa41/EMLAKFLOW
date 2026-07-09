import { prisma } from "./prisma";
import { forTenant } from "./tenant";
import { getSession } from "./auth";

/** Ücretsiz (Pro olmayan) planda izin verilen maksimum ilan sayısı. */
export const FREE_LISTING_LIMIT = 3;

/**
 * Paket mimarisi — İKİ katman: Ücretsiz + Pro (kullanıcı kararı, Tem 2026).
 * Fiyat OFİS BAŞINA (danışman başına DEĞİL: Türkiye pazarında per-seat
 * model hesap paylaşımıyla deliniyor; ayrıca kazanç paylaşımı modülü zaten
 * her danışmana kendi hesabını açtırıyor). Tüm özellikler Pro'da.
 * Gerekçeler: docs/fiyatlandirma-calismasi.md
 * Tenant.plan değerleri: trial | starter (eski, free sayılır) | pro
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
    userLimit: null, // sınırsız — "ofis başına tek fiyat" vaadinin parçası
    tagline: "Emlak ofisinin tüm işletim sistemi",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

/** Tenant.plan (serbest string) → paket anahtarı; bilinmeyenler free sayılır. */
export function planKeyFromTenant(plan: string | null | undefined): PlanKey {
  return plan === "pro" || plan === "premium" ? "pro" : "free";
}

/** Sınırsız ilan hakkı olan planlar ("premium" eski/legacy değer, pro sayılır). */
export function isPro(plan: string | null | undefined): boolean {
  return plan === "pro" || plan === "premium";
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
