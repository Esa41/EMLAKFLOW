import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { analyzeEnvironment } from "@/lib/environment";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/listings/[id]/environment
 * Konum ve Çevre Analizörü'nü elle tetikler (panel "Analiz Et" butonu).
 * Konum kaydında otomatik de çalışır (bkz. listings route after() blokları).
 */
export async function POST(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  const db = forTenant(session.tenantId);

  const listing = await db.listing.findUnique({
    where: { id },
    select: { id: true, lat: true, lng: true },
  });
  if (!listing) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (listing.lat == null || listing.lng == null) {
    return NextResponse.json(
      { error: "Analiz için önce haritadan konum işaretleyin." },
      { status: 400 },
    );
  }

  try {
    const result = await analyzeEnvironment(listing.lat, listing.lng);
    await prisma.listing.update({
      where: { id: listing.id },
      data: {
        environmentScore: result.score,
        environmentData: result as unknown as object,
      },
    });
    return NextResponse.json({ environment: result });
  } catch (err) {
    console.error("[environment] analiz hatası:", err);
    return NextResponse.json(
      { error: "Çevre analizi şu an yapılamadı — birazdan tekrar deneyin." },
      { status: 502 },
    );
  }
}
