import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

type Ctx = { params: Promise<{ id: string }> };

/** Body: { paid: boolean } — hak edişi ödendi / ödenmedi işaretler (yalnız OWNER/BROKER) */
export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!["OWNER", "BROKER"].includes(session.role)) {
    return NextResponse.json(
      { error: "Bu işlem için yetkin yok." },
      { status: 403 }
    );
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  try {
    const commission = await forTenant(session.tenantId).commission.update({
      where: { id },
      data: { paidAt: body.paid ? new Date() : null },
    });
    return NextResponse.json({ commission });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}
