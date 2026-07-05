import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

type Ctx = { params: Promise<{ id: string }> };
const ROLES = ["OWNER", "BROKER", "AGENT", "ASSISTANT"] as const;

/** Body: { role?, isActive?, name?, phone? } — yalnız OWNER */
export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (session.role !== "OWNER") {
    return NextResponse.json({ error: "Bu işlem için yetkin yok." }, { status: 403 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const db = forTenant(session.tenantId);

  if (body.role && !ROLES.includes(body.role)) {
    return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 });
  }

  // Kilitlenme korumaları
  if (id === session.userId) {
    if (body.isActive === false) {
      return NextResponse.json(
        { error: "Kendi hesabını pasife alamazsın." },
        { status: 400 }
      );
    }
    if (body.role && body.role !== "OWNER") {
      const otherOwners = await db.user.count({
        where: { role: "OWNER", isActive: true, id: { not: id } },
      });
      if (otherOwners === 0) {
        return NextResponse.json(
          { error: "Ofisin tek sahibisin — önce başka bir OWNER ata." },
          { status: 400 }
        );
      }
    }
  }

  try {
    const user = await db.user.update({
      where: { id },
      data: {
        ...(body.role !== undefined && { role: body.role }),
        ...(body.isActive !== undefined && { isActive: !!body.isActive }),
        ...(body.name !== undefined && { name: String(body.name).slice(0, 80) }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
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
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}
