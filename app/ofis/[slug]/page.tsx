import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { fmtMoney, ROOM_OPTIONS } from "@/lib/labels";
import { RequestForm } from "@/components/showcase-forms";
import { TrackImpressions } from "@/components/vitrin-tracking";
import { getSiteUser } from "@/lib/site-auth";
import { officeJsonLd } from "@/lib/seo";
import { getBaseUrl } from "@/lib/url";
import { isAutoVertical } from "@/lib/verticals";
import { ShowcaseWorkspace, type SplitListing } from "@/components/showcase-workspace";
import { ShowcaseListingGrid } from "@/components/showcase-listing-grid";
import { AnimatedCounter } from "@/components/animated-counter";
import {
  getCachedActiveListings,
  getCachedDistricts,
  getCachedRecentlyClosed,
  getCachedTeam,
  getCachedTenant,
} from "@/lib/showcase-data";

export const revalidate = 300;

const BASE_URL = getBaseUrl();

type Params = Promise<{ slug: string }>;
type Search = Promise<{
  q?: string;
  purpose?: string;
  district?: string;
  rooms?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  minArea?: string;
  sort?: string;
}>;

const LISTING_TYPES = [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "LAND",
  "COMMERCIAL",
  "OFFICE",
] as const;

const SORT_OPTIONS: Record<string, { label: string; orderBy: (a: SplitListing, b: SplitListing) => number }> = {
  date_desc: { label: "En yeni", orderBy: () => 0 },
  price_asc: { label: "Fiyat ↑", orderBy: (a, b) => a.price - b.price },
  price_desc: { label: "Fiyat ↓", orderBy: (a, b) => b.price - a.price },
  area_desc: { label: "m² ↓", orderBy: (a, b) => (b.netArea ?? 0) - (a.netArea ?? 0) },
};

