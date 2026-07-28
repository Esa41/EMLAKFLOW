import { prisma } from "./prisma";

/**
 * Vitrin video katmanı — stüdyo çıktılarını (StudioProject.finalVideoUrl)
 * herkese açık vitrin sayfalarına bağlar. Cookie/header OKUMAZ; /ofis
 * rotalarının ISR/statik önbellek disiplinine uyar.
 */

export type ShowcaseVideo = {
  url: string;
  aspectRatio: string;
  /** Videonun hazır olduğu an — VideoObject JSON-LD uploadDate'i için. */
  updatedAt: Date;
};

/**
 * Ofisin TÜM tamamlanmış stüdyo videoları, ilan kimliğine göre.
 *
 * Vitrin ana sayfası yüzlerce aktif ilan listeleyebiliyor; bunları
 * `listingId: { in: [...] }` ile sormak devasa bir IN cümlesi üretirdi.
 * Stüdyo projesi sayısı ilan sayısından çok daha az olduğu için tek bir
 * kiracı sorgusu daha ucuz — ve `@@index([tenantId, status])` tam oturur.
 */
export async function getTenantListingVideos(
  tenantId: string,
): Promise<Map<string, ShowcaseVideo>> {
  const projects = await prisma.studioProject.findMany({
    where: { tenantId, status: "COMPLETED", finalVideoUrl: { not: null } },
    orderBy: { updatedAt: "desc" },
    select: {
      listingId: true,
      finalVideoUrl: true,
      aspectRatio: true,
      updatedAt: true,
    },
  });
  const map = new Map<string, ShowcaseVideo>();
  for (const p of projects) {
    // updatedAt desc — ilan başına ilk görülen en yenisidir
    if (!map.has(p.listingId)) {
      map.set(p.listingId, {
        url: p.finalVideoUrl!,
        aspectRatio: p.aspectRatio,
        updatedAt: p.updatedAt,
      });
    }
  }
  return map;
}

/** Tek ilanın en son tamamlanmış stüdyo videosu (ilan detay galerisi). */
export async function getListingVideo(
  listingId: string,
): Promise<ShowcaseVideo | null> {
  const p = await prisma.studioProject.findFirst({
    where: { listingId, status: "COMPLETED", finalVideoUrl: { not: null } },
    orderBy: { updatedAt: "desc" },
    select: { finalVideoUrl: true, aspectRatio: true, updatedAt: true },
  });
  return p
    ? { url: p.finalVideoUrl!, aspectRatio: p.aspectRatio, updatedAt: p.updatedAt }
    : null;
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
    select: { finalVideoUrl: true, aspectRatio: true, updatedAt: true },
  });
  return p
    ? { url: p.finalVideoUrl!, aspectRatio: p.aspectRatio, updatedAt: p.updatedAt }
    : null;
}
