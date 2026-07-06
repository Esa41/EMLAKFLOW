import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { leadCreateDefaults, leadDataFromBody } from "@/lib/lead-payload";

/** Body: contactId + arama kriterleri → yeni talep */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const db = forTenant(session.tenantId);
  const body = await req.json().catch(() => ({}));
  const contactId = typeof body.contactId === "string" ? body.contactId.trim() : "";
  if (!contactId) {
    return NextResponse.json({ error: "contactId zorunlu." }, { status: 400 });
  }

  const contact = await db.contact.findUnique({
    where: { id: contactId },
    select: { id: true, fullName: true },
  });
  if (!contact) {
    return NextResponse.json({ error: "Kişi bulunamadı." }, { status: 404 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { city: true },
  });

  const lead = await db.lead.create({
    data: {
      tenantId: session.tenantId,
      contactId: contact.id,
      ...leadCreateDefaults(body, { city: tenant?.city }),
    },
  });

  await db.activity.create({
    data: {
      tenantId: session.tenantId,
      type: "NOTE",
      userId: session.userId,
      entity: "lead",
      entityId: lead.id,
      body: `Yeni talep — ${contact.fullName}.`,
    },
  });

  return NextResponse.json({ lead }, { status: 201 });
}
