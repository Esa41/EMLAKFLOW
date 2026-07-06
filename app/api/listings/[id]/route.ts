import { NextResponse, after } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { deleteObject } from "@/lib/r2";
import { variantKeys } from "@/lib/images";
import { ensureListingSeo } from "@/lib/seo-ai";
import { ensureEnvironmentAnalysis } from "@/lib/environment";
import { listingDataFromBody } from "@/lib/listing-payload";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;

  const listing = await forTenant(session.tenantId).listing.findUnique({
    where: { id },
    include: {
      media: { orderBy: { order: "asc" } },
      agent: { select: { id: true, name: true } },
    },
  });
  if (!listing) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json({ listing });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  try {
    const listing = await forTenant(session.tenantId).listing.update({
      where: { id },
      data: listingDataFromBody(body),
    });

    // SEO ve çevre analizi eksikse arka planda otomatik tamamla (kayıt bloklanmaz).
    after(async () => {
      await Promise.allSettled([
        ensureListingSeo(listing).catch((err) =>
          console.error("[listings] otomatik SEO üretilemedi:", err),
        ),
        ensureEnvironmentAnalysis(listing).catch((err) =>
          console.error("[listings] çevre analizi yapılamadı:", err),
        ),
      ]);
    });

    return NextResponse.json({ listing });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  const db = forTenant(session.tenantId);

  const listing = await db.listing.findUnique({
    where: { id },
    include: { media: true },
  });
  if (!listing) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  // Önce R2'deki medya nesnelerini temizle (orijinal + varyantlar, best-effort)
  await Promise.allSettled(
    listing.media.flatMap((m) =>
      [m.key, ...variantKeys(m.key)].map((k) => deleteObject(k)),
    ),
  );
  await db.listing.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
