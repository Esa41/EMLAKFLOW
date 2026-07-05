import { prisma } from "@/lib/prisma";
import { buildFeedXml } from "@/lib/feed";

type Ctx = { params: Promise<{ token: string }> };

/**
 * Public XML feed — GET /api/feed/{token}.xml
 * Kimlik doğrulama URL'deki gizli token'la yapılır (portal panelleri
 * cookie taşıyamaz). Token Ayarlar sayfasında görünür.
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { token: raw } = await ctx.params;
  const token = raw.replace(/\.xml$/i, "");

  if (!token || token.length < 24) {
    return new Response("Not found", { status: 404 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { feedToken: token },
    select: {
      id: true,
      name: true,
      phone: true,
      city: true,
      portalSahibinden: true,
      portalHepsiemlak: true,
      portalEmlakjet: true,
    },
  });
  if (!tenant) return new Response("Not found", { status: 404 });

  const anyPortal =
    tenant.portalSahibinden || tenant.portalHepsiemlak || tenant.portalEmlakjet;
  if (!anyPortal) {
    return new Response(
      "Feed kapalı: Ayarlar > Portal Yayını bölümünden en az bir portalı açın.",
      { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const listings = await prisma.listing.findMany({
    where: { tenantId: tenant.id, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    include: {
      media: { orderBy: { order: "asc" } },
      agent: { select: { name: true, phone: true } },
    },
  });

  const xml = buildFeedXml(tenant, listings);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Portallar feed'i periyodik çeker — 15 dk edge cache yeterli
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300",
    },
  });
}
