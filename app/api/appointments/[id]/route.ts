import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

type Ctx = { params: Promise<{ id: string }> };

const STATUSES = ["SCHEDULED", "DONE", "CANCELLED", "NO_SHOW"] as const;

/** Body: { status?, title?, startsAt?, endsAt?, note? } */
export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  if (body.status && !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  }

  try {
    const appointment = await forTenant(session.tenantId).appointment.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.title !== undefined && { title: String(body.title).slice(0, 140) }),
        ...(body.startsAt !== undefined && { startsAt: new Date(body.startsAt) }),
        ...(body.endsAt !== undefined && { endsAt: body.endsAt ? new Date(body.endsAt) : null }),
        ...(body.note !== undefined && { note: body.note || null }),
      },
      include: {
        contact: { select: { id: true, fullName: true, phone: true } },
        listing: { select: { id: true, refCode: true, title: true } },
        agent: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ appointment });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    await forTenant(session.tenantId).appointment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}
