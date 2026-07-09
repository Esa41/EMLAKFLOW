import { NextResponse, after } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { deleteObject } from "@/lib/r2";
import { variantKeys } from "@/lib/images";
import { ensureListingSeo } from "@/lib/seo-ai";
import { listingDataFromBody } from "@/lib/listing-payload";
import { revalidateListingShowcase } from "@/lib/revalidate-showcase";
import { prisma } from "@/lib/prisma";
import { officeBrand } from "@/lib/office-brand";
import { sendPriceDropEmail } from "@/lib/marketing-mailer";
import { trMoney } from "@/lib/labels";

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
    // Fiyat düşüşü bildirimi için güncelleme ÖNCESİ fiyatı sakla
    const before = await forTenant(session.tenantId).listing.findUnique({
      where: { id },
      select: { price: true },
    });

    const listing = await forTenant(session.tenantId).listing.update({
      where: { id },
      data: listingDataFromBody(body),
    });

    // Vitrindeki ISR kopyası anında tazelensin (fiyat/durum değişikliği)
    await revalidateListingShowcase(session.tenantId, listing);

    // Fiyat düştüyse favorileyen vitrin üyelerine haber ver (arka planda)
    const oldPrice = before ? Number(before.price) : null;
    const newPrice = Number(listing.price);
    if (oldPrice && newPrice < oldPrice && listing.status === "ACTIVE") {
      after(async () => {
        try {
          const favorites = await prisma.favorite.findMany({
            where: { listingId: listing.id },
            select: { siteUser: { select: { email: true, name: true } } },
          });
          if (favorites.length === 0) return;
          const office = await officeBrand(session.tenantId);
          if (!office) return;
          const publicId = listing.slug
            ? `${listing.id}-${listing.slug}`
            : listing.id;
          const link = `${office.showcase}/ilan/${publicId}`;
          for (const f of favorites) {
            await sendPriceDropEmail(
              f.siteUser.email,
              f.siteUser.name,
              listing.title,
              trMoney.format(oldPrice),
              trMoney.format(newPrice),
              link,
              office.brand,
              { tenantId: session.tenantId, kind: "price-drop", listingId: listing.id },
            ).catch((err) =>
              console.error("[listings] fiyat düşüşü maili:", err),
            );
          }
        } catch (err) {
          console.error("[listings] fiyat düşüşü bildirimi:", err);
        }
      });
    }

    // SEO eksikse arka planda otomatik tamamla (kayıt bloklanmaz).
    after(async () => {
      await ensureListingSeo(listing).catch((err) =>
        console.error("[listings] otomatik SEO üretilemedi:", err),
      );
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

  // Silinen ilanın ISR kopyası kalmasın — sonraki istek 404'e düşer
  await revalidateListingShowcase(session.tenantId, listing);

  return NextResponse.json({ ok: true });
}
