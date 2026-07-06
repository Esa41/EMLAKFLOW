"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Building2, Map, X } from "lucide-react";
import { ShowcaseMap, type MapListing } from "@/components/showcase-map";
import { FavoriteButton } from "@/components/favorite-button";
import { trMoney } from "@/lib/labels";

export type SplitListing = {
  id: string;
  title: string;
  slug: string | null;
  purpose: string;
  price: number;
  rooms: string | null;
  netArea: number | null;
  grossArea: number | null;
  district: string;
  neighborhood: string | null;
  lat: number | null;
  lng: number | null;
  mediaCount: number;
  image: string | null;
  imageAlt: string;
};

/**
 * Harita-liste split view — desktop'ta yan yana, mobilde toggle.
 * Karta hover → haritada pin vurgulanır.
 */
export function ShowcaseSplitView({
  listings,
  slug,
  favoriteIds,
  loggedIn,
}: {
  listings: SplitListing[];
  slug: string;
  favoriteIds: string[];
  loggedIn: boolean;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const cardRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const favSet = new Set(favoriteIds);

  const mapListings: MapListing[] = listings
    .filter((l) => l.lat != null && l.lng != null)
    .map((l) => ({
      id: l.id,
      lat: l.lat!,
      lng: l.lng!,
      price: l.price,
      purpose: l.purpose,
      title: l.title,
      image: l.image,
      rooms: l.rooms,
      area: l.netArea ?? l.grossArea ?? null,
    }));

  const handlePinClick = useCallback((listingId: string) => {
    const l = listings.find((x) => x.id === listingId);
    if (l) {
      window.location.href = `/ofis/${slug}/ilan/${l.slug ? `${l.id}-${l.slug}` : l.id}`;
    }
  }, [listings, slug]);

  if (listings.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-ink/25 bg-white/60 p-12 text-center">
        <Building2 className="mx-auto mb-3 h-9 w-9 text-ink/20" />
        <p className="text-sm text-ink/55">
          Bu kriterlere uyan ilan şu an vitrinde yok — filtreleri genişletmeyi
          deneyin.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Mobil harita toggle */}
      {mapListings.length > 0 && (
        <div className="mb-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMapOpen(!mobileMapOpen)}
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink/65 transition-colors hover:border-ink/50"
          >
            {mobileMapOpen ? <X size={14} /> : <Map size={14} />}
            {mobileMapOpen ? "Haritayı kapat" : "Haritada gör"}
          </button>
          {mobileMapOpen && (
            <div className="mt-3">
              <ShowcaseMap
                listings={mapListings}
                slug={slug}
                height={320}
                highlightedId={hoveredId}
                onPinClick={handlePinClick}
              />
            </div>
          )}
        </div>
      )}

      {/* Desktop/Tablet Harita — Üstte büyük */}
      {mapListings.length > 0 && (
        <div className="mb-8 hidden lg:block">
          <div className="overflow-hidden rounded-2xl border border-ink/15 shadow-sm">
            <ShowcaseMap
              listings={mapListings}
              slug={slug}
              height={500}
              highlightedId={hoveredId}
              onPinClick={handlePinClick}
            />
          </div>
          <p className="mt-2 text-right font-mono text-[11px] text-ink/50">
            Fiyat plakasına dokun → ilan detayına git. Kartların üzerine geldiğinizde haritada vurgulanır.
          </p>
        </div>
      )}

      {/* İlan listesi */}
      <div className="min-w-0 flex-1">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <Link
                key={l.id}
                ref={(el) => { cardRefs.current[l.id] = el; }}
                href={`/ofis/${slug}/ilan/${l.slug ? `${l.id}-${l.slug}` : l.id}`}
                data-imp={l.id}
                className="group overflow-hidden rounded-[10px] border border-ink/15 bg-white transition-all hover:border-ink/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
                onMouseEnter={() => setHoveredId(l.id)}
                onMouseLeave={() => setHoveredId(null)}
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
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-ink/20">
                        <Building2 size={30} />
                      </div>
                    )}
                    {/* Fotoğraf sayacı */}
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
                  <h3 className="line-clamp-1 text-[15px] font-bold">
                    {l.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-ink/45">
                    {l.district}
                    {l.neighborhood ? ` · ${l.neighborhood}` : ""}
                  </p>
                  <p className="mt-1.5 font-display text-lg font-extrabold tracking-tight">
                    {trMoney.format(l.price)}
                    {l.purpose === "RENT" && (
                      <span className="text-sm font-medium text-ink/45">
                        {" "}
                        /ay
                      </span>
                    )}
                  </p>
                  {l.netArea && l.netArea > 0 && (
                    <p className="text-[11px] text-ink/40">
                      {trMoney.format(Math.round(l.price / l.netArea))}/m²
                    </p>
                  )}
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
