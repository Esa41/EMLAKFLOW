import { prisma } from "@/lib/prisma";
import { buildFeedXml, type FeedPortal } from "@/lib/feed";

type Ctx = { params: Promise<{ token: string }> };

/**
 * Public XML feed — GET /api/feed/{token}.xml?portal=arabam
 */
export async function GET(req: Request, ctx: Ctx) {
  const { token: raw } = await ctx.params;
  const token = raw.replace(/\.xml$/i, "");

  if (!token || token.length < 24) {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(req.url);
  const portal = (url.searchParams.get("portal") ?? "generic") as FeedPortal;

  const tenant = await prisma.tenant.findUnique({
    where: { feedToken: token },
    select: {
      id: true,
      name: true,
      phone: true,
      city: true,
      vertical: true,
      portalSahibinden: true,
      portalHepsiemlak: true,
      portalEmlakjet: true,
      portalArabam: true,
      portalSahibindenAuto: true,
    },
  });
  if (!tenant) return new Response("Not found", { status: 404 });

  const anyEstate =
    tenant.portalSahibinden || tenant.portalHepsiemlak || tenant.portalEmlakjet;
  const anyAuto = tenant.portalArabam || tenant.portalSahibindenAuto;
  const anyPortal = anyEstate || anyAuto;

  if (!anyPortal) {
    return new Response(
      "Feed kapalı: Ayarlar > Portal Yayını bölümünden en az bir portalı açın.",
      { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const listings = await prisma.listing.findMany({
    where: { tenantId: tenant.id, status: "ACTIVE", feedEnabled: true },
    orderBy: { updatedAt: "desc" },
    include: {
      media: { orderBy: { order: "asc" } },
      agent: { select: { name: true, phone: true } },
    },
  });

  const xml = buildFeedXml(
    { ...tenant, vertical: tenant.vertical },
    listings,
    portal,
  );

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300",
    },
  });
}
