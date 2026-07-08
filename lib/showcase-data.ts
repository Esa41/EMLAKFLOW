import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const CACHE_TTL = 300;

/** Aktif ilanlar — filtreleme sayfa tarafında in-memory yapılır. */
export function getCachedActiveListings(tenantId: string, slug: string) {
  return unstable_cache(
    async () =>
      prisma.listing.findMany({
        where: { tenantId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: {
          media: { orderBy: { order: "asc" }, take: 1 },
          _count: { select: { media: true } },
        },
      }),
    [`active-listings-${slug}`],
    { revalidate: CACHE_TTL, tags: [`listings:${slug}`, `showcase:${slug}`] },
  )();
}

export function getCachedDistricts(tenantId: string, slug: string) {
  return unstable_cache(
    async () =>
      prisma.listing.findMany({
        where: { tenantId, status: "ACTIVE" },
        select: { district: true },
        distinct: ["district"],
        orderBy: { district: "asc" },
      }),
    [`districts-${slug}`],
    { revalidate: CACHE_TTL, tags: [`listings:${slug}`] },
  )();
}

export function getCachedTeam(tenantId: string, slug: string) {
  return unstable_cache(
    async () =>
      prisma.user.findMany({
        where: { tenantId, isActive: true },
        orderBy: [{ role: "asc" }, { name: "asc" }],
        select: { id: true, name: true, role: true, photoUrl: true },
      }),
    [`team-${slug}`],
    { revalidate: CACHE_TTL, tags: [`showcase:${slug}`] },
  )();
}

export function getCachedHeroMedia(tenantId: string, slug: string) {
  return unstable_cache(
    async () =>
      prisma.listingMedia.findMany({
        where: { listing: { tenantId, status: "ACTIVE" } },
        orderBy: [{ listing: { createdAt: "desc" } }, { order: "asc" }],
        distinct: ["listingId"],
        take: 5,
        select: {
          url: true,
          cardUrl: true,
          alt: true,
          listing: { select: { title: true } },
        },
      }),
    [`hero-media-${slug}`],
    { revalidate: CACHE_TTL, tags: [`listings:${slug}`] },
  )();
}

export function getCachedRecentlyClosed(tenantId: string, slug: string) {
  return unstable_cache(
    async () =>
      prisma.listing.findMany({
        where: {
          tenantId,
          status: { in: ["SOLD", "RENTED"] },
          updatedAt: { gte: new Date(Date.now() - 60 * 86400000) },
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
        include: { media: { orderBy: { order: "asc" }, take: 1 } },
      }),
    [`recently-closed-${slug}`],
    { revalidate: CACHE_TTL, tags: [`listings:${slug}`] },
  )();
}

export function getCachedTenant(slug: string) {
  return unstable_cache(
    async () =>
      prisma.tenant.findUnique({
        where: { slug },
        select: {
          id: true,
          name: true,
          city: true,
          district: true,
          showcaseEnabled: true,
          showcaseTagline: true,
          aboutTitle: true,
          aboutText: true,
          visionText: true,
          aboutStats: true,
          showTeam: true,
          vertical: true,
          officePhotoUrl: true,
        },
      }),
    [`tenant-${slug}`],
    { revalidate: CACHE_TTL, tags: [`showcase:${slug}`] },
  )();
}
