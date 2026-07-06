import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSiteSession } from "@/lib/site-auth";
import { notificationLinks } from "@/lib/notification-links";

type Ctx = { params: Promise<{ slug: string }> };

async function resolveTenant(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, showcaseEnabled: true },
  });
}

/** Giriş yapmış alıcının favori ilan id listesi. */
export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const tenant = await resolveTenant(slug);
  if (!tenant || !tenant.showcaseEnabled) {
    return NextResponse.json({ error: "Ofis bulunamadı" }, { status: 404 });
  }
  const session = await getSiteSession(tenant.id);
  if (!session) return NextResponse.json({ favorites: [] });

  const favorites = await prisma.favorite.findMany({
    where: { siteUserId: session.siteUserId },
    select: { listingId: true },
  });
  return NextResponse.json({ favorites: favorites.map((f) => f.listingId) });
}

/** Favori ekle/çıkar (toggle). Body: { listingId } → { favorited } */
export async function POST(req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const tenant = await resolveTenant(slug);
  if (!tenant || !tenant.showcaseEnabled) {
    return NextResponse.json({ error: "Ofis bulunamadı" }, { status: 404 });
  }
  const session = await getSiteSession(tenant.id);
  if (!session) {
    return NextResponse.json(
      { error: "Favorilemek için giriş yapın." },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.listingId) {
    return NextResponse.json({ error: "listingId zorunlu" }, { status: 400 });
  }

  // İlan bu ofise mi ait?
  const listing = await prisma.listing.findFirst({
    where: { id: body.listingId, tenantId: tenant.id },
    select: { id: true, refCode: true, title: true, agentId: true, tenantId: true },
  });
  if (!listing) return NextResponse.json({ error: "İlan bulunamadı" }, { status: 404 });

  const existing = await prisma.favorite.findUnique({
    where: {
      siteUserId_listingId: {
        siteUserId: session.siteUserId,
        listingId: listing.id,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favorite.create({
    data: { siteUserId: session.siteUserId, listingId: listing.id },
  });

  // Danışmana panel bildirimi — favorileyen alıcı sıcak lead'dir
  if (listing.agentId) {
    const agentId = listing.agentId;
    after(async () => {
      try {
        const buyer = await prisma.siteUser.findUnique({
          where: { id: session.siteUserId },
          select: { name: true, email: true },
        });
        await prisma.notification.create({
          data: {
            tenantId: listing.tenantId,
            userId: agentId,
            title: `${listing.refCode} favorilere eklendi`,
            body: `${buyer?.name ?? "Bir ziyaretçi"} (${buyer?.email ?? "üye"}) "${listing.title}" ilanını favoriledi — potansiyel alıcı.`,
            href: notificationLinks.listing(listing.id),
            category: "lead",
            severity: "action",
          },
        });
      } catch (err) {
        console.error("[favorites] bildirim oluşturulamadı:", err);
      }
    });
  }

  return NextResponse.json({ favorited: true }, { status: 201 });
}
