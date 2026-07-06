import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { leadDataFromBody } from "@/lib/lead-payload";
import { LEAD_STATUS_TR } from "@/lib/lead-display";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await ctx.params;
  const db = forTenant(session.tenantId);
  const existing = await db.lead.findUnique({
    where: { id },
    select: { id: true, status: true, contact: { select: { fullName: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data = leadDataFromBody(body);
  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
  }

  const lead = await db.lead.update({
    where: { id },
    data,
  });

  if (body.status && body.status !== existing.status) {
    await db.activity.create({
      data: {
        tenantId: session.tenantId,
        type: "STATUS_CHANGE",
        userId: session.userId,
        entity: "lead",
        entityId: lead.id,
        body: `Talep durumu: ${LEAD_STATUS_TR[existing.status] ?? existing.status} → ${LEAD_STATUS_TR[String(body.status)] ?? body.status}${existing.contact ? ` (${existing.contact.fullName})` : ""}.`,
      },
    });
  }

  return NextResponse.json({ lead });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await ctx.params;
  const db = forTenant(session.tenantId);
  const existing = await db.lead.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });

  await db.lead.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
