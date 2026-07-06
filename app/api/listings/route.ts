import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { findMatchingLeads } from "@/lib/matching";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const status = url.searchParams.get("status");
  const purpose = url.searchParams.get("purpose");

  const listings = await db.listing.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(purpose ? { purpose: purpose as never } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { refCode: { contains: q, mode: "insensitive" } },
              { neighborhood: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { media: { orderBy: { order: "asc" }, take: 1 }, agent: { select: { name: true } } },
  });

  return NextResponse.json({ listings });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);

  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.price || !body?.city || !body?.district) {
    return NextResponse.json(
      { error: "title, price, city ve district zorunlu." },
      { status: 400 }
    );
  }

  // refCode: EF-YYYY-NNNN — tenant başına sıralı
  const year = new Date().getFullYear();
  const count = await db.listing.count({
    where: { refCode: { startsWith: `EF-${year}-` } },
  });
  const refCode = `EF-${year}-${String(count + 1).padStart(4, "0")}`;

  const listing = await db.listing.create({
    data: {
      tenantId: session.tenantId,
      refCode,
      title: body.title,
      purpose: body.purpose ?? "SALE",
      type: body.type ?? "APARTMENT",
      status: body.status ?? "ACTIVE",
      price: body.price,
      currency: "TRY",
      city: body.city,
      district: body.district,
      neighborhood: body.neighborhood || null,
      address: body.address || null,
      lat: body.lat !== "" && body.lat != null ? Number(body.lat) : null,
      lng: body.lng !== "" && body.lng != null ? Number(body.lng) : null,
      rooms: body.rooms || null,
      grossArea: body.grossArea ? Number(body.grossArea) : null,
      netArea: body.netArea ? Number(body.netArea) : null,
      floor: body.floor !== "" && body.floor != null ? Number(body.floor) : null,
      totalFloors: body.totalFloors ? Number(body.totalFloors) : null,
      buildingAge: body.buildingAge !== "" && body.buildingAge != null ? Number(body.buildingAge) : null,
      heating: body.heating || null,
      dues: body.dues ? Number(body.dues) : null,
      deedStatus: body.deedStatus || null,
      creditEligible: body.creditEligible ?? true,
      furnished: body.furnished ?? false,
      inSite: body.inSite ?? false,
      description: body.description || null,
      parcelGeo: body.parcelGeo ?? undefined,
      agentId: session.userId,
    },
  });

  // Akıllı eşleştirme: yeni ilana uyan açık lead'ler
  const matches = await findMatchingLeads(db, listing);
  if (matches.length > 0) {
    await db.activity.create({
      data: {
        tenantId: session.tenantId,
        type: "NOTE",
        userId: session.userId,
        entity: "listing",
        entityId: listing.id,
        body: `${listing.refCode} eklendi — ${matches.length} açık taleple eşleşti (en yüksek skor: ${matches[0].score}).`,
      },
    });
    // Panel içi bildirim (zil)
    await db.notification.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        title: `${listing.refCode} — ${matches.length} taleple eşleşti`,
        body: `En yüksek skor %${matches[0].score}. Eşleşen müşterileri ilan detayında gör.`,
        href: `/portfoy/${listing.id}`,
      },
    });
  }

  return NextResponse.json(
    { listing, matchedLeads: matches.length, matches },
    { status: 201 }
  );
}
