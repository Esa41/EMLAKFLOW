import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { InfoForm } from "@/components/showcase-forms";
import { FavoriteButton } from "@/components/favorite-button";
import { ShareButton } from "@/components/share-button";
import { ListingGallery } from "@/components/listing-gallery";
import { ShowcaseListingCard } from "@/components/showcase-listing-card";
import { getSiteUser } from "@/lib/site-auth";
import { TrackListingView } from "@/components/vitrin-tracking";
import {
  DroneMapFlyover,
  ShowcaseMapLazy,
} from "@/components/showcase-maps-lazy";
import {
  seoTitle,
  seoDescription,
  mediaAltText,
  listingJsonLd,
  breadcrumbJsonLd,
} from "@/lib/seo";
import { fmtMoney } from "@/lib/labels";
import { getBaseUrl } from "@/lib/url";
import { isAutoVertical } from "@/lib/verticals";
import {
  buildListingSpecs,
  rentPriceSuffix,
  showcaseHeroCopy,
} from "@/lib/showcase-vertical";

export const revalidate = 900;
export const dynamicParams = true;

const BASE_URL = getBaseUrl();

type Params = Promise<{ slug: string; id: string }>;

function parseListingId(param: string): string {
  return param.split("-")[0];
}

async function getData(slug: string, id: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      phone: true,
      whatsapp: true,
      showcaseEnabled: true,
      vertical: true,
      district: true,
      city: true,
      showcaseTagline: true,
    },
  });
  if (!tenant || !tenant.showcaseEnabled) return null;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      media: { orderBy: { order: "asc" } },
      agent: { select: { name: true, phone: true } },
    },
  });
  if (!listing || listing.tenantId !== tenant.id || listing.status !== "ACTIVE")
    return null;
  return { tenant, listing };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const data = await getData(slug, parseListingId(id));
  if (!data) return {};
  const { listing, tenant } = data;
  const title = seoTitle(listing, tenant.name);
  const desc = seoDescription(listing, tenant.name);
  const publicId = listing.slug ? `${listing.id}-${listing.slug}` : listing.id;
  const canonical = `${BASE_URL}/ofis/${slug}/ilan/${publicId}`;
  const cover = listing.media[0];
  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title,
      description: desc,
      type: "website",
      url: canonical,
      locale: "tr_TR",
      siteName: tenant.name,
      images: cover
        ? [
            {
              url: cover.cardUrl ?? cover.url,
              width: 960,
              height: 640,
              alt: mediaAltText(listing, 0),
            },
          ]
        : [],
    },
    twitter: { card: "summary_large_image", title, description: desc },
  };
}

