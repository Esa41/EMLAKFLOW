import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { trMoney, ROOM_OPTIONS, TYPE_TR } from "@/lib/labels";
import { RequestForm } from "@/components/showcase-forms";
import { ShowcaseMap, type MapListing } from "@/components/showcase-map";
import { TrackImpressions } from "@/components/vitrin-tracking";
import { FavoriteButton } from "@/components/favorite-button";
import { getSiteUser } from "@/lib/site-auth";
import { officeJsonLd } from "@/lib/seo";
import { getBaseUrl } from "@/lib/url";

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
}>;

const LISTING_TYPES = [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "LAND",
  "COMMERCIAL",
  "OFFICE",
] as const;

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

  const siteUser = await getSiteUser(tenant.id);
  const favoriteIds = siteUser
    ? new Set(
        (
          await prisma.favorite.findMany({
            where: { siteUserId: siteUser.id },
            select: { listingId: true },
          })
        ).map((f) => f.listingId),
      )
    : new Set<string>();

  const [listings, districts, team] = await Promise.all([
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
      orderBy: { createdAt: "desc" },
      include: { media: { orderBy: { order: "asc" }, take: 1 } },
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
          select: { id: true, name: true, role: true },
        })
      : Promise.resolve([]),
  ]);

  const mapListings: MapListing[] = listings
    .filter((l) => l.lat != null && l.lng != null)
    .map((l) => ({
      id: l.id,
      lat: l.lat!,
      lng: l.lng!,
      price: Number(l.price),
      purpose: l.purpose,
      title: l.title,
      image: l.media[0]?.thumbUrl ?? l.media[0]?.url ?? null,
      rooms: l.rooms,
      area: l.netArea ?? l.grossArea ?? null,
    }));

  const stats = Array.isArray(tenant.aboutStats)
    ? (tenant.aboutStats as Array<{ value: string; label: string }>).filter(
        (x) => x && x.value && x.label,
      )
    : [];
  const hasAbout = !!(tenant.aboutText || tenant.visionText || stats.length);
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
      ...patch,
    };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/ofis/${slug}${s ? `?${s}` : ""}`;
  };

  const hasAdvanced = !!(typeFilter || minPrice || maxPrice || minArea);
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
      {/* Kahraman */}
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600">
          Güncel Portföy · {listings.length} ilan
        </p>
        <h1 className="mt-1.5 max-w-xl font-display text-[28px] font-extrabold leading-tight tracking-tight sm:text-4xl">
          {tenant.district ?? tenant.city ?? "Bölgenizde"} aradığınız ev,
          künyesiyle burada.
        </h1>
        <p className="mt-3 max-w-lg text-sm text-ink/60">
          {tenant.showcaseTagline ??
            `Her ilan ${tenant.name} tarafından yerinde incelenip künyelenmiştir — fiyat, metrekare ve tapu bilgisi olduğu gibidir.`}
        </p>
      </div>

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

      {/* Harita — tüm ilanlar fiyat plakasıyla */}
      {mapListings.length > 0 && (
        <section>
          <h2 className="bolum">Haritada Gezin</h2>
          <div className="mt-4">
            <ShowcaseMap listings={mapListings} slug={slug} />
          </div>
          <p className="mt-2 font-mono text-[11px] text-ink/50">
            Fiyat plakasına dokun → ilan detayına git. Filtreler haritayı da
            süzer.
          </p>
        </section>
      )}

      {/* Vitrin ızgarası */}
      {listings.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-ink/25 bg-white/60 p-12 text-center">
          <Building2 className="mx-auto mb-3 h-9 w-9 text-ink/20" />
          <p className="text-sm text-ink/55">
            Bu kriterlere uyan ilan şu an vitrinde yok — filtreleri genişletmeyi
            deneyin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => {
            return (
              <Link
                key={l.id}
                href={`/ofis/${slug}/ilan/${l.slug ? `${l.id}-${l.slug}` : l.id}`}
                data-imp={l.id}
                className="group overflow-hidden rounded-[10px] border border-ink/15 bg-white transition-colors hover:border-ink/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              >
                <div className="relative">
                  <FavoriteButton
                    slug={slug}
                    listingId={l.id}
                    initialFavorited={favoriteIds.has(l.id)}
                    loggedIn={!!siteUser}
                  />
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
                  <span className="kunye absolute -bottom-3 left-3 max-w-[85%] truncate shadow-sm">
                    {l.title}
                  </span>
                  <span className="absolute right-3 top-3 rounded-md border border-ink bg-paper px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider">
                    {l.purpose === "SALE" ? "Satılık" : "Kiralık"}
                  </span>
                </div>
                <div className="px-4 pb-4 pt-6">
                  <h3 className="line-clamp-1 text-[15px] font-bold">
                    {l.title}
                  </h3>
                  <p className="mt-1.5 font-display text-lg font-extrabold tracking-tight">
                    {trMoney.format(Number(l.price))}
                    {l.purpose === "RENT" && (
                      <span className="text-sm font-medium text-ink/45">
                        {" "}
                        /ay
                      </span>
                    )}
                  </p>
                  <div className="olcu mt-2.5">
                    <span className="olcu-cizgi" />
                    <span>
                      {l.rooms ?? "—"} · net {l.netArea ?? l.grossArea ?? "—"}{" "}
                      m²
                    </span>
                    <span className="olcu-cizgi" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Hakkımızda / Vizyon — yalnız dolu alanlar görünür */}
      {hasAbout && (
        <section>
          <h2 className="bolum">Hakkımızda</h2>
          <div className="mt-4 rounded-[10px] border border-ink bg-white p-6">
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
                      {st.value}
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
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 font-display font-extrabold text-white">
                      {u.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
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
      <section className="rounded-[10px] border border-ink bg-white p-5 sm:p-7">
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
          />
        </div>
      </section>
    </div>
  );
}
