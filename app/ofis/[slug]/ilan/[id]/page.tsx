import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Phone, Building2, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { InfoForm } from "@/components/showcase-forms";
import { ShowcaseMap } from "@/components/showcase-map";
import { TrackListingView } from "@/components/vitrin-tracking";
import {
  seoTitle,
  seoDescription,
  mediaAltText,
  listingJsonLd,
  breadcrumbJsonLd,
} from "@/lib/seo";
import { trMoney, TYPE_TR } from "@/lib/labels";

const BASE_URL = (process.env.AUTH_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

type Params = Promise<{ slug: string; id: string }>;

async function getData(slug: string, id: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      phone: true,
      whatsapp: true,
      showcaseEnabled: true,
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
  const data = await getData(slug, id);
  if (!data) return {};
  const { listing, tenant } = data;
  // Şablon bazlı otomatik SEO (lib/seo.ts) — ilan alanlarından deterministik üretilir
  const title = seoTitle(listing, tenant.name);
  const desc = seoDescription(listing, tenant.name);
  return {
    title,
    description: desc,
    alternates: { canonical: `${BASE_URL}/ofis/${slug}/ilan/${id}` },
    openGraph: {
      title,
      description: desc,
      type: "website",
      url: `${BASE_URL}/ofis/${slug}/ilan/${id}`,
      images: listing.media[0] ? [{ url: listing.media[0].url }] : [],
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
  const data = await getData(slug, id);
  if (!data) notFound();
  const { tenant, listing: l } = data;

  const similar = await prisma.listing.findMany({
    where: {
      tenantId: tenant.id,
      status: "ACTIVE",
      id: { not: l.id },
      OR: [{ district: l.district }, { type: l.type }],
      purpose: l.purpose,
    },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { media: { orderBy: { order: "asc" }, take: 1 } },
  });

  const kod = l.refCode.replace(/^EF-\d{4}-0*/, "EF·");
  const specs: Array<[string, string | null]> = [
    ["İşlem", l.purpose === "SALE" ? "Satılık" : "Kiralık"],
    ["Tip", TYPE_TR[l.type]],
    ["Oda", l.rooms],
    ["Brüt m²", l.grossArea?.toString() ?? null],
    ["Net m²", l.netArea?.toString() ?? null],
    [
      "Kat",
      l.floor != null
        ? `${l.floor}${l.totalFloors ? ` / ${l.totalFloors}` : ""}`
        : null,
    ],
    [
      "Bina yaşı",
      l.buildingAge != null
        ? l.buildingAge === 0
          ? "Sıfır"
          : String(l.buildingAge)
        : null,
    ],
    ["Isıtma", l.heating],
    ["Aidat", l.dues != null ? trMoney.format(Number(l.dues)) : null],
    ["Tapu", l.deedStatus],
    ["Kredi", l.creditEligible ? "Uygun" : "Uygun değil"],
    ["Eşya", l.furnished ? "Eşyalı" : "Eşyasız"],
    ["Site", l.inSite ? "Site içinde" : "—"],
  ];
  const filled = specs.filter(([, v]) => v);

  const telHref = (p: string | null) =>
    p ? `tel:${p.replace(/\s/g, "")}` : null;
  const phone = l.agent?.phone ?? tenant.phone;
  const waNumber = tenant.whatsapp ?? phone;

  const baseUrl = BASE_URL;
  const jsonLd = listingJsonLd(
    { ...l, description: l.description, media: l.media },
    { name: tenant.name, slug },
    baseUrl,
  );
  const breadcrumb = breadcrumbJsonLd([
    { name: tenant.name, url: `${baseUrl}/ofis/${slug}` },
    { name: l.title, url: `${baseUrl}/ofis/${slug}/ilan/${l.id}` },
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
        <ArrowLeft size={13} /> Tüm portföy
      </Link>

      {/* Galeri */}
      <div>
        <div className="relative h-64 overflow-hidden rounded-[10px] border border-ink/15 bg-brand-50 sm:h-96">
          {l.media[0] ? (
            <Image
              src={l.media[0].url}
              alt={mediaAltText(l, 0)}
              fill
              priority
              sizes="(min-width: 1024px) 683px, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-ink/20 sm:h-96">
              <Building2 size={40} />
            </div>
          )}
          <span className="kunye absolute -bottom-3 left-4 shadow-sm">
            {kod} — {(l.neighborhood ?? l.district).toUpperCase()} /{" "}
            {l.city.toUpperCase()}
          </span>
        </div>
        {l.media.length > 1 && (
          <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {l.media.slice(1, 7).map((m, i) => (
              <div
                key={m.id}
                className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-ink/10"
              >
                <Image
                  src={m.url}
                  alt={mediaAltText(l, i + 1)}
                  fill
                  sizes="(min-width: 640px) 16vw, 25vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            {l.title}
          </h1>
          <p className="mt-2 font-display text-3xl font-extrabold tracking-tight text-brand-700">
            {trMoney.format(Number(l.price))}
            {l.purpose === "RENT" && (
              <span className="text-base font-medium text-ink/45"> /ay</span>
            )}
          </p>

          {l.description && (
            <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-ink/75">
              {l.description}
            </p>
          )}

          {/* Konum */}
          {l.lat != null && l.lng != null && (
            <>
              <h2 className="bolum mt-8">Konum</h2>
              <div className="mt-4">
                <ShowcaseMap
                  slug={slug}
                  mode="single"
                  height={200}
                  listings={[
                    {
                      id: l.id,
                      lat: l.lat,
                      lng: l.lng,
                      price: Number(l.price),
                      purpose: l.purpose,
                      refCode: kod,
                    },
                  ]}
                />
              </div>
            </>
          )}

          {/* Künye tablosu */}
          <h2 className="bolum mt-8">İlan Künyesi</h2>
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
        </div>

        {/* Danışman kartı */}
        <aside>
          <div className="rounded-[10px] border border-ink bg-white p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">
              İlan Danışmanı
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
                      `Merhaba, ${kod} künyeli "${l.title}" ilanı hakkında bilgi almak istiyorum.`,
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
              Görüşmede <b className="text-ink/70">{kod}</b> künyesini
              söylemeniz yeterli.
            </p>
          </div>

          <div className="mt-5 rounded-[10px] border border-ink/15 bg-white p-5">
            <InfoForm slug={slug} listingId={l.id} refCode={kod} />
          </div>
        </aside>
      </div>

      {/* Benzer ilanlar */}
      {similar.length > 0 && (
        <section>
          <h2 className="bolum">Benzer İlanlar</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {similar.map((s) => (
              <Link
                key={s.id}
                href={`/ofis/${slug}/ilan/${s.id}`}
                className="overflow-hidden rounded-[10px] border border-ink/15 bg-white hover:border-ink/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              >
                <div className="relative h-32 bg-brand-50">
                  {s.media[0] ? (
                    <Image
                      src={s.media[0].url}
                      alt={s.title}
                      fill
                      sizes="(min-width: 640px) 33vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink/20">
                      <Building2 size={24} />
                    </div>
                  )}
                </div>
                <div className="p-3.5">
                  <h3 className="line-clamp-1 text-sm font-bold">{s.title}</h3>
                  <p className="mt-1 font-display font-extrabold">
                    {trMoney.format(Number(s.price))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
