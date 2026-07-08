import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Vertical } from "@prisma/client";
import { loginLimiter } from "@/lib/rate-limit";
import { withRateLimit } from "@/lib/with-rate-limit";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[ğ]/g, "g")
    .replace(/[ü]/g, "u")
    .replace(/[ş]/g, "s")
    .replace(/[ı]/g, "i")
    .replace(/[ö]/g, "o")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * POST /api/register
 * Yeni ofis (Tenant) + OWNER kullanıcısını tek transaction'da oluşturur.
 * Body: { officeName, city?, name, email, password, phone?, vertical? }
 */
export async function POST(req: Request) {
  return withRateLimit(req, loginLimiter, async () => {
    const body = await req.json().catch(() => null);
    if (!body?.officeName || !body?.name || !body?.email || !body?.password) {
      return NextResponse.json(
        { error: "officeName, name, email ve password zorunlu." },
        { status: 400 },
      );
    }
    if (String(body.password).length < 8) {
      return NextResponse.json(
        { error: "Şifre en az 8 karakter olmalı." },
        { status: 400 },
      );
    }

    const verticalRaw = String(body.vertical ?? "REAL_ESTATE").toUpperCase();
    const vertical: Vertical =
      verticalRaw === "AUTO_DEALER" ? "AUTO_DEALER" : "REAL_ESTATE";

    const email = String(body.email).toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Bu e-posta ile bir hesap zaten var." },
        { status: 409 },
      );
    }

    const base = slugify(body.officeName) || "ofis";
    let slug = base;
    for (let i = 2; await prisma.tenant.findUnique({ where: { slug } }); i++) {
      slug = `${base}-${i}`;
    }

    const passwordHash = await hash(String(body.password), 12);

    const tenant = await prisma.tenant.create({
      data: {
        name: body.officeName,
        slug,
        city: body.city ?? null,
        vertical,
        users: {
          create: {
            name: body.name,
            email,
            passwordHash,
            phone: body.phone ?? null,
            role: "OWNER",
          },
        },
      },
      include: { users: { select: { id: true, email: true } } },
    });

    return NextResponse.json(
      { tenantId: tenant.id, slug: tenant.slug, ownerId: tenant.users[0].id },
      { status: 201 },
    );
  });
}
