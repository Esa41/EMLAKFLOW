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
import { ShowcaseRail } from "@/components/showcase-rail";
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

const updatedFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

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
    latestUpdate,
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
    prisma.listing.findFirst({
      where: { tenantId: tenant.id, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
  ]);

  const splitListings: SplitListing[] = listings.map((l) => ({
    ...toCardListing(l),
    lat: l.lat,
    lng: l.lng,
  }));

  const featuredCards = featuredListings.map(toCardListing);
  const newCards = newListings.map(toCardListing);

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
    tenant.aboutTitle ??
    (isAuto
      ? `${place} aradığınız araç, künyesiyle burada.`
      : `${place} aradığınız evi bulmanın kısa yolu.`);
  const tagline =
    tenant.showcaseTagline ??
    (isAuto
      ? "Seçilmiş stok, şeffaf fiyat, tek danışman. Aradığınızı bulamazsanız kriterinizi bırakın — uyan araç girdiği an sizi arayalım."
      : "Seçilmiş portföy, şeffaf fiyat, tek danışman. Aradığınızı listemizde bulamazsanız kriterinizi bırakın — uyan mülk girdiği an sizi arayalım.");

  const heroImage =
    tenant.officePhotoUrl ??
    featuredListings[0]?.media[0]?.cardUrl ??
    featuredListings[0]?.media[0]?.url ??
    newListings[0]?.media[0]?.cardUrl ??
    newListings[0]?.media[0]?.url ??
    null;

  const updatedAt = latestUpdate?.updatedAt ?? tenant.updatedAt;
  const updatedLabel = updatedFmt.format(updatedAt);

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

      <div className="-mx-4 sm:-mx-6">
        <ShowcaseHero
          displayName={displayName}
          district={tenant.district}
          eyebrow={eyebrow}
          headline={headline}
          tagline={tagline}
          heroImage={heroImage}
          heroImageAlt={displayName}
          stats={heroStats}
          updatedLabel={updatedLabel}
        />
      </div>

      {featuredCards.length > 0 && (
        <ShowcaseRail
          slug={slug}
          title="Öne Çıkanlar"
          subtitle={`Danışmanlarımızın bu hafta öne aldığı ${featuredCards.length} ${isAuto ? "araç" : "mülk"}.`}
          shelf="RAF 01"
          listings={featuredCards}
          isAuto={isAuto}
        />
      )}

      {newCards.length > 0 && (
        <ShowcaseRail
          slug={slug}
          title="Yeni Eklenenler"
          subtitle={`Son 14 günde portföye giren ${isAuto ? "araçlar" : "mülkler"}.`}
          shelf="RAF 02"
          listings={newCards}
          isAuto={isAuto}
          showNewBadges
        />
      )}

      <ShowcaseWorkspace
        listings={splitListings}
        slug={slug}
        searchParams={sp}
        districts={districts.map((d) => d.district)}
        isAuto={isAuto}
      />

      {recentlyClosed.length > 0 && (
        <section>
          <h2 className="bolum">Son Tamamlanan İşlemler</h2>
          <p className="mt-1.5 text-xs text-ink/45">
            Son 60 günde {recentlyClosed.length} işlem tamamlandı.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
            {recentlyClosed.map((l) => (
              <div
                key={l.id}
                className="overflow-hidden rounded-[10px] border border-ink/15 bg-white"
              >
                <div className="relative h-[84px] bg-brand-50">
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
                    className={`kunye kunye-satildi absolute -bottom-2.5 left-2 text-[9px]`}
                  >
                    {l.status === "SOLD" ? "Satıldı" : "Kiralandı"}
                  </span>
                </div>
                <div className="px-2.5 pb-2.5 pt-4">
                  <p className="line-clamp-1 text-xs font-bold">{l.title}</p>
                  <p className="mt-0.5 font-display text-[13px] font-extrabold tracking-tight text-ink/60 line-through decoration-ink/30">
                    {trMoney.format(Number(l.price))}
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

      <section id="talep-form" className="scroll-mt-20 rounded-xl border border-ink bg-white p-5 sm:p-7">
        <h2 className="font-display text-[21px] font-extrabold tracking-tight">
          Aradığınızı bulamadınız mı?
        </h2>
        <p className="mt-1.5 max-w-lg text-sm text-ink/60">
          Kriterlerinizi bırakın — uyan bir {isAuto ? "araç" : "mülk"} portföye
          girdiği an sizi arayalım.
        </p>
        <div className="mt-5">
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
