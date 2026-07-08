import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refreshMarketStats } from "@/lib/market";
import { runInsightRules } from "@/lib/insights";

// Gecelik bakım işi (Vercel Cron → vercel.json: 03:00 UTC).
// 1) Son 3 günün ham ListingEvent kayıtlarını gün bazında ListingDailyStat'a
//    MUTLAK sayılarla upsert eder → tekrar çalıştırmak güvenlidir (idempotent).
// 2) 90 günden eski ham eventleri budar (özetler kalır).
// 3) mv_market_stats'ı yeniler (DOM / bölge medyanları).
// 4) Tenant başına insight kurallarını koşturur.
// Cross-tenant çalışır (cron) — sonuç tabloları yine tenantId taşır.

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 3);
  since.setUTCHours(0, 0, 0, 0);

  // Gün + ilan bazında pivotlanmış sayımlar (yalnız ilana bağlı olaylar)
  const rows = await prisma.$queryRaw<
    Array<{
      tenantId: string;
      listingId: string;
      day: Date;
      impressions: bigint;
      views: bigint;
      clicks: bigint;
      contacts: bigint;
      chats: bigint;
    }>
  >`
    SELECT
      "tenantId",
      "listingId",
      date_trunc('day', "createdAt")::date AS day,
      COUNT(*) FILTER (WHERE type = 'IMPRESSION') AS impressions,
      COUNT(*) FILTER (WHERE type = 'VIEW')       AS views,
      COUNT(*) FILTER (WHERE type = 'CLICK')      AS clicks,
      COUNT(*) FILTER (WHERE type = 'CONTACT')    AS contacts,
      COUNT(*) FILTER (WHERE type = 'CHAT')       AS chats
    FROM "ListingEvent"
    WHERE "createdAt" >= ${since} AND "listingId" IS NOT NULL
    GROUP BY "tenantId", "listingId", day
  `;

  for (const r of rows) {
    const counts = {
      impressions: Number(r.impressions),
      views: Number(r.views),
      clicks: Number(r.clicks),
      contacts: Number(r.contacts),
      chats: Number(r.chats),
    };
    await prisma.listingDailyStat.upsert({
      where: {
        tenantId_listingId_day: { tenantId: r.tenantId, listingId: r.listingId, day: r.day },
      },
      create: { tenantId: r.tenantId, listingId: r.listingId, day: r.day, ...counts },
      update: counts,
    });
  }

  // 90 günden eski ham eventleri buda
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 90);
  const pruned = await prisma.listingEvent.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  // Pazar istatistiklerini yenile, sonra insight kurallarını koştur
  await refreshMarketStats();

  const tenants = await prisma.tenant.findMany({ select: { id: true } });
  let insightsCreated = 0;
  for (const t of tenants) {
    insightsCreated += await runInsightRules(t.id).catch(() => 0);
  }

  return NextResponse.json({
    ok: true,
    upserted: rows.length,
    pruned: pruned.count,
    insights: insightsCreated,
  });
}
