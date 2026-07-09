import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

/**
 * DELETE /api/cash-entries/[id] — manuel kasa kaydını sil (OWNER/BROKER).
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!["OWNER", "BROKER"].includes(session.role)) {
    return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });
  }

  const { id } = await params;
  const db = forTenant(session.tenantId);
  const existing = await db.cashEntry.findFirst({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
  }

  await db.cashEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
