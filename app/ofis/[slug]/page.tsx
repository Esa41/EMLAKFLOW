import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { trMoney, ROOM_OPTIONS, TYPE_TR } from "@/lib/labels";
import { RequestForm } from "@/components/showcase-forms";
import { TrackImpressions } from "@/components/vitrin-tracking";
import { getSiteUser } from "@/lib/site-auth";
import { officeJsonLd } from "@/lib/seo";
import { getBaseUrl } from "@/lib/url";
import { isAutoVertical } from "@/lib/verticals";
import { HeroCarousel } from "@/components/hero-carousel";
import { ShowcaseSplitView, type SplitListing } from "@/components/showcase-split-view";
import { SaveSearchButton } from "@/components/save-search-button";
import { AnimatedCounter } from "@/components/animated-counter";

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
      city: true,
      district: true,
    },
  });
  if (!tenant) return {};
  const title = `${tenant.name} — Satılık ve Kiralık Portföy`;
  const description = `${tenant.name} güncel portföyü: ${tenant.city ?? "Türkiye"} genelinde satılık ve kiralık gayrimenkuller.`;
  const cover = await prisma.listingMedia.findFirst({
    where: { listing: { tenantId: tenant.id, status: "ACTIVE" } },
    orderBy: { order: "asc" },
    select: { url: true },
  });
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/ofis/${slug}` },
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

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
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
    },
  });
  if (!tenant || !tenant.showcaseEnabled) notFound();

  // Detaylı arama parametreleri (sayısal alanlar doğrulanır)
  const num = (v?: string) => {
    const n = Number(v);
    return v && !isNaN(n) && n > 0 ? n : null;
  };
  const minPrice = num(sp.minPrice);
  const maxPrice = num(sp.maxPrice);
  const minArea = num(sp.minArea);
  const q = sp.q?.trim() || null; // serbest metin: başlık / mahalle / ilçe / adres
  const typeFilter = LISTING_TYPES.includes(
    sp.type as (typeof LISTING_TYPES)[number],
  )
    ? (sp.type as (typeof LISTING_TYPES)[number])
    : null;

  const sortKey = sp.sort && sp.sort in SORT_OPTIONS ? sp.sort : "date_desc";
  const orderBy = SORT_OPTIONS[sortKey].orderBy;

  const siteUser = await getSiteUser(tenant.id);
  const favoriteIds = siteUser
    ? (
        await prisma.favorite.findMany({
          where: { siteUserId: siteUser.id },
          select: { listingId: true },
        })
      ).map((f) => f.listingId)
    : [];

  const [listings, districts, team, heroMedia, recentlyClosed] = await Promise.all([
    prisma.listing.findMany({
      where: {
        tenantId: tenant.id,
        status: "ACTIVE",
        ...(sp.purpose === "SALE" || sp.purpose === "RENT"
          ? { purpose: sp.purpose }
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
      },
      orderBy,
      include: {
        media: { orderBy: { order: "asc" }, take: 1 },
        _count: { select: { media: true } },
      },
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
    // Hero carousel görselleri — en son 5 aktif ilanın ilk fotoğrafı
    prisma.listingMedia.findMany({
      where: { listing: { tenantId: tenant.id, status: "ACTIVE" } },
      orderBy: [{ listing: { createdAt: "desc" } }, { order: "asc" }],
      distinct: ["listingId"],
      take: 5,
      select: { url: true, cardUrl: true, alt: true, listing: { select: { title: true } } },
    }),
    // Son satılan/kiralanan ilanlar — sosyal kanıt
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
  ]);

  // Split view için serialize
  const splitListings: SplitListing[] = listings.map((l) => ({
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
    lat: l.lat,
    lng: l.lng,
    mediaCount: l._count.media,
    image: l.media[0]?.cardUrl ?? l.media[0]?.url ?? null,
    imageAlt: l.media[0]?.alt ?? l.title,
  }));

  const heroImages = heroMedia.map((m) => ({
    url: m.cardUrl ?? m.url,
    alt: m.alt ?? m.listing?.title ?? tenant.name,
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

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = {
      q: sp.q,
      purpose: sp.purpose,
      district: sp.district,
      rooms: sp.rooms,
      type: sp.type,
      minPrice: sp.minPrice,
      maxPrice: sp.maxPrice,
      minArea: sp.minArea,
      sort: sp.sort,
      ...patch,
    };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/ofis/${slug}${s ? `?${s}` : ""}`;
  };

  const hasAdvanced = !!(typeFilter || minPrice || maxPrice || minArea);
  const activeFilterCount =
    (sp.purpose ? 1 : 0) +
    (sp.district ? 1 : 0) +
    (sp.rooms ? 1 : 0) +
    (typeFilter ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (minArea ? 1 : 0);

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

      {/* Hero Carousel */}
      <HeroCarousel
        officeName={tenant.name}
        tagline={
          tenant.showcaseTagline ??
          `Her ilan ${tenant.name} tarafından yerinde incelenip künyelenmiştir — fiyat, metrekare ve tapu bilgisi olduğu gibidir.`
        }
        listingCount={listings.length}
        images={heroImages}
      />

      {/* Filtreler */}
      <div className="space-y-3">
        {/* Kelime / ilçe / mahalle araması */}
        <form method="GET" className="flex gap-2">
          {sp.purpose && (
            <input type="hidden" name="purpose" value={sp.purpose} />
          )}
          {sp.type && <input type="hidden" name="type" value={sp.type} />}
          {sp.minPrice && (
            <input type="hidden" name="minPrice" value={sp.minPrice} />
          )}
          {sp.maxPrice && (
            <input type="hidden" name="maxPrice" value={sp.maxPrice} />
          )}
          {sp.minArea && (
            <input type="hidden" name="minArea" value={sp.minArea} />
          )}
          {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Kelime, mahalle veya ilçe ara — ör. Moda, deniz manzaralı, 3+1"
              className="w-full rounded-full border border-ink/20 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <button
            type="submit"
            className="btn-selvi shrink-0 rounded-full px-5 py-2.5 text-sm font-bold text-white"
          >
            Ara
          </button>
          {q && (
            <Link
              href={qs({ q: undefined })}
              className="flex shrink-0 items-center rounded-full border border-ink/20 px-4 py-2.5 text-sm font-medium text-ink/60 hover:border-ink/50"
            >
              Temizle
            </Link>
          )}
        </form>

        {q && (
          <p className="font-mono text-[11px] text-ink/50">
            &ldquo;{q}&rdquo; için {listings.length} sonuç
          </p>
        )}

        {/* Sonuç sayısı + sıralama */}
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] font-semibold text-ink/50">
            {listings.length} ilan
            {activeFilterCount > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[9px] text-white">
                {activeFilterCount} filtre
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <SaveSearchButton
              slug={slug}
              filters={{
                purpose: sp.purpose,
                district: sp.district,
                rooms: sp.rooms,
                type: sp.type,
                minPrice: sp.minPrice,
                maxPrice: sp.maxPrice,
                minArea: sp.minArea,
              }}
            />
            <div className="flex gap-1 rounded-full border border-ink/15 bg-white p-0.5">
              {Object.entries(SORT_OPTIONS).map(([key, opt]) => (
                <Link
                  key={key}
                  href={qs({ sort: key === "date_desc" ? undefined : key })}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    sortKey === key
                      ? "bg-ink text-white"
                      : "text-ink/50 hover:text-ink"
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            {
              label: "Tümü",
              href: qs({ purpose: undefined }),
              on: !sp.purpose,
            },
            {
              label: "Satılık",
              href: qs({ purpose: "SALE" }),
              on: sp.purpose === "SALE",
            },
            {
              label: "Kiralık",
              href: qs({ purpose: "RENT" }),
              on: sp.purpose === "RENT",
            },
          ].map((f) => (
            <Link
              key={f.label}
              href={f.href}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                f.on
                  ? "border-ink bg-ink text-white"
                  : "border-ink/20 bg-white text-ink/65 hover:border-ink/50"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {districts.map(({ district }) => (
            <Link
              key={district}
              href={qs({
                district: sp.district === district ? undefined : district,
              })}
              className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                sp.district === district
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-ink/15 bg-white text-ink/55 hover:border-ink/40"
              }`}
            >
              {district}
            </Link>
          ))}
          {ROOM_OPTIONS.slice(1, 7).map((r) => (
            <Link
              key={r}
              href={qs({ rooms: sp.rooms === r ? undefined : r })}
              className={`rounded-full border px-3 py-1 font-mono text-[11px] transition-colors ${
                sp.rooms === r
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-ink/15 bg-white text-ink/55 hover:border-ink/40"
              }`}
            >
              {r}
            </Link>
          ))}
        </div>

        {/* Detaylı arama — JS gerektirmez (GET formu) */}
        <details
          open={hasAdvanced}
          className="rounded-[10px] border border-ink/15 bg-white"
        >
          <summary className="cursor-pointer select-none px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink/60 hover:text-ink">
            Detaylı Arama{" "}
            {hasAdvanced && <span className="text-brand-600">· aktif</span>}
          </summary>
          <form
            method="GET"
            className="grid grid-cols-2 gap-3 border-t border-ink/10 p-4 sm:grid-cols-5"
          >
            {/* Aktif çip filtrelerini koru */}
            {sp.q && <input type="hidden" name="q" value={sp.q} />}
            {sp.purpose && (
              <input type="hidden" name="purpose" value={sp.purpose} />
            )}
            {sp.district && (
              <input type="hidden" name="district" value={sp.district} />
            )}
            {sp.rooms && <input type="hidden" name="rooms" value={sp.rooms} />}
            {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
            <div>
              <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-ink/50">
                Tip
              </label>
              <select
                name="type"
                defaultValue={sp.type ?? ""}
                className="w-full rounded-lg border border-ink/20 px-2.5 py-2 text-sm focus:border-brand-600 focus:outline-none"
              >
                <option value="">Tümü</option>
                {LISTING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_TR[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-ink/50">
                Min Fiyat (₺)
              </label>
              <input
                type="number"
                name="minPrice"
                min={0}
                defaultValue={sp.minPrice ?? ""}
                placeholder="0"
                className="w-full rounded-lg border border-ink/20 px-2.5 py-2 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-ink/50">
                Max Fiyat (₺)
              </label>
              <input
                type="number"
                name="maxPrice"
                min={0}
                defaultValue={sp.maxPrice ?? ""}
                placeholder="∞"
                className="w-full rounded-lg border border-ink/20 px-2.5 py-2 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-ink/50">
                Min Net m²
              </label>
              <input
                type="number"
                name="minArea"
                min={0}
                defaultValue={sp.minArea ?? ""}
                placeholder="0"
                className="w-full rounded-lg border border-ink/20 px-2.5 py-2 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>
            <div className="col-span-2 flex items-end gap-2 sm:col-span-1">
              <button
                type="submit"
                className="btn-selvi flex-1 rounded-lg px-4 py-2 text-sm font-bold text-white"
              >
                Ara
              </button>
              {hasAdvanced && (
                <Link
                  href={qs({
                    type: undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                    minArea: undefined,
                  })}
                  className="rounded-lg border border-ink/20 px-3 py-2 text-sm font-medium text-ink/60 hover:border-ink/50"
                >
                  Temizle
                </Link>
              )}
            </div>
          </form>
        </details>
      </div>

      {/* Vitrin — harita + ilan listesi split view */}
      <ShowcaseSplitView
        listings={splitListings}
        slug={slug}
        favoriteIds={favoriteIds}
        loggedIn={!!siteUser}
      />

      {/* Son tamamlanan işlemler — sosyal kanıt */}
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
                    {trMoney.format(Number(l.price))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hakkımızda / Vizyon — yalnız dolu alanlar görünür */}
      {hasAbout && (
        <section>
          <h2 className="bolum">Hakkımızda</h2>
          <div className="mt-4 rounded-[10px] border border-ink bg-white p-6">
            {/* Ofis fotoğrafı */}
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

      {/* Aradığını bulamayan müşteri → CRM'e talep */}
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
