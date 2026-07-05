import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { publicUrl, deleteObject } from "@/lib/r2";

type Ctx = { params: Promise<{ id: string }> };

/** Yükleme tamamlandıktan sonra medyayı ilana bağlar. Body: { key, kind? } */
export async function POST(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  const db = forTenant(session.tenantId);

  const listing = await db.listing.findUnique({ where: { id }, select: { id: true } });
  if (!listing) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body?.key) return NextResponse.json({ error: "key zorunlu" }, { status: 400 });

  // Anahtar bu tenant'ın alanında mı? (başka ofisin nesnesini bağlamayı engelle)
  if (!String(body.key).startsWith(`${session.tenantId}/`)) {
    return NextResponse.json({ error: "Geçersiz key" }, { status: 400 });
  }

  const count = await prismaCount(db, id);
  const media = await db.listing.update({
    where: { id },
    data: {
      media: {
        create: {
          key: body.key,
          url: publicUrl(body.key),
          kind: body.kind ?? "photo",
          order: count,
        },
      },
    },
    include: { media: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ media: media.media }, { status: 201 });
}

async function prismaCount(db: ReturnType<typeof forTenant>, listingId: string) {
  const l = await db.listing.findUnique({
    where: { id: listingId },
    include: { _count: { select: { media: true } } },
  });
  return l?._count.media ?? 0;
}

/** Body: { mediaId } — medyayı hem DB'den hem R2'den siler */
export async function DELETE(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  const db = forTenant(session.tenantId);

  const body = await req.json().catch(() => null);
  if (!body?.mediaId) return NextResponse.json({ error: "mediaId zorunlu" }, { status: 400 });

  const listing = await db.listing.findUnique({
    where: { id },
    include: { media: { where: { id: body.mediaId } } },
  });
  const media = listing?.media[0];
  if (!media) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  await deleteObject(media.key).catch(() => {});
  // ListingMedia tenant kolonlu değil — aidiyet yukarıda listing üzerinden doğrulandı
  const { prisma } = await import("@/lib/prisma");
  await prisma.listingMedia.delete({ where: { id: media.id } });

  return NextResponse.json({ ok: true });
}
