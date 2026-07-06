import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSiteSession } from "@/lib/site-auth";
import { syncSiteUserToContact } from "@/lib/site-crm-sync";

type Ctx = { params: Promise<{ slug: string }> };

/** Vitrin üyeliği — alıcı/kiracı kaydı. Body: { name, email, password, phone? } */
export async function POST(req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, showcaseEnabled: true },
  });
  if (!tenant || !tenant.showcaseEnabled) {
    return NextResponse.json({ error: "Ofis bulunamadı" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!name || !email.includes("@") || password.length < 6) {
    return NextResponse.json(
      { error: "Ad, geçerli e-posta ve en az 6 karakterli şifre gerekli." },
      { status: 400 },
    );
  }

  const existing = await prisma.siteUser.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Bu e-posta ile zaten üyelik var — giriş yapın." },
      { status: 409 },
    );
  }

  const user = await prisma.siteUser.create({
    data: {
      tenantId: tenant.id,
      name,
      email,
      passwordHash: await hash(password, 10),
      phone: body?.phone ? String(body.phone).trim() : null,
    },
    select: { id: true, name: true },
  });

  await syncSiteUserToContact({
    id: user.id,
    tenantId: tenant.id,
    name,
    email,
    phone: body?.phone ? String(body.phone).trim() : null,
  });

  await createSiteSession(user.id, tenant.id);
  return NextResponse.json({ user: { name: user.name } }, { status: 201 });
}
