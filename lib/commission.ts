import { prisma } from "./prisma";
import type { TenantClient } from "./tenant";

/**
 * Komisyon motoru.
 * Kural (Türkiye piyasa standardı, tenant bazında ayarlanabilir):
 *   Satış   → işlem bedeli × commissionRate% (varsayılan %4)
 *   Kiralama → 1 kira bedeli
 * Danışman/ofis paylaşımı: agentSharePct (varsayılan %50).
 */
export function computeCommission(opts: {
  value: number;
  purpose: "SALE" | "RENT";
  commissionRate: number; // %
  agentSharePct: number; // %
}) {
  const gross =
    opts.purpose === "SALE" ? (opts.value * opts.commissionRate) / 100 : opts.value;
  const agentShare = (gross * opts.agentSharePct) / 100;
  return {
    gross: Math.round(gross * 100) / 100,
    agentShare: Math.round(agentShare * 100) / 100,
    officeShare: Math.round((gross - agentShare) * 100) / 100,
  };
}

/**
 * Deal CLOSED_WON olduğunda çağrılır. İdempotent: aynı deal için
 * ikinci kez komisyon üretmez. İlanı SOLD/RENTED, lead'i CONVERTED yapar.
 */
export async function onDealWon(
  db: TenantClient,
  tenantId: string,
  dealId: string
) {
  const existing = await db.commission.findFirst({ where: { dealId } });
  if (existing) return { created: false as const };

  const deal = await db.deal.findUnique({
    where: { id: dealId },
    include: { listing: { select: { id: true, purpose: true, status: true } } },
  });
  if (!deal || deal.value == null) return { created: false as const };

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { commissionRate: true, agentSharePct: true },
  });

  const purpose = deal.listing?.purpose ?? "SALE";
  const calc = computeCommission({
    value: Number(deal.value),
    purpose,
    commissionRate: Number(tenant?.commissionRate ?? 4),
    agentSharePct: tenant?.agentSharePct ?? 50,
  });

  await db.commission.create({
    data: {
      tenantId,
      dealId,
      agentId: deal.agentId,
      gross: calc.gross,
      agentShare: calc.agentShare,
      officeShare: calc.officeShare,
    },
  });

  if (deal.listing && deal.listing.status === "ACTIVE") {
    await db.listing.update({
      where: { id: deal.listing.id },
      data: { status: purpose === "SALE" ? "SOLD" : "RENTED" },
    });
  }
  if (deal.leadId) {
    await db.lead.update({
      where: { id: deal.leadId },
      data: { status: "CONVERTED" },
    });
  }

  return { created: true as const, ...calc };
}

/**
 * Kazanılan deal başka aşamaya geri çekilirse (yanlış sürükleme vb.):
 * ödenmemiş komisyonları siler, ilanı yayına geri alır. Ödenmiş komisyona dokunmaz.
 */
export async function onDealUnwon(db: TenantClient, dealId: string) {
  await db.commission.deleteMany({ where: { dealId, paidAt: null } });

  const deal = await db.deal.findUnique({
    where: { id: dealId },
    include: { listing: { select: { id: true, status: true } } },
  });
  if (deal?.listing && ["SOLD", "RENTED"].includes(deal.listing.status)) {
    await db.listing.update({
      where: { id: deal.listing.id },
      data: { status: "ACTIVE" },
    });
  }
}
