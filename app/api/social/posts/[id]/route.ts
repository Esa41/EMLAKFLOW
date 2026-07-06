import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  const db = forTenant(session.tenantId);
  const body = await req.json().catch(() => ({}));

  try {
    const post = await db.socialPost.update({
      where: { id },
      data: {
        ...(body.listingId !== undefined && { listingId: body.listingId || null }),
        ...(body.caption !== undefined && { caption: body.caption || null }),
      },
      include: {
        listing: { select: { id: true, refCode: true, title: true } },
      },
    });
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    await forTenant(session.tenantId).socialPost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}
