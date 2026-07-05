import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

/** ?from=ISO&to=ISO aralığındaki randevular (varsayılan: -7 / +21 gün) */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const d = (n: number) => new Date(Date.now() + n * 86400000);

  const appointments = await forTenant(session.tenantId).appointment.findMany({
    where: {
      startsAt: {
        gte: from ? new Date(from) : d(-7),
        lte: to ? new Date(to) : d(21),
      },
    },
    orderBy: { startsAt: "asc" },
    include: {
      contact: { select: { id: true, fullName: true, phone: true } },
      listing: { select: { id: true, refCode: true, title: true } },
      agent: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ appointments });
}

/** Body: { title, startsAt, endsAt?, contactId?, listingId?, agentId?, note? } */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);

  const body = await req.json().catch(() => ({}));
  if (!body.title || !body.startsAt) {
    return NextResponse.json({ error: "title ve startsAt zorunlu." }, { status: 400 });
  }
  const startsAt = new Date(body.startsAt);
  if (isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Geçersiz tarih." }, { status: 400 });
  }

  const appointment = await db.appointment.create({
    data: {
      tenantId: session.tenantId,
      title: String(body.title).slice(0, 140),
      startsAt,
      endsAt: body.endsAt ? new Date(body.endsAt) : new Date(startsAt.getTime() + 3600000),
      contactId: body.contactId || null,
      listingId: body.listingId || null,
      agentId: body.agentId || session.userId,
      note: body.note || null,
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
      type: "MEETING",
      userId: session.userId,
      entity: "appointment",
      entityId: appointment.id,
      body: `Randevu oluşturuldu: ${appointment.title} — ${startsAt.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}.`,
    },
  });

  return NextResponse.json({ appointment }, { status: 201 });
}
