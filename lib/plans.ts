import { prisma } from "./prisma";
import { forTenant } from "./tenant";
import { getSession } from "./auth";

/** Ücretsiz (Pro olmayan) planda izin verilen maksimum ilan sayısı. */
export const FREE_LISTING_LIMIT = 3;

/**
 * Paket mimarisi — OFİS BAŞINA fiyat (danışman başına DEĞİL: Türkiye
 * pazarında per-seat model hesap paylaşımıyla deliniyor; ayrıca kazanç
 * paylaşımı modülü zaten her danışmana kendi hesabını açtırıyor).
 * Fiyat gerekçeleri: docs/fiyatlandirma-calismasi.md
 * Tenant.plan değerleri: trial | starter (eski, free sayılır) | pro | premium
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
    monthlyTRY: 1490,
    yearlyTRY: 14900, // 10 × aylık — 2 ay hediye
    listingLimit: null, // sınırsız
    userLimit: 10,
    tagline: "Portföyünü büyüten ofis için",
  },
  premium: {
    key: "premium",
    name: "Premium",
    monthlyTRY: 2990,
    yearlyTRY: 29900,
    listingLimit: null,
    userLimit: null, // sınırsız
    tagline: "AI ve analitikle satan ofis için",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

/** Tenant.plan (serbest string) → paket anahtarı; bilinmeyenler free sayılır. */
export function planKeyFromTenant(plan: string | null | undefined): PlanKey {
  if (plan === "pro") return "pro";
  if (plan === "premium") return "premium";
  return "free"; // trial, starter, null…
}

/** Sınırsız ilan hakkı olan planlar — premium, pro'nun üst kümesidir. */
export function isPro(plan: string | null | undefined): boolean {
  return plan === "pro" || plan === "premium";
}

/** Premium'a özel özellikler (AI paketi, analitik, rapor) için kapı. */
export function isPremium(plan: string | null | undefined): boolean {
  return plan === "premium";
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
