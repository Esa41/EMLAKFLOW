// mv_market_stats materialized view'ini oluşturur (tek seferlik / şema değişince).
// Çalıştır: npx tsx scripts/create-market-view.ts
// Gecelik yenileme api/cron/rollup içinde (REFRESH ... CONCURRENTLY).
import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`DROP MATERIALIZED VIEW IF EXISTS mv_market_stats`);
  await prisma.$executeRawUnsafe(`
    CREATE MATERIALIZED VIEW mv_market_stats AS
    SELECT
      "tenantId", city, district, type::text AS type, purpose::text AS purpose,
      COUNT(*) FILTER (WHERE status = 'ACTIVE')                              AS active_count,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY price / NULLIF("netArea",0))
        FILTER (WHERE status = 'ACTIVE' AND "netArea" > 0)                   AS median_sqm_price,
      AVG(EXTRACT(EPOCH FROM (now() - "createdAt")) / 86400)
        FILTER (WHERE status = 'ACTIVE')                                     AS avg_dom_active,
      AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 86400)
        FILTER (WHERE status IN ('SOLD','RENTED'))                           AS avg_dom_closed
    FROM "Listing"
    GROUP BY "tenantId", city, district, type, purpose
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX mv_market_stats_key
    ON mv_market_stats ("tenantId", city, district, type, purpose)
  `);
  const rows = await prisma.$queryRawUnsafe<Array<{ n: number }>>(
    `SELECT count(*)::int AS n FROM mv_market_stats`
  );
  console.log(`mv_market_stats hazır — ${rows[0].n} satır.`);
}

main().finally(() => prisma.$disconnect());