function hasActiveFilters(sp: {
  q?: string;
  purpose?: string;
  district?: string;
  rooms?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  minArea?: string;
}) {
  return !!(
    sp.q?.trim() ||
    sp.district ||
    sp.rooms ||
    sp.type ||
    sp.minPrice ||
    sp.maxPrice ||
    sp.minArea ||
    (sp.purpose && (sp.purpose === "SALE" || sp.purpose === "RENT"))
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, name: true, city: true, district: true },
  });
  if (!tenant) return {};
  const title = `${tenant.name} — Satılık ve Kiralık Portföy`;
  const description = `${tenant.name} güncel portföyü: ${tenant.city ?? "Türkiye"} genelinde satılık ve kiralık gayrimenkuller.`;
  const cover = await prisma.listingMedia.findFirst({
    where: { listing: { tenantId: tenant.id, status: "ACTIVE" } },
    orderBy: { order: "asc" },
    select: { url: true },
  });
  const filtered = hasActiveFilters(sp);
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/ofis/${slug}` },
    robots: filtered
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${BASE_URL}/ofis/${slug}`,
      images: cover ? [{ url: cover.url }] : [],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ShowcasePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const tenant = await getCachedTenant(slug);
  if (!tenant || !tenant.showcaseEnabled) notFound();

  const num = (v?: string) => {
    const n = Number(v);
    return v && !isNaN(n) && n > 0 ? n : null;
  };
  const minPrice = num(sp.minPrice);
  const maxPrice = num(sp.maxPrice);
  const minArea = num(sp.minArea);
  const q = sp.q?.trim() || null;
  const typeFilter = LISTING_TYPES.includes(
    sp.type as (typeof LISTING_TYPES)[number],
  )
    ? (sp.type as (typeof LISTING_TYPES)[number])
    : null;

  const sortKey = sp.sort && sp.sort in SORT_OPTIONS ? sp.sort : "date_desc";

  const siteUser = await getSiteUser(tenant.id);
  const favoriteIds = siteUser
    ? (
        await prisma.favorite.findMany({
          where: { siteUserId: siteUser.id },
          select: { listingId: true },
        })
      ).map((f) => f.listingId)
    : [];

  const [allListings, districts, team, recentlyClosed] = await Promise.all([
    getCachedActiveListings(tenant.id, slug),
    getCachedDistricts(tenant.id, slug),
    tenant.showTeam ? getCachedTeam(tenant.id, slug) : Promise.resolve([]),
    getCachedRecentlyClosed(tenant.id, slug),
  ]);

  const listings = allListings
    .filter((l) => {
      if (sp.purpose === "SALE" || sp.purpose === "RENT") {
        if (l.purpose !== sp.purpose) return false;
      }
      if (sp.district && l.district !== sp.district) return false;
      if (sp.rooms && l.rooms !== sp.rooms) return false;
      if (typeFilter && l.type !== typeFilter) return false;
      if (q) {
        const hay = [l.title, l.neighborhood, l.district, l.address, l.refCode]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      if (minPrice && Number(l.price) < minPrice) return false;
      if (maxPrice && Number(l.price) > maxPrice) return false;
      if (minArea && (l.netArea ?? 0) < minArea) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortKey === "date_desc") return 0;
      return SORT_OPTIONS[sortKey].orderBy(
        {
          id: a.id,
          title: a.title,
          slug: a.slug,
          purpose: a.purpose,
          price: Number(a.price),
          currency: a.currency,
          rooms: a.rooms,
          netArea: a.netArea,
          grossArea: a.grossArea,
          district: a.district,
          neighborhood: a.neighborhood,
          lat: a.lat,
          lng: a.lng,
          mediaCount: a._count.media,
          image: a.media[0]?.cardUrl ?? a.media[0]?.url ?? null,
          imageAlt: a.media[0]?.alt ?? a.title,
        },
        {
          id: b.id,
          title: b.title,
          slug: b.slug,
          purpose: b.purpose,
          price: Number(b.price),
          currency: b.currency,
          rooms: b.rooms,
          netArea: b.netArea,
          grossArea: b.grossArea,
          district: b.district,
          neighborhood: b.neighborhood,
          lat: b.lat,
          lng: b.lng,
          mediaCount: b._count.media,
          image: b.media[0]?.cardUrl ?? b.media[0]?.url ?? null,
          imageAlt: b.media[0]?.alt ?? b.title,
        },
      );
    });

  const splitListings: SplitListing[] = listings.map((l) => ({
    id: l.id,
    title: l.title,
    slug: l.slug,
    purpose: l.purpose,
    price: Number(l.price),
    currency: l.currency,
    rooms: l.rooms,
    netArea: l.netArea,
    grossArea: l.grossArea,
    district: l.district,
    neighborhood: l.neighborhood,
    lat: l.lat,
    lng: l.lng,
    mediaCount: l._count.media,
    image: l.media[0]?.cardUrl ?? l.media[0]?.url ?? null,
    imageAlt: l.media[0]?.alt ?? l.title,
  }));

  const stats = Array.isArray(tenant.aboutStats)
    ? (tenant.aboutStats as Array<{ value: string; label: string }>).filter(
        (x) => x && x.value && x.label,
      )
    : [];
  const hasAbout = !!(tenant.aboutText || tenant.visionText || stats.length || tenant.officePhotoUrl);
  const ROLE_TR: Record<string, string> = {
    OWNER: "Ofis Sahibi",
    BROKER: "Broker",
    AGENT: "Danışman",
    ASSISTANT: "Asistan",
  };

  const jsonLd = officeJsonLd(
    {
      name: tenant.name,
      slug,
      phone: null,
      city: tenant.city,
      district: tenant.district,
    },
    BASE_URL,
  );

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TrackImpressions tenantId={tenant.id} />

      <ShowcaseWorkspace
        listings={splitListings}
        slug={slug}
        favoriteIds={favoriteIds}
        loggedIn={!!siteUser}
        searchParams={sp}
        districts={districts.map((d) => d.district)}
      >
        <ShowcaseListingGrid
          listings={splitListings}
          slug={slug}
          favoriteIds={favoriteIds}
          loggedIn={!!siteUser}
          clearHref={`/ofis/${slug}`}
        />
      </ShowcaseWorkspace>

      {recentlyClosed.length > 0 && (
        <section>
          <h2 className="bolum">Son Tamamlanan İşlemler</h2>
          <p className="mt-1.5 text-xs text-ink/45">
            Son 60 günde {recentlyClosed.length} işlem tamamlandı.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {recentlyClosed.map((l) => (
              <div
                key={l.id}
                className="overflow-hidden rounded-[10px] border border-ink/15 bg-white"
              >
                <div className="relative h-24 bg-brand-50">
                  {l.media[0] ? (
                    <Image
                      src={l.media[0].cardUrl ?? l.media[0].url}
                      alt={l.media[0].alt ?? l.title}
                      fill
                      loading="lazy"
                      sizes="(min-width: 1024px) 16vw, 33vw"
                      className="object-cover opacity-75"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink/15">
                      <Building2 size={20} />
                    </div>
                  )}
                  <span
                    className={`kunye absolute -bottom-2.5 left-2 text-[9px] ${
                      l.status === "SOLD" ? "kunye-satildi" : ""
                    }`}
                  >
                    {l.status === "SOLD" ? "Satıldı" : "Kiralandı"}
                  </span>
                </div>
                <div className="px-2.5 pb-2.5 pt-4">
                  <p className="line-clamp-1 text-xs font-bold">{l.title}</p>
                  <p className="mt-0.5 font-display text-sm font-extrabold tracking-tight text-ink/60 line-through decoration-ink/25">
                    {fmtMoney(Number(l.price), l.currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasAbout && (
        <section>
          <h2 className="bolum">Hakkımızda</h2>
          <div className="mt-4 rounded-[10px] border border-ink bg-white p-6">
            {tenant.officePhotoUrl && (
              <div className="relative mb-5 h-40 overflow-hidden rounded-lg sm:h-56">
                <Image
                  src={tenant.officePhotoUrl}
                  alt={`${tenant.name} ofis`}
                  fill
                  sizes="(min-width: 1024px) 960px, 100vw"
                  className="object-cover"
                />
              </div>
            )}
            {tenant.aboutTitle && (
              <h3 className="font-display text-xl font-extrabold tracking-tight">
                {tenant.aboutTitle}
              </h3>
            )}
            {tenant.aboutText && (
              <p className="mt-2.5 text-sm leading-relaxed text-ink/70">
                {tenant.aboutText}
              </p>
            )}
            {tenant.visionText && (
              <blockquote className="mt-5 border-l-[3px] border-brand-600 pl-4">
                <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                  Vizyonumuz
                </p>
                <p className="mt-1.5 font-display text-[16.5px] font-semibold leading-snug">
                  &ldquo;{tenant.visionText}&rdquo;
                </p>
              </blockquote>
            )}
            {stats.length > 0 && (
              <div className="mt-6 flex border-y border-ink/15">
                {stats.slice(0, 3).map((st, i) => (
                  <div
                    key={st.label}
                    className={`flex-1 py-3.5 text-center ${i > 0 ? "border-l border-ink/10" : ""}`}
                  >
                    <p className="font-display text-[21px] font-extrabold tracking-tight">
                      <AnimatedCounter value={st.value} />
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink/50">
                      {st.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {team.length > 0 && (
              <div className="mt-6 flex gap-5 overflow-x-auto pb-1">
                {team.map((u) => (
                  <div key={u.id} className="shrink-0 text-center">
                    {u.photoUrl ? (
                      <div className="relative mx-auto h-12 w-12 overflow-hidden rounded-xl">
                        <Image
                          src={u.photoUrl}
                          alt={u.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 font-display font-extrabold text-white">
                        {u.name
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                    )}
                    <p className="mt-1.5 text-xs font-bold">{u.name}</p>
                    <p className="font-mono text-[8.5px] uppercase tracking-wider text-ink/50">
                      {ROLE_TR[u.role]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section id="talep-form" className="rounded-[10px] border border-ink bg-white p-5 sm:p-7">
        <h2 className="font-display text-xl font-extrabold tracking-tight">
          Aradığınızı bulamadınız mı?
        </h2>
        <p className="mt-1.5 max-w-lg text-sm text-ink/60">
          Kriterlerinizi bırakın — uyan bir mülk portföye girdiği an sizi
          arayalım.
        </p>
        <div className="mt-5">
          <RequestForm
            slug={slug}
            districts={districts.map((d) => d.district)}
            rooms={[...ROOM_OPTIONS]}
            isAuto={isAutoVertical(tenant.vertical)}
          />
        </div>
      </section>
    </div>
  );
}
