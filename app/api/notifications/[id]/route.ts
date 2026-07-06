import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

/** Tek bildirim okundu işaretle */
export async function PATCH(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await ctx.params;
  const db = forTenant(session.tenantId);

  await db.notification.updateMany({
    where: { id, userId: session.userId },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

/** Tek bildirim sil */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await ctx.params;
  const db = forTenant(session.tenantId);

  await db.notification.deleteMany({
    where: { id, userId: session.userId },
  });

  return NextResponse.json({ ok: true });
}
