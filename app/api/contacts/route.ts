import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const contacts = await forTenant(session.tenantId).contact.findMany({
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, phone: true, email: true, type: true },
  });
  return NextResponse.json({ contacts });
}

/** Body: { fullName, phone?, email?, type?, note? } → yeni müşteri */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);

  const body = await req.json().catch(() => ({}));
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (!fullName) {
    return NextResponse.json({ error: "İsim gerekli." }, { status: 400 });
  }

  const contact = await db.contact.create({
    data: {
      tenantId: session.tenantId,
      fullName,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      note: body.note?.trim() || null,
      type: ["BUYER", "SELLER", "TENANT_C", "LANDLORD", "OTHER"].includes(body.type)
        ? body.type
        : "BUYER",
    },
    select: { id: true, fullName: true, phone: true, email: true, type: true },
  });

  await db.activity.create({
    data: {
      tenantId: session.tenantId,
      type: "NOTE",
      userId: session.userId,
      entity: "contact",
      entityId: contact.id,
      body: `Yeni müşteri eklendi — ${contact.fullName}.`,
    },
  });

  return NextResponse.json({ contact }, { status: 201 });
}
