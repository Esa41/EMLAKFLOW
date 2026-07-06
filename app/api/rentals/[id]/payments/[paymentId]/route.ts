import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

type Ctx = { params: Promise<{ id: string; paymentId: string }> };

/** PATCH { paidAt?, method?, note? } — paidAt null = ödenmedi */
export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { paymentId } = await ctx.params;
  const db = forTenant(session.tenantId);
  const body = await req.json().catch(() => ({}));

  try {
    const payment = await db.rentPayment.update({
      where: { id: paymentId },
      data: {
        ...(body.paidAt !== undefined && {
          paidAt: body.paidAt ? new Date(body.paidAt) : null,
        }),
        ...(body.method !== undefined && { method: body.method || null }),
        ...(body.note !== undefined && { note: body.note || null }),
      },
    });
    return NextResponse.json({ payment });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}
