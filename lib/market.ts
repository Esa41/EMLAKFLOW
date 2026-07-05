import { prisma } from "./prisma";

/**
 * mv_market_stats okuma katmanı.
 * DİKKAT: Materialized view sorguları forTenant() extension'ından GEÇMEZ —
 * tenant izolasyonu burada elle sağlanır. Bu dosya dışında mv_market_stats
 * sorgulanmaz; tenantId parametresi her fonksiyonda zorunludur.
 */

export interface MarketStat {
  city: string;
  district: string;
  type: string;
  purpose: string;
  activeCount: number;
  medianSqmPrice: number | null;
  avgDomActive: number | null;
  avgDomClosed: number | null;
}

export async function getMarketStats(tenantId: string): Promise<MarketStat[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      city: string;
      district: string;
      type: string;
      purpose: string;
      active_count: bigint;
      median_sqm_price: number | null;
      avg_dom_active: number | null;
      avg_dom_closed: number | null;
    }>
  >`
    SELECT city, district, type, purpose, active_count,
           median_sqm_price, avg_dom_active, avg_dom_closed
    FROM mv_market_stats
    WHERE "tenantId" = ${tenantId}
  `;
  return rows.map((r) => ({
    city: r.city,
    district: r.district,
    type: r.type,
    purpose: r.purpose,
    activeCount: Number(r.active_count),
    medianSqmPrice: r.median_sqm_price != null ? Number(r.median_sqm_price) : null,
    avgDomActive: r.avg_dom_active != null ? Number(r.avg_dom_active) : null,
    avgDomClosed: r.avg_dom_closed != null ? Number(r.avg_dom_closed) : null,
  }));
}

/** Gecelik cron çağırır — CONCURRENTLY sayesinde okumaları kilitlemez. */
export async function refreshMarketStats(): Promise<void> {
  await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_market_stats`);
}
