import type { Listing } from "@prisma/client";
import type { TenantClient } from "./tenant";
import { getMarketStats } from "./market";

export interface WeeklyReport {
  listingTitle: string;
  refCode: string;
  domDays: number;
  // Bu hafta
  impressions: number;
  views: number;
  clicks: number;
  contacts: number;
  // Önceki haftaya göre değişim (%), null = önceki hafta veri yok
  viewsChangePct: number | null;
  // Pazar karşılaştırması
  marketMedianSqm: number | null;
  marketAvgDom: number | null;
  askingSqm: number | null;
}

function countByType(
  events: Array<{ type: string }>,
): Record<string, number> {
  const c: Record<string, number> = {};
  for (const e of events) c[e.type] = (c[e.type] ?? 0) + 1;
  return c;
}

/** Bir ilan için son 7 gün + önceki 7 gün karşılaştırmalı özet + pazar durumu. */
export async function buildWeeklyReport(
  db: TenantClient,
  tenantId: string,
  listing: Listing,
): Promise<WeeklyReport> {
  const now = Date.now();
  const d7 = new Date(now - 7 * 86400000);
  const d14 = new Date(now - 14 * 86400000);

  const [thisWeek, prevWeek, market] = await Promise.all([
    db.listingEvent.findMany({
      where: { listingId: listing.id, createdAt: { gte: d7 } },
      select: { type: true },
    }),
    db.listingEvent.findMany({
      where: { listingId: listing.id, createdAt: { gte: d14, lt: d7 } },
      select: { type: true },
    }),
    getMarketStats(tenantId).catch(() => []),
  ]);

  const tw = countByType(thisWeek);
  const pw = countByType(prevWeek);

  const prevViews = pw.VIEW ?? 0;
  const viewsChangePct =
    prevViews > 0
      ? Math.round((((tw.VIEW ?? 0) - prevViews) / prevViews) * 100)
      : null;

  const mRow = market.find(
    (m) =>
      m.district === listing.district &&
      m.type === listing.type &&
      m.purpose === listing.purpose,
  );

  const area = listing.netArea ?? listing.grossArea ?? null;

  return {
    listingTitle: listing.title,
    refCode: listing.refCode,
    domDays: Math.floor((now - listing.createdAt.getTime()) / 86400000),
    impressions: tw.IMPRESSION ?? 0,
    views: tw.VIEW ?? 0,
    clicks: tw.CLICK ?? 0,
    contacts: tw.CONTACT ?? 0,
    viewsChangePct,
    marketMedianSqm: mRow?.medianSqmPrice ?? null,
    marketAvgDom: mRow?.avgDomActive ?? null,
    askingSqm: area ? Math.round(Number(listing.price) / area) : null,
  };
}
