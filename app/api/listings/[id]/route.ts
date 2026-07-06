import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { deleteObject } from "@/lib/r2";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;

  const listing = await forTenant(session.tenantId).listing.findUnique({
    where: { id },
    include: {
      media: { orderBy: { order: "asc" } },
      agent: { select: { id: true, name: true } },
    },
  });
  if (!listing) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json({ listing });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const num = (v: unknown) => (v === "" || v == null ? null : Number(v));

  try {
    const listing = await forTenant(session.tenantId).listing.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.purpose !== undefined && { purpose: body.purpose }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.district !== undefined && { district: body.district }),
        ...(body.neighborhood !== undefined && { neighborhood: body.neighborhood || null }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.lat !== undefined && { lat: num(body.lat) }),
        ...(body.lng !== undefined && { lng: num(body.lng) }),
        ...(body.rooms !== undefined && { rooms: body.rooms || null }),
        ...(body.grossArea !== undefined && { grossArea: num(body.grossArea) }),
        ...(body.netArea !== undefined && { netArea: num(body.netArea) }),
        ...(body.floor !== undefined && { floor: num(body.floor) }),
        ...(body.totalFloors !== undefined && { totalFloors: num(body.totalFloors) }),
        ...(body.buildingAge !== undefined && { buildingAge: num(body.buildingAge) }),
        ...(body.heating !== undefined && { heating: body.heating || null }),
        ...(body.dues !== undefined && { dues: num(body.dues) }),
        ...(body.deedStatus !== undefined && { deedStatus: body.deedStatus || null }),
        ...(body.creditEligible !== undefined && { creditEligible: !!body.creditEligible }),
        ...(body.furnished !== undefined && { furnished: !!body.furnished }),
        ...(body.inSite !== undefined && { inSite: !!body.inSite }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.parcelGeo !== undefined && { parcelGeo: body.parcelGeo ?? null }),
      },
    });
    return NextResponse.json({ listing });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  const db = forTenant(session.tenantId);

  const listing = await db.listing.findUnique({
    where: { id },
    include: { media: true },
  });
  if (!listing) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  // Önce R2'deki medya nesnelerini temizle (best-effort)
  await Promise.allSettled(listing.media.map((m) => deleteObject(m.key)));
  await db.listing.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
