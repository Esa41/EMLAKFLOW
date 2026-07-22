import { prisma } from "./prisma";

/**
 * Vitrin video katmanı — stüdyo çıktılarını (StudioProject.finalVideoUrl)
 * herkese açık vitrin sayfalarına bağlar. Cookie/header OKUMAZ; /ofis
 * rotalarının ISR/statik önbellek disiplinine uyar.
 */

export type ShowcaseVideo = { url: string; aspectRatio: string };

/** İlan başına en son TAMAMLANMIŞ stüdyo videosu (varsa). */
export async function getListingVideos(
  listingIds: string[],
): Promise<Map<string, ShowcaseVideo>> {
  if (listingIds.length === 0) return new Map();
  const projects = await prisma.studioProject.findMany({
    where: {
      listingId: { in: listingIds },
      status: "COMPLETED",
      finalVideoUrl: { not: null },
    },
    orderBy: { updatedAt: "desc" },
    select: { listingId: true, finalVideoUrl: true, aspectRatio: true },
  });
  const map = new Map<string, ShowcaseVideo>();
  for (const p of projects) {
    // updatedAt desc — ilk görülen ilan başına en yenisidir
    if (!map.has(p.listingId)) {
      map.set(p.listingId, { url: p.finalVideoUrl!, aspectRatio: p.aspectRatio });
    }
  }
  return map;
}

/** Ofis hero arka planı için en yeni yatay (16:9) tamamlanmış video. */
export async function getTenantHeroVideo(
  tenantId: string,
): Promise<ShowcaseVideo | null> {
  const p = await prisma.studioProject.findFirst({
    where: {
      tenantId,
      status: "COMPLETED",
      finalVideoUrl: { not: null },
      aspectRatio: "16:9",
    },
    orderBy: { updatedAt: "desc" },
    select: { finalVideoUrl: true, aspectRatio: true },
  });
  return p ? { url: p.finalVideoUrl!, aspectRatio: p.aspectRatio } : null;
}