export default async function ListingShowcasePage({
  params,
}: {
  params: Params;
}) {
  const { slug, id } = await params;
  const data = await getData(slug, parseListingId(id));
  if (!data) notFound();
  const { tenant, listing: l } = data;
  const publicId = l.slug ? `${l.id}-${l.slug}` : l.id;
  const isAuto = isAutoVertical(tenant.vertical);
  const copy = showcaseHeroCopy(tenant, tenant.vertical, 1);

  const siteUser = await getSiteUser(tenant.id);
  const isFavorited = siteUser
    ? !!(await prisma.favorite.findUnique({
        where: {
          siteUserId_listingId: { siteUserId: siteUser.id, listingId: l.id },
        },
        select: { id: true },
      }))
    : false;

  const similar = await prisma.listing.findMany({
    where: {
      tenantId: tenant.id,
      status: "ACTIVE",
      id: { not: l.id },
      OR: isAuto
        ? [{ vehicleBrand: l.vehicleBrand }, { type: l.type }]
        : [{ district: l.district }, { type: l.type }],
      purpose: l.purpose,
    },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { media: { orderBy: { order: "asc" }, take: 1 } },
  });

  const filled = buildListingSpecs(l, isAuto).filter(([, v]) => v);

  const telHref = (p: string | null) =>
    p ? `tel:${p.replace(/\s/g, "")}` : null;
  const phone = l.agent?.phone ?? tenant.phone;
  const waNumber = tenant.whatsapp ?? phone;

  const baseUrl = BASE_URL;
  const jsonLd = listingJsonLd(
    { ...l, id: publicId, description: l.description, media: l.media },
    { name: tenant.name, slug, phone: tenant.phone },
    baseUrl,
    l.agent ? { name: l.agent.name, phone: l.agent.phone } : undefined,
  );
  const breadcrumb = breadcrumbJsonLd([
    { name: tenant.name, url: `${baseUrl}/ofis/${slug}` },
    { name: l.title, url: `${baseUrl}/ofis/${slug}/ilan/${publicId}` },
  ]);

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <TrackListingView tenantId={tenant.id} listingId={l.id} />
      <Link
        href={`/ofis/${slug}`}
        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink/55 hover:text-ink"
      >
        <ArrowLeft size={13} /> {copy.portfolioLabel}
      </Link>

      <ListingGallery
        title={l.title}
        media={l.media.map((m, i) => ({
          id: m.id,
          url: m.url,
          thumbUrl: m.thumbUrl,
          cardUrl: m.cardUrl,
          kind: m.kind,
          alt: m.alt ?? mediaAltText(l, i),
        }))}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            {l.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <p className="font-display text-3xl font-extrabold tracking-tight text-brand-700">
              {fmtMoney(Number(l.price), l.currency)}
              {rentPriceSuffix(isAuto, l.purpose) && (
                <span className="text-base font-medium text-ink/45">
                  {rentPriceSuffix(isAuto, l.purpose)}
                </span>
              )}
            </p>
            <FavoriteButton
              slug={slug}
              listingId={l.id}
              initialFavorited={isFavorited}
              loggedIn={!!siteUser}
              variant="inline"
            />
            <ShareButton
              url={`${BASE_URL}/ofis/${slug}/ilan/${publicId}`}
              title={l.title}
            />
          </div>

          {l.description && (
            <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-ink/75">
              {l.description}
            </p>
          )}

          {!isAuto && l.lat != null && l.lng != null && (
            <>
              <h2 className="bolum mt-8">3D Drone Görünümü</h2>
              <p className="mt-1 mb-3 text-xs text-ink/45">
                Binanın etrafında sanal drone uçuşu — sürükleyerek kontrol
                edebilirsiniz.
              </p>
              <DroneMapFlyover
                lat={l.lat}
                lng={l.lng}
                parcelGeo={l.parcelGeo ?? undefined}
                height={340}
              />

              <h2 className="bolum mt-8">Konum</h2>
              <div className="mt-4">
                <ShowcaseMapLazy
                  slug={slug}
                  mode="single"
                  height={200}
                  parcelGeo={l.parcelGeo ?? undefined}
                  listings={[
                    {
                      id: l.id,
                      lat: l.lat,
                      lng: l.lng,
                      price: Number(l.price),
                      currency: l.currency,
                      purpose: l.purpose,
                    },
                  ]}
                />
              </div>
            </>
          )}

          <h2 className="bolum mt-8">{copy.detailsTitle}</h2>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 sm:grid-cols-3">
            {filled.map(([k, v]) => (
              <div key={k} className="border-b border-ink/10 py-2.5">
                <dt className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink/45">
                  {k}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          {l.features.length > 0 && (
            <>
              <h2 className="bolum mt-8">Özellikler</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {l.features.map((f) => (
                  <span
                    key={f}
                    className="rounded-full border border-brand-600/25 bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-700"
                  >
                    ✓ {f}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <aside>
          <div className="rounded-[10px] border border-ink bg-white p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">
              {copy.agentLabel}
            </p>
            <p className="mt-2 font-display text-lg font-extrabold tracking-tight">
              {l.agent?.name ?? tenant.name}
            </p>
            <p className="text-xs text-ink/55">{tenant.name}</p>
            {(phone || waNumber) && (
              <div className="mt-4 space-y-2">
                {phone && (
                  <a
                    href={telHref(phone)!}
                    data-track="CLICK"
                    className="btn-selvi flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
                  >
                    <Phone size={15} /> Hemen ara
                  </a>
                )}
                {waNumber && (
                  <a
                    href={`https://wa.me/${(waNumber ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Merhaba, "${l.title}" ${isAuto ? "aracı" : "ilanı"} hakkında bilgi almak istiyorum.`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track="CLICK"
                    className="flex items-center justify-center gap-2 rounded-lg border border-ink/20 bg-white px-4 py-2.5 text-sm font-bold text-ink hover:border-ink/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
                  >
                    WhatsApp'tan yaz
                  </a>
                )}
              </div>
            )}
            <p className="mt-4 border-t border-ink/10 pt-3 font-mono text-[9.5px] leading-relaxed text-ink/45">
              {copy.refHint}{" "}
              <b className="text-ink/70">&ldquo;{l.title}&rdquo;</b>{" "}
              {isAuto ? "aracını" : "ilanını"} referans göstermeniz yeterli.
            </p>
          </div>

          <div className="mt-5 rounded-[10px] border border-ink/15 bg-white p-5">
            <InfoForm slug={slug} listingId={l.id} listingTitle={l.title} />
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section>
          <h2 className="bolum">{copy.similarTitle}</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {similar.map((s) => (
              <ShowcaseListingCard
                key={s.id}
                slug={slug}
                listing={s}
                isAuto={isAuto}
                favorited={false}
                loggedIn={!!siteUser}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
