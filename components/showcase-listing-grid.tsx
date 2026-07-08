import Link from "next/link";
import Image from "next/image";
import { Building2 } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { fmtMoney } from "@/lib/labels";
import type { SplitListing } from "@/components/showcase-workspace";

/** Server-rendered ilan ızgarası — client bundle dışında kalır (LCP/INP). */
export function ShowcaseListingGrid({
  listings,
  slug,
  favoriteIds,
  loggedIn,
  clearHref,
}: {
  listings: SplitListing[];
  slug: string;
  favoriteIds: string[];
  loggedIn: boolean;
  clearHref: string;
}) {
  const favSet = new Set(favoriteIds);

  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/25 bg-white/60 p-16 text-center">
        <Building2 className="mx-auto mb-4 h-10 w-10 text-ink/20" />
        <h3 className="font-display text-lg font-bold text-ink">Sonuç bulunamadı</h3>
        <p className="mt-2 text-sm text-ink/55">Filtreleri esneterek tekrar aramayı deneyin.</p>
        <Link
          href={clearHref}
          className="mt-4 inline-block rounded-full bg-ink px-5 py-2 text-sm font-bold text-white"
        >
          Filtreleri Temizle
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => (
        <Link
          key={l.id}
          href={`/ofis/${slug}/ilan/${l.slug ? `${l.id}-${l.slug}` : l.id}`}
          data-imp={l.id}
          className="group overflow-hidden rounded-xl border border-ink/15 bg-white transition-all hover:border-ink/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          <div className="relative">
            <FavoriteButton
              slug={slug}
              listingId={l.id}
              initialFavorited={favSet.has(l.id)}
              loggedIn={loggedIn}
            />
            <div className="relative h-48 overflow-hidden bg-brand-50">
              {l.image ? (
                <Image
                  src={l.image}
                  alt={l.imageAlt}
                  fill
                  loading="lazy"
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-ink/20">
                  <Building2 size={30} />
                </div>
              )}
              {l.mediaCount > 1 && (
                <span className="absolute left-3 top-3 flex items-center gap-1 rounded-md bg-ink/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                  📷 {l.mediaCount}
                </span>
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
            <h3 className="line-clamp-1 text-[15px] font-bold">{l.title}</h3>
            <p className="mt-0.5 text-xs text-ink/45">
              {l.district}
              {l.neighborhood ? ` · ${l.neighborhood}` : ""}
            </p>
            <p className="mt-1.5 font-display text-lg font-extrabold tracking-tight">
              {fmtMoney(l.price, l.currency)}
              {l.purpose === "RENT" && (
                <span className="text-sm font-medium text-ink/45"> /ay</span>
              )}
            </p>
            {l.netArea && l.netArea > 0 && (
              <p className="text-[11px] text-ink/40">
                {fmtMoney(Math.round(l.price / l.netArea), l.currency)}/m²
              </p>
            )}
            <div className="olcu mt-2.5">
              <span className="olcu-cizgi" />
              <span>
                {l.rooms ?? "—"} · net {l.netArea ?? l.grossArea ?? "—"} m²
              </span>
              <span className="olcu-cizgi" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
