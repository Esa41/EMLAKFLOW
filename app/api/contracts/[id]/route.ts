import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { deleteObject } from "@/lib/r2";

type Ctx = { params: Promise<{ id: string }> };

/** Body: { fileUrl?, fileKey?, signedAt?, expiresAt? } — örn. taslak sonrası taranmış kopya bağlama. */
export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  const db = forTenant(session.tenantId);

  const body = await req.json().catch(() => ({}));

  try {
    const contract = await db.contract.update({
      where: { id },
      data: {
        ...(body.fileUrl !== undefined && { fileUrl: body.fileUrl || null }),
        ...(body.fileKey !== undefined && { fileKey: body.fileKey || null }),
        ...(body.signedAt !== undefined && {
          signedAt: body.signedAt ? new Date(body.signedAt) : null,
        }),
        ...(body.expiresAt !== undefined && {
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        }),
      },
    });
    return NextResponse.json({ contract });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  const db = forTenant(session.tenantId);

  const existing = await db.contract.findUnique({
    where: { id },
    select: { fileKey: true },
  });
  if (!existing)
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  if (existing.fileKey) {
    await deleteObject(existing.fileKey).catch(() => {});
  }

  try {
    await db.contract.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}
