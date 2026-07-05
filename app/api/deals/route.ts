import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const deals = await forTenant(session.tenantId).deal.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      contact: { select: { id: true, fullName: true, phone: true } },
      listing: { select: { id: true, refCode: true, title: true } },
      agent: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ deals });
}

/** Body: { contactId?, listingId?, leadId?, value? } → NEW aşamasında fırsat */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);

  const body = await req.json().catch(() => ({}));
  if (!body.contactId && !body.leadId) {
    return NextResponse.json(
      { error: "contactId veya leadId gerekli." },
      { status: 400 }
    );
  }

  const deal = await db.deal.create({
    data: {
      tenantId: session.tenantId,
      stage: "NEW",
      contactId: body.contactId ?? null,
      leadId: body.leadId ?? null,
      listingId: body.listingId ?? null,
      value: body.value ? Number(body.value) : null,
      agentId: session.userId,
    },
    include: {
      contact: { select: { id: true, fullName: true, phone: true } },
      listing: { select: { id: true, refCode: true, title: true } },
      agent: { select: { id: true, name: true } },
    },
  });

  await db.activity.create({
    data: {
      tenantId: session.tenantId,
      type: "STATUS_CHANGE",
      userId: session.userId,
      entity: "deal",
      entityId: deal.id,
      body: `Yeni fırsat açıldı${deal.contact ? ` — ${deal.contact.fullName}` : ""}.`,
    },
  });

  return NextResponse.json({ deal }, { status: 201 });
}
