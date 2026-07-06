import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  const db = forTenant(session.tenantId);
  const body = await req.json().catch(() => ({}));

  try {
    const agreement = await db.rentalAgreement.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.note !== undefined && { note: body.note || null }),
        ...(body.endDate !== undefined && { endDate: new Date(body.endDate) }),
      },
      include: {
        contact: { select: { id: true, fullName: true, phone: true } },
        listing: { select: { id: true, refCode: true, title: true } },
        payments: { orderBy: { dueDate: "asc" } },
      },
    });
    return NextResponse.json({ agreement });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    await forTenant(session.tenantId).rentalAgreement.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}
