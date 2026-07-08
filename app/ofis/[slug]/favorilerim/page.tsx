import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Building2, Heart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSiteUser } from "@/lib/site-auth";
import { trMoney } from "@/lib/labels";
import { FavoriteButton } from "@/components/favorite-button";
import { SiteAuthPrompt } from "@/components/site-auth";

export const metadata: Metadata = {
  title: "Favorilerim",
  robots: { index: false },
};

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, name: true, showcaseEnabled: true },
  });
  if (!tenant || !tenant.showcaseEnabled) notFound();

  const siteUser = await getSiteUser(tenant.id);

  if (!siteUser) {
    return (
      <div className="rounded-[10px] border border-dashed border-ink/25 bg-white/60 p-12 text-center">
        <Heart className="mx-auto mb-3 h-9 w-9 text-rose-300" />
        <h1 className="font-display text-xl font-extrabold tracking-tight">
          Favori ilanlarınız
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink/55">
          Beğendiğiniz ilanları kaydetmek ve her cihazdan erişmek için üye olun
          ya da giriş yapın.
        </p>
        <div className="mt-5 flex justify-center">
          <SiteAuthPrompt slug={slug} />
        </div>
      </div>
    );
  }

  const favorites = await prisma.favorite.findMany({
    where: {
      siteUserId: siteUser.id,
      listing: { tenantId: tenant.id, status: "ACTIVE" },
    },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        include: { media: { orderBy: { order: "asc" }, take: 1 } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600">
          {siteUser.name} · {favorites.length} ilan
        </p>
        <h1 className="mt-1.5 font-display text-[28px] font-extrabold leading-tight tracking-tight">
          Favorilerim
        </h1>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-ink/25 bg-white/60 p-12 text-center">
          <Heart className="mx-auto mb-3 h-9 w-9 text-rose-200" />
          <p className="text-sm text-ink/55">
            Henüz favori ilanınız yok — beğendiğiniz ilanların kalp simgesine
            dokunun.
          </p>
          <Link
            href={`/ofis/${slug}`}
            className="btn-selvi mt-5 inline-block rounded-xl px-6 py-2.5 text-sm font-bold text-white"
          >
            Portföye göz at
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map(({ listing: l }) => (
            <Link
              key={l.id}
              href={`/ofis/${slug}/ilan/${l.slug ? `${l.id}-${l.slug}` : l.id}`}
              className="group overflow-hidden rounded-[10px] border border-ink/15 bg-white transition-colors hover:border-ink/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
            >
              <div className="relative">
                <FavoriteButton slug={slug} listingId={l.id} />
                <div className="relative h-48 overflow-hidden bg-brand-50">
                  {l.media[0] ? (
                    <Image
                      src={l.media[0].cardUrl ?? l.media[0].url}
                      alt={l.media[0].alt ?? l.title}
                      fill
                      loading="lazy"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink/20">
                      <Building2 size={30} />
                    </div>
                  )}
                </div>
                <span className="absolute right-3 top-3 rounded-md border border-ink bg-paper px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider">
                  {l.purpose === "SALE" ? "Satılık" : "Kiralık"}
                </span>
              </div>
              <div className="p-4">
                <h3 className="line-clamp-1 text-[15px] font-bold">{l.title}</h3>
                <p className="mt-1.5 font-display text-lg font-extrabold tracking-tight">
                  {trMoney.format(Number(l.price))}
                  {l.purpose === "RENT" && (
                    <span className="text-sm font-medium text-ink/45"> /ay</span>
                  )}
                </p>
                <p className="mt-1 text-xs text-ink/55">
                  {l.rooms ?? "—"} · net {l.netArea ?? l.grossArea ?? "—"} m² ·{" "}
                  {l.district}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
