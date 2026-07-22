import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      name: true,
      phone: true,
      city: true,
      district: true,
      plan: true,
      commissionRate: true,
      agentSharePct: true,
      portalSahibinden: true,
      portalHepsiemlak: true,
      portalEmlakjet: true,
      portalArabam: true,
      portalSahibindenAuto: true,
      feedToken: true,
      vertical: true,
      showcaseEnabled: true,
      showcaseHeadline: true,
      showcaseTagline: true,
      whatsapp: true,
      aboutTitle: true,
      aboutText: true,
      visionText: true,
      aboutStats: true,
      showTeam: true,
      brandColor: true,
      logoUrl: true,
      officePhotoUrl: true,
      contractCompanyTitle: true,
      contractRepresentative: true,
      contractAddress: true,
      contractTaxNo: true,
      contractExtraClauses: true,
    },
  });

  // feedToken yoksa lazy üret (portal feed URL'i için)
  if (tenant && !tenant.feedToken) {
    const feedToken = randomBytes(24).toString("hex");
    await prisma.tenant.update({
      where: { id: session.tenantId },
      data: { feedToken },
    });
    tenant = { ...tenant, feedToken };
  }

  return NextResponse.json({ tenant });
}

/** Yalnız OWNER güncelleyebilir */
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (session.role !== "OWNER") {
    return NextResponse.json(
      { error: "Ayarları yalnız ofis sahibi değiştirebilir." },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => ({}));

  const rate =
    body.commissionRate !== undefined ? Number(body.commissionRate) : undefined;
  const share =
    body.agentSharePct !== undefined ? Number(body.agentSharePct) : undefined;
  if (rate !== undefined && (isNaN(rate) || rate < 0 || rate > 20)) {
    return NextResponse.json(
      { error: "Komisyon oranı 0-20 arası olmalı." },
      { status: 400 },
    );
  }
  if (share !== undefined && (isNaN(share) || share < 0 || share > 100)) {
    return NextResponse.json(
      { error: "Danışman payı 0-100 arası olmalı." },
      { status: 400 },
    );
  }

  const tenant = await prisma.tenant.update({
    where: { id: session.tenantId },
    data: {
      ...(body.name !== undefined && { name: String(body.name).slice(0, 80) }),
      ...(body.phone !== undefined && { phone: body.phone || null }),
      ...(body.city !== undefined && { city: body.city || null }),
      ...(body.district !== undefined && { district: body.district || null }),
      ...(rate !== undefined && { commissionRate: rate }),
      ...(share !== undefined && { agentSharePct: share }),
      ...(body.portalSahibinden !== undefined && {
        portalSahibinden: !!body.portalSahibinden,
      }),
      ...(body.portalHepsiemlak !== undefined && {
        portalHepsiemlak: !!body.portalHepsiemlak,
      }),
      ...(body.portalEmlakjet !== undefined && {
        portalEmlakjet: !!body.portalEmlakjet,
      }),
      ...(body.portalArabam !== undefined && {
        portalArabam: !!body.portalArabam,
      }),
      ...(body.portalSahibindenAuto !== undefined && {
        portalSahibindenAuto: !!body.portalSahibindenAuto,
      }),
      ...(body.showcaseEnabled !== undefined && {
        showcaseEnabled: !!body.showcaseEnabled,
      }),
      ...(body.showcaseHeadline !== undefined && {
        showcaseHeadline: body.showcaseHeadline
          ? String(body.showcaseHeadline).slice(0, 90)
          : null,
      }),
      ...(body.showcaseTagline !== undefined && {
        showcaseTagline: body.showcaseTagline
          ? String(body.showcaseTagline).slice(0, 160)
          : null,
      }),
      ...(body.whatsapp !== undefined && { whatsapp: body.whatsapp || null }),
      ...(body.aboutTitle !== undefined && {
        aboutTitle: body.aboutTitle
          ? String(body.aboutTitle).slice(0, 90)
          : null,
      }),
      ...(body.aboutText !== undefined && {
        aboutText: body.aboutText ? String(body.aboutText).slice(0, 800) : null,
      }),
      ...(body.visionText !== undefined && {
        visionText: body.visionText
          ? String(body.visionText).slice(0, 200)
          : null,
      }),
      ...(body.aboutStats !== undefined && {
        aboutStats: Array.isArray(body.aboutStats)
          ? body.aboutStats
              .slice(0, 3)
              .map((x: { value?: unknown; label?: unknown }) => ({
                value: String(x?.value ?? "").slice(0, 12),
                label: String(x?.label ?? "").slice(0, 24),
              }))
          : [],
      }),
      ...(body.showTeam !== undefined && { showTeam: !!body.showTeam }),
      ...(body.brandColor !== undefined && {
        brandColor: body.brandColor
          ? String(body.brandColor).slice(0, 7)
          : null,
      }),
      ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl || null }),
      ...(body.logoKey !== undefined && { logoKey: body.logoKey || null }),
      ...(body.officePhotoUrl !== undefined && { officePhotoUrl: body.officePhotoUrl || null }),
      ...(body.officePhotoKey !== undefined && { officePhotoKey: body.officePhotoKey || null }),
      ...(body.contractCompanyTitle !== undefined && {
        contractCompanyTitle: body.contractCompanyTitle
          ? String(body.contractCompanyTitle).slice(0, 120)
          : null,
      }),
      ...(body.contractRepresentative !== undefined && {
        contractRepresentative: body.contractRepresentative
          ? String(body.contractRepresentative).slice(0, 80)
          : null,
      }),
      ...(body.contractAddress !== undefined && {
        contractAddress: body.contractAddress
          ? String(body.contractAddress).slice(0, 200)
          : null,
      }),
      ...(body.contractTaxNo !== undefined && {
        contractTaxNo: body.contractTaxNo
          ? String(body.contractTaxNo).slice(0, 40)
          : null,
      }),
      ...(body.contractExtraClauses !== undefined && {
        contractExtraClauses: body.contractExtraClauses
          ? String(body.contractExtraClauses).slice(0, 1000)
          : null,
      }),
    },
  });

  return NextResponse.json({ ok: true, tenantName: tenant.name });
}
