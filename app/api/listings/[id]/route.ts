import { NextResponse, after } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { deleteObject } from "@/lib/r2";
import { variantKeys } from "@/lib/images";
import { ensureListingSeo } from "@/lib/seo-ai";
import { listingDataFromBody } from "@/lib/listing-payload";
import { revalidateShowcaseForTenant } from "@/lib/revalidate-showcase";

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

    after(async () => {
      await ensureListingSeo(listing).catch((err) =>
        console.error("[listings] otomatik SEO üretilemedi:", err),
      );
      await revalidateShowcaseForTenant(session.tenantId, listing);
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

  await Promise.allSettled(
    listing.media.flatMap((m) =>
      [m.key, ...variantKeys(m.key)].map((k) => deleteObject(k)),
    ),
  );
  await db.listing.delete({ where: { id } });

  after(async () => {
    await revalidateShowcaseForTenant(session.tenantId);
  });

  return NextResponse.json({ ok: true });
}
