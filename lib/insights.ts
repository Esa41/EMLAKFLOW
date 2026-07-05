import { prisma } from "./prisma";
import { getMarketStats } from "./market";
import type { InsightSeverity } from "@prisma/client";

/**
 * Insight motoru (IF/THEN) — gecelik cron tüm tenant'lar için koşturur.
 * Kurallar deterministiktir; AI yalnızca ileride metin zenginleştirmede kullanılacak.
 * Tekrar üretimi önlemek için: aynı (listingId, rule) için son 7 günde
 * kapatılmamış bir insight varsa yenisi açılmaz.
 */

interface Candidate {
  tenantId: string;
  listingId?: string | null;
  rule: string;
  severity: InsightSeverity;
  title: string;
  body: string;
  data?: object;
}

const DEDUP_DAYS = 7;
const FALLBACK_DOM_LIMIT = 60; // bölgede kapanış verisi yoksa eşik (gün)

export async function runInsightRules(tenantId: string): Promise<number> {
  const now = Date.now();
  const candidates: Candidate[] = [];

  const [listings, market, staleLeads, expiringAuths] = await Promise.all([
    prisma.listing.findMany({
      where: { tenantId, status: "ACTIVE" },
      select: {
        id: true, refCode: true, title: true, city: true, district: true,
        type: true, purpose: true, price: true, netArea: true, createdAt: true,
      },
    }),
    getMarketStats(tenantId),
    prisma.lead.findMany({
      where: {
        tenantId,
        status: "OPEN",
        updatedAt: { lt: new Date(now - 14 * 86400000) },
      },
      select: { id: true, contact: { select: { fullName: true } }, note: true },
      take: 20,
    }),
    prisma.contract.findMany({
      where: {
        tenantId,
        type: "AUTHORIZATION",
        expiresAt: { gte: new Date(), lt: new Date(now + 15 * 86400000) },
      },
      select: {
        id: true, expiresAt: true,
        listing: { select: { id: true, refCode: true, title: true } },
        contact: { select: { fullName: true } },
      },
    }),
  ]);

  const segment = (l: (typeof listings)[number]) =>
    market.find(
      (m) => m.city === l.city && m.district === l.district &&
             m.type === l.type && m.purpose === l.purpose
    );

  for (const l of listings) {
    const seg = segment(l);
    const dom = Math.floor((now - l.createdAt.getTime()) / 86400000);

    // DOM_HIGH — bölge kapanış ortalamasının %25 üzerinde yayında
    const domLimit = seg?.avgDomClosed ? seg.avgDomClosed * 1.25 : FALLBACK_DOM_LIMIT;
    if (dom > domLimit) {
      candidates.push({
        tenantId,
        listingId: l.id,
        rule: "DOM_HIGH",
        severity: "ACTION",
        title: `${l.refCode} — ${dom} gündür yayında`,
        body: seg?.avgDomClosed
          ? `Bölgede benzer ilanlar ortalama ${Math.round(seg.avgDomClosed)} günde kapanıyor. Fotoğraf setini ve başlığı yenilemeyi, fiyatı gözden geçirmeyi düşünün.`
          : `İlan ${dom} gündür yayında. Fotoğraf setini ve başlığı yenilemeyi, fiyatı gözden geçirmeyi düşünün.`,
        data: { dom, avgDomClosed: seg?.avgDomClosed ?? null },
      });
    }

    // PRICE_ABOVE_MARKET — m² fiyatı bölge medyanının %10 üzerinde
    if (seg?.medianSqmPrice && l.netArea && l.netArea > 0) {
      const sqm = Number(l.price) / l.netArea;
      const ratio = sqm / seg.medianSqmPrice;
      if (ratio > 1.1 && seg.activeCount >= 3) {
        candidates.push({
          tenantId,
          listingId: l.id,
          rule: "PRICE_ABOVE_MARKET",
          severity: "ACTION",
          title: `${l.refCode} — fiyat bölge medyanının %${Math.round((ratio - 1) * 100)} üzerinde`,
          body: `m² fiyatınız ${Math.round(sqm).toLocaleString("tr-TR")} ₺, ${l.district} ${l.purpose === "SALE" ? "satılık" : "kiralık"} medyanı ${Math.round(seg.medianSqmPrice).toLocaleString("tr-TR")} ₺. Güncelleme, dönüşümü hızlandırabilir.`,
          data: { sqm, median: seg.medianSqmPrice, ratio },
        });
      }
    }
  }

  // STALE_LEAD — 14 gündür işlem görmeyen açık talepler
  for (const lead of staleLeads) {
    candidates.push({
      tenantId,
      rule: "STALE_LEAD",
      severity: "INFO",
      title: `Soğuyan talep: ${lead.contact?.fullName ?? "İsimsiz"}`,
      body: "Bu talep 14 gündür güncellenmedi — arayıp durumu netleştirin, uygunsa kapatın.",
      data: { leadId: lead.id },
    });
  }

  // AUTH_EXPIRING — 15 gün içinde biten yetki belgeleri
  for (const c of expiringAuths) {
    const days = Math.ceil((c.expiresAt!.getTime() - now) / 86400000);
    candidates.push({
      tenantId,
      listingId: c.listing?.id ?? null,
      rule: "AUTH_EXPIRING",
      severity: "URGENT",
      title: `Yetki belgesi ${days} gün içinde bitiyor${c.listing ? ` — ${c.listing.refCode}` : ""}`,
      body: `${c.contact?.fullName ?? "Mülk sahibi"} ile yenileme görüşmesi planlayın. Yetkisiz kalan portföy, kaybedilen portföydür.`,
      data: { contractId: c.id, expiresAt: c.expiresAt },
    });
  }

  // Tekilleştirme: son 7 günde aynı kural+ilan için üretilmişse atla
  const recent = await prisma.insight.findMany({
    where: { tenantId, createdAt: { gte: new Date(now - DEDUP_DAYS * 86400000) } },
    select: { listingId: true, rule: true, data: true },
  });
  const seen = new Set(
    recent.map((r) => `${r.rule}:${r.listingId ?? (r.data as { leadId?: string })?.leadId ?? "t"}`)
  );

  let created = 0;
  for (const c of candidates) {
    const key = `${c.rule}:${c.listingId ?? (c.data as { leadId?: string })?.leadId ?? "t"}`;
    if (seen.has(key)) continue;
    await prisma.insight.create({
      data: {
        tenantId: c.tenantId,
        listingId: c.listingId ?? null,
        rule: c.rule,
        severity: c.severity,
        title: c.title,
        body: c.body,
        data: c.data as object | undefined,
      },
    });
    created++;
  }

  return created;
}
