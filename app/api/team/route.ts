import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

const ROLES = ["OWNER", "BROKER", "AGENT", "ASSISTANT"] as const;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const users = await forTenant(session.tenantId).user.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          listings: { where: { status: "ACTIVE" } },
          deals: { where: { stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } } },
        },
      },
    },
  });
  return NextResponse.json({ users });
}

/** Body: { name, email, password, role?, phone? } — yalnız OWNER */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (session.role !== "OWNER") {
    return NextResponse.json(
      { error: "Danışman eklemeyi yalnız ofis sahibi yapabilir." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  if (!body.name || !body.email || !body.password) {
    return NextResponse.json({ error: "name, email, password zorunlu." }, { status: 400 });
  }
  if (String(body.password).length < 8) {
    return NextResponse.json({ error: "Geçici şifre en az 8 karakter olmalı." }, { status: 400 });
  }
  const role = body.role && ROLES.includes(body.role) ? body.role : "AGENT";

  const email = String(body.email).toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Bu e-posta zaten kayıtlı." }, { status: 409 });
  }

  const user = await forTenant(session.tenantId).user.create({
    data: {
      tenantId: session.tenantId,
      name: String(body.name).slice(0, 80),
      email,
      passwordHash: await hash(String(body.password), 12),
      phone: body.phone || null,
      role,
    },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      isActive: true, createdAt: true,
      _count: {
        select: {
          listings: { where: { status: "ACTIVE" } },
          deals: { where: { stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } } },
        },
      },
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
