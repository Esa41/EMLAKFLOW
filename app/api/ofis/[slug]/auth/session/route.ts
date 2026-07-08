import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSiteSession } from "@/lib/site-auth";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * Vitrin oturum özeti — SiteSessionProvider'ın tek fetch'i.
 * Sayfalar cookie okumadığından (ISR) kullanıcı durumu buradan gelir.
 * → { user: { name } | null, favorites: string[] }
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, showcaseEnabled: true },
  });
  if (!tenant || !tenant.showcaseEnabled) {
    return NextResponse.json({ error: "Ofis bulunamadı" }, { status: 404 });
  }

  const session = await getSiteSession(tenant.id);
  if (!session) {
    return NextResponse.json({ user: null, favorites: [] });
  }

  const [user, favorites] = await Promise.all([
    prisma.siteUser.findFirst({
      where: { id: session.siteUserId, tenantId: tenant.id },
      select: { name: true },
    }),
    prisma.favorite.findMany({
      where: { siteUserId: session.siteUserId },
      select: { listingId: true },
    }),
  ]);

  if (!user) return NextResponse.json({ user: null, favorites: [] });

  return NextResponse.json({
    user: { name: user.name },
    favorites: favorites.map((f) => f.listingId),
  });
}
