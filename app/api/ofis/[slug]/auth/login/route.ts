import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSiteSession } from "@/lib/site-auth";
import { loginLimiter } from "@/lib/rate-limit";
import { withRateLimit } from "@/lib/with-rate-limit";

type Ctx = { params: Promise<{ slug: string }> };

/** Vitrin üyeliği — alıcı/kiracı girişi. Body: { email, password } */
export async function POST(req: Request, ctx: Ctx) {
  return withRateLimit(req, loginLimiter, async () => {
    const { slug } = await ctx.params;
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, showcaseEnabled: true },
    });
    if (!tenant || !tenant.showcaseEnabled) {
      return NextResponse.json({ error: "Ofis bulunamadı" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta ve şifre gerekli." },
        { status: 400 },
      );
    }

    const user = await prisma.siteUser.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
    });
    if (!user || !(await compare(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "E-posta veya şifre hatalı." },
        { status: 401 },
      );
    }

    await createSiteSession(user.id, tenant.id);
    return NextResponse.json({ user: { name: user.name } });
  });
}
