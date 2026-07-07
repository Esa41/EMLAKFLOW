import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { deleteObject, publicUrl } from "@/lib/r2";
import type { ContractType } from "@prisma/client";

const TYPES: ContractType[] = [
  "AUTHORIZATION",
  "VIEWING_FORM",
  "SALE_CONTRACT",
  "RENT_CONTRACT",
];

type Ctx = { params: Promise<{ id: string }> };

/** Body: { fileUrl?, fileKey?, signedAt?, expiresAt? } — örn. taslak sonrası taranmış kopya bağlama. */
export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  const db = forTenant(session.tenantId);

  const body = await req.json().catch(() => ({}));

  const fileUrl =
    body.fileUrl !== undefined
      ? body.fileUrl || null
      : body.fileKey
        ? publicUrl(body.fileKey)
        : undefined;

  try {
    const contract = await db.contract.update({
      where: { id },
      data: {
        ...(body.type !== undefined &&
          TYPES.includes(body.type) && { type: body.type }),
        ...(fileUrl !== undefined && { fileUrl }),
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
