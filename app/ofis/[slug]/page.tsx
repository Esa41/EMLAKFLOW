import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import type { ListingPurpose } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { trMoney, ROOM_OPTIONS } from "@/lib/labels";
import { RequestForm } from "@/components/showcase-forms";
import { TrackImpressions } from "@/components/vitrin-tracking";
import { officeJsonLd } from "@/lib/seo";
import { getBaseUrl } from "@/lib/url";
import { isAutoVertical } from "@/lib/verticals";
import { ShowcaseWorkspace, type SplitListing } from "@/components/showcase-workspace";
import { ShowcaseHero } from "@/components/showcase-hero";
import { ShowcaseCollections } from "@/components/showcase-collections";
import { AnimatedCounter } from "@/components/animated-counter";
import type { ShowcaseCardListing } from "@/components/showcase-card";

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

const SORT_OPTIONS: Record<string, { label: string; orderBy: Record<string, string> }> = {
  date_desc: { label: "En yeni", orderBy: { createdAt: "desc" } },
  price_asc: { label: "Fiyat ↑", orderBy: { price: "asc" } },
  price_desc: { label: "Fiyat ↓", orderBy: { price: "desc" } },
  area_desc: { label: "m² ↓", orderBy: { netArea: "desc" } },
};

function toCardListing(
  l: {
    id: string;
    title: string;
    slug: string | null;
    purpose: string;
    price: unknown;
    rooms: string | null;
    netArea: number | null;
    grossArea: number | null;
    district: string;
    neighborhood: string | null;
    features: string[];
    vehicleYear?: number | null;
    media: Array<{ cardUrl: string | null; url: string; alt: string | null }>;
    _count?: { media: number };
  },
): ShowcaseCardListing {
  return {
    id: l.id,
    title: l.title,
    slug: l.slug,
    purpose: l.purpose,
    price: Number(l.price),
    rooms: l.rooms,
    netArea: l.netArea,
    grossArea: l.grossArea,
    district: l.district,
    neighborhood: l.neighborhood,
    features: l.features,
    vehicleYear: l.vehicleYear,
    mediaCount: l._count?.media,
    image: l.media[0]?.cardUrl ?? l.media[0]?.url ?? null,
    imageAlt: l.media[0]?.alt ?? l.title,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      brandName: true,
      plan: true,
      city: true,
      district: true,
    },
  });
  if (!tenant) return {};
  const displayName = tenant.brandName?.trim() || tenant.name;
  const title = `${displayName} — Satılık ve Kiralık Portföy`;
  const description = `${displayName} güncel portföyü: ${tenant.city ?? "Türkiye"} genelinde satılık ve kiralık gayrimenkuller.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${BASE_URL}/ofis/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${BASE_URL}/ofis/${slug}`,
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

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      brandName: true,
      city: true,
      district: true,
      showcaseEnabled: true,
      showcaseHeadline: true,
      showcaseTagline: true,
      aboutTitle: true,
      aboutText: true,
      visionText: true,
      aboutStats: true,
      showTeam: true,
      vertical: true,
      officePhotoUrl: true,
      updatedAt: true,
    },
  });
  if (!tenant || !tenant.showcaseEnabled) notFound();

  const displayName = tenant.brandName?.trim() || tenant.name;
  const isAuto = isAutoVertical(tenant.vertical);

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
  const orderBy = SORT_OPTIONS[sortKey].orderBy;

  const listingWhere = {
    tenantId: tenant.id,
    status: "ACTIVE" as const,
    ...(sp.purpose === "SALE" || sp.purpose === "RENT"
      ? { purpose: sp.purpose as ListingPurpose }
      : {}),
    ...(sp.district ? { district: sp.district } : {}),
    ...(sp.rooms ? { rooms: sp.rooms } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { neighborhood: { contains: q, mode: "insensitive" as const } },
            { district: { contains: q, mode: "insensitive" as const } },
            { address: { contains: q, mode: "insensitive" as const } },
            { refCode: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(minPrice || maxPrice
      ? {
          price: {
            ...(minPrice ? { gte: minPrice } : {}),
            ...(maxPrice ? { lte: maxPrice } : {}),
          },
        }
      : {}),
    ...(minArea ? { netArea: { gte: minArea } } : {}),
  };

  const mediaInclude = {
    media: { orderBy: { order: "asc" as const }, take: 1 },
    _count: { select: { media: true } },
  };

  const [
    listings,
    featuredListings,
    newListings,
    districts,
    team,
    recentlyClosed,
    activeCount,
    completedCount,
    neighborhoodCount,
  ] = await Promise.all([
    prisma.listing.findMany({
      where: listingWhere,
      orderBy,
      include: mediaInclude,
    }),
    prisma.listing.findMany({
      where: { tenantId: tenant.id, status: "ACTIVE", featured: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: mediaInclude,
    }),
    prisma.listing.findMany({
      where: {
        tenantId: tenant.id,
        status: "ACTIVE",
        createdAt: { gte: new Date(Date.now() - 14 * 86400000) },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: mediaInclude,
    }),
    prisma.listing.findMany({
      where: { tenantId: tenant.id, status: "ACTIVE" },
      select: { district: true },
      distinct: ["district"],
      orderBy: { district: "asc" },
    }),
    tenant.showTeam
      ? prisma.user.findMany({
          where: { tenantId: tenant.id, isActive: true },
          orderBy: [{ role: "asc" }, { name: "asc" }],
          select: { id: true, name: true, role: true, photoUrl: true },
        })
      : Promise.resolve([]),
    prisma.listing.findMany({
      where: {
        tenantId: tenant.id,
        status: { in: ["SOLD", "RENTED"] },
        updatedAt: { gte: new Date(Date.now() - 60 * 86400000) },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { media: { orderBy: { order: "asc" }, take: 1 } },
    }),
    prisma.listing.count({
      where: { tenantId: tenant.id, status: "ACTIVE" },
    }),
    prisma.listing.count({
      where: { tenantId: tenant.id, status: { in: ["SOLD", "RENTED"] } },
    }),
    prisma.listing.findMany({
      where: { tenantId: tenant.id, status: "ACTIVE", neighborhood: { not: null } },
      select: { neighborhood: true },
      distinct: ["neighborhood"],
    }),
  ]);

  const splitListings: SplitListing[] = listings.map((l) => ({
    ...toCardListing(l),
    hasVideo: false,
    lat: l.lat,
    lng: l.lng,
  }));

  const featuredCards = featuredListings.map((l) => ({
    ...toCardListing(l),
    hasVideo: false,
  }));
  const newCards = newListings.map((l) => ({
    ...toCardListing(l),
    hasVideo: false,
  }));

  const savedStats = Array.isArray(tenant.aboutStats)
    ? (tenant.aboutStats as Array<{ value: string; label: string }>).filter(
        (x) => x && x.value && x.label,
      )
    : [];

  const heroStats =
    savedStats.length >= 4
      ? savedStats.slice(0, 4)
      : [
          { value: String(activeCount), label: isAuto ? "Aktif Araç" : "Aktif İlan" },
          { value: `${completedCount}+`, label: "Tamamlanan İşlem" },
          { value: String(neighborhoodCount.length || districts.length), label: isAuto ? "Bölge" : "Mahalle" },
          ...(savedStats[0] ? [savedStats[0]] : [{ value: "—", label: "Tecrübe" }]),
        ].slice(0, 4);

  const place = tenant.district ?? tenant.city ?? "Bölgeniz";
  const eyebrow = tenant.aboutText
    ? `${place}'da butik ${isAuto ? "otomotiv galerisi" : "gayrimenkul ofisi"}`
    : `${place} · güncel portföy`;
  const headline =
    tenant.showcaseHeadline?.trim() ||
    (isAuto
      ? `${place}, aradığınız araç künyesiyle burada.`
      : "Aradığınız ev, arsa ya da iş yeri — güvenle burada.");
  const tagline =
    tenant.showcaseTagline ??
    (isAuto
      ? "Seçilmiş stok, şeffaf fiyat, tek danışman. Aradığınızı bulamazsanız kriterinizi bırakın — uyan araç girdiği an sizi arayalım."
      : "Seçilmiş portföy, şeffaf fiyat, tek danışman. Aradığınızı listemizde bulamazsanız kriterinizi bırakın — uyan mülk girdiği an sizi arayalım.");

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
    <div className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TrackImpressions tenantId={tenant.id} />

      <div className="-mx-4 -mt-8 sm:-mx-6">
        <ShowcaseHero
          displayName={displayName}
          district={tenant.district}
          eyebrow={eyebrow}
          headline={headline}
          tagline={tagline}
          stats={heroStats}
          slug={slug}
          badges={[
            `${activeCount} AKTİF ${isAuto ? "ARAÇ" : "İLAN"}`,
            `${neighborhoodCount.length || districts.length} ${isAuto ? "BÖLGE" : "MAHALLE"}`,
          ]}
          isAuto={isAuto}
          heroImage={featuredCards[0]?.image ?? splitListings[0]?.image ?? null}
          video={null}
        />
      </div>

      <ShowcaseCollections
        slug={slug}
        featured={featuredCards}
        newest={newCards}
        isAuto={isAuto}
      />

      <ShowcaseWorkspace
        listings={splitListings}
        slug={slug}
        searchParams={sp}
        districts={districts.map((d) => d.district)}
        isAuto={isAuto}
      />

      {recentlyClosed.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="mb-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-600">
              Arşiv
            </p>
            <h2 className="mt-3 font-display text-[clamp(24px,3.2vw,38px)] font-extrabold tracking-tight">
              Son tamamlanan işlemler
            </h2>
            <p className="mt-2 text-[14px] text-ink/50">
              Son 60 günde {recentlyClosed.length} işlem tamamlandı.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {recentlyClosed.map((l) => (
              <div key={l.id}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-brand-50">
                  {l.media[0] ? (
                    <Image
                      src={l.media[0].cardUrl ?? l.media[0].url}
                      alt={l.media[0].alt ?? l.title}
                      fill
                      loading="lazy"
                      sizes="(min-width: 1024px) 16vw, 33vw"
                      className="object-cover opacity-70"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink/15">
                      <Building2 size={20} />
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-wide text-ink backdrop-blur">
                    {l.status === "SOLD" ? "Satıldı" : "Kiralandı"}
                  </span>
                </div>
                <p className="mt-2 line-clamp-1 text-[12px] font-semibold">{l.title}</p>
                <p className="font-display text-[13px] font-extrabold tracking-tight text-ink/45 line-through decoration-ink/25">
                  {trMoney.format(Number(l.price))}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasAbout && (
        <section className="py-20 sm:py-28">
          {tenant.officePhotoUrl && (
            <div className="relative mx-auto mb-14 h-56 max-w-4xl overflow-hidden rounded-3xl sm:h-80">
              <Image
                src={tenant.officePhotoUrl}
                alt={`${tenant.name} ofis`}
                fill
                sizes="(min-width: 1024px) 960px, 100vw"
                className="object-cover"
              />
            </div>
          )}
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-600">
              Hakkında
            </p>
            {tenant.aboutTitle && (
              <h2 className="mt-4 font-display text-[clamp(28px,4vw,46px)] font-extrabold leading-[1.05] tracking-tight text-balance">
                {tenant.aboutTitle}
              </h2>
            )}
            {tenant.aboutText && (
              <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-ink/60">
                {tenant.aboutText}
              </p>
            )}
          </div>

          {tenant.visionText && (
            <div className="mx-auto mt-20 max-w-4xl text-center">
              <blockquote className="font-display text-[clamp(26px,4.6vw,52px)] font-extrabold leading-[1.08] tracking-tight text-balance">
                &ldquo;{tenant.visionText}&rdquo;
              </blockquote>
              <cite className="mt-7 block font-mono text-[11px] uppercase not-italic tracking-[0.18em] text-brand-600">
                {displayName} · Vizyon
              </cite>
            </div>
          )}

          {stats.length > 0 && (
            <div className="mx-auto mt-20 flex max-w-3xl flex-wrap items-start justify-center gap-x-16 gap-y-10">
              {stats.slice(0, 3).map((st) => (
                <div key={st.label} className="text-center">
                  <p className="font-display text-[clamp(40px,5vw,64px)] font-extrabold tracking-tight">
                    <AnimatedCounter value={st.value} />
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">
                    {st.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {team.length > 0 && (
            <div className="mx-auto mt-20 grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-3">
              {team.map((u) => (
                <div key={u.id} className="text-center">
                  {u.photoUrl ? (
                    <div className="relative mx-auto aspect-square w-full max-w-[168px] overflow-hidden rounded-2xl">
                      <Image src={u.photoUrl} alt={u.name} fill sizes="168px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="mx-auto flex aspect-square w-full max-w-[168px] items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 font-display text-3xl font-extrabold text-white">
                      {u.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                  )}
                  <p className="mt-4 font-display text-lg font-bold">{u.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-600">
                    {ROLE_TR[u.role]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section id="talep-form" className="scroll-mt-20 py-20 text-center sm:py-28">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-600">
          İletişim
        </p>
        <h2 className="mt-4 font-display text-[clamp(28px,4vw,46px)] font-extrabold tracking-tight text-balance">
          Aradığınızı söyleyin.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-ink/60">
          Kriterlerinizi bırakın — uyan bir {isAuto ? "araç" : "mülk"} portföye
          girdiği an sizi arayalım.
        </p>
        <div className="mx-auto mt-9 max-w-2xl text-left">
          <RequestForm
            slug={slug}
            districts={districts.map((d) => d.district)}
            rooms={[...ROOM_OPTIONS]}
            isAuto={isAuto}
          />
        </div>
      </section>
    </div>
  );
}
