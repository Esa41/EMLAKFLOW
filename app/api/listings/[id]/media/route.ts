import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { publicUrl, deleteObject } from "@/lib/r2";
import { processListingImage, variantKeys } from "@/lib/images";
import { mediaAltText } from "@/lib/seo";
import { revalidateListingShowcase } from "@/lib/revalidate-showcase";

type Ctx = { params: Promise<{ id: string }> };

/** Yükleme tamamlandıktan sonra medyayı ilana bağlar. Body: { key, kind? } */
export async function POST(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  const db = forTenant(session.tenantId);

  const listing = await db.listing.findUnique({
    where: { id },
    include: { _count: { select: { media: true } } },
  });
  if (!listing) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body?.key) return NextResponse.json({ error: "key zorunlu" }, { status: 400 });

  // Anahtar bu tenant'ın alanında mı? (başka ofisin nesnesini bağlamayı engelle)
  if (!String(body.key).startsWith(`${session.tenantId}/`)) {
    return NextResponse.json({ error: "Geçersiz key" }, { status: 400 });
  }

  const kind = body.kind ?? "photo";
  const order = listing._count.media;

  // Sunucu tarafı optimizasyon: thumb (400px) + card (960px) WebP varyantları.
  // Best-effort — başarısız olursa varyantsız kaydedilir, UI orijinali kullanır.
  let variants: {
    thumbUrl?: string;
    cardUrl?: string;
    width?: number | null;
    height?: number | null;
  } = {};
  if (kind === "photo") {
    try {
      variants = await processListingImage(String(body.key));
    } catch (err) {
      console.error("[media] varyant üretilemedi:", err);
    }
  }

  const media = await db.listing.update({
    where: { id },
    data: {
      media: {
        create: {
          key: body.key,
          url: publicUrl(body.key),
          kind,
          order,
          thumbUrl: variants.thumbUrl ?? null,
          cardUrl: variants.cardUrl ?? null,
          width: variants.width ?? null,
          height: variants.height ?? null,
          alt: kind === "photo" ? mediaAltText(listing, order) : null,
        },
      },
    },
    include: { media: { orderBy: { order: "asc" } } },
  });

  // Vitrindeki ISR kopyasında yeni fotoğraf hemen görünsün
  await revalidateListingShowcase(session.tenantId, listing);

  return NextResponse.json({ media: media.media }, { status: 201 });
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

  // Orijinal + üretilen varyantları birlikte temizle (best-effort)
  await Promise.allSettled(
    [media.key, ...variantKeys(media.key)].map((k) => deleteObject(k)),
  );
  // ListingMedia tenant kolonlu değil — aidiyet yukarıda listing üzerinden doğrulandı
  const { prisma } = await import("@/lib/prisma");
  await prisma.listingMedia.delete({ where: { id: media.id } });

  await revalidateListingShowcase(session.tenantId, listing);

  return NextResponse.json({ ok: true });
}
