"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Building2, Map, X, SlidersHorizontal, Search } from "lucide-react";
import { ShowcaseMap, type MapListing } from "@/components/showcase-map";
import { SaveSearchButton } from "@/components/save-search-button";
import { ShowcaseCard, type ShowcaseCardListing } from "@/components/showcase-card";
import { ROOM_OPTIONS, TYPE_TR } from "@/lib/labels";

export type SplitListing = ShowcaseCardListing & {
  lat: number | null;
  lng: number | null;
};

const LISTING_TYPES = ["APARTMENT", "HOUSE", "VILLA", "LAND", "COMMERCIAL", "OFFICE"] as const;
const SORT_OPTIONS: Record<string, string> = {
  date_desc: "En yeni",
  price_asc: "Fiyat ↑",
  price_desc: "Fiyat ↓",
  area_desc: "m² ↓",
};

export function ShowcaseWorkspace({
  listings,
  slug,
  districts,
  isAuto = false,
}: {
  listings: SplitListing[];
  slug: string;
  searchParams: Record<string, string | undefined>;
  districts: string[];
  isAuto?: boolean;
}) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const purpose = searchParams.get("purpose") ?? "";
  const type = searchParams.get("type") ?? "";
  const district = searchParams.get("district") ?? "";
  const rooms = searchParams.get("rooms") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const minArea = searchParams.get("minArea") ?? "";
  const sort = searchParams.get("sort") ?? "date_desc";

  const mapListings: MapListing[] = useMemo(
    () =>
      listings
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
        })),
    [listings],
  );

  const handlePinClick = useCallback(
    (listingId: string) => {
      const l = listings.find((x) => x.id === listingId);
      if (l) {
        window.location.href = `/ofis/${slug}/ilan/${l.slug ? `${l.id}-${l.slug}` : l.id}`;
      }
    },
    [listings, slug],
  );

  const qs = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") p.delete(k);
      else p.set(k, v);
    }
    const s = p.toString();
    return `${pathname}${s ? `?${s}` : ""}`;
  };

  const activeFilterCount =
    (purpose ? 1 : 0) +
    (district ? 1 : 0) +
    (rooms ? 1 : 0) +
    (type ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (minArea ? 1 : 0);

  const FilterFields = () => (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-ink/60">
          İşlem & Tip
        </label>
        <div className="flex gap-2">
          <select name="purpose" defaultValue={purpose} className="w-1/2 rounded-lg border border-ink/20 px-3 py-2.5 text-sm focus:border-brand-600 focus:outline-none">
            <option value="">Tümü</option>
            <option value="SALE">Satılık</option>
            <option value="RENT">Kiralık</option>
          </select>
          <select name="type" defaultValue={type} className="w-1/2 rounded-lg border border-ink/20 px-3 py-2.5 text-sm focus:border-brand-600 focus:outline-none">
            <option value="">Tüm Tipler</option>
            {LISTING_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_TR[t]}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-ink/60">
          Konum & Özellik
        </label>
        <div className="flex gap-2">
          <select name="district" defaultValue={district} className="w-1/2 rounded-lg border border-ink/20 px-3 py-2.5 text-sm focus:border-brand-600 focus:outline-none">
            <option value="">Tüm İlçeler</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select name="rooms" defaultValue={rooms} className="w-1/2 rounded-lg border border-ink/20 px-3 py-2.5 text-sm focus:border-brand-600 focus:outline-none">
            <option value="">Tüm Odalar</option>
            {ROOM_OPTIONS.slice(1, 7).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-ink/60">
          Fiyat Aralığı
        </label>
        <div className="flex items-center gap-2">
          <input type="number" name="minPrice" defaultValue={minPrice} placeholder="Min ₺" min={0} className="w-1/2 rounded-lg border border-ink/20 px-3 py-2.5 text-sm focus:border-brand-600 focus:outline-none" />
          <span className="text-ink/30">-</span>
          <input type="number" name="maxPrice" defaultValue={maxPrice} placeholder="Max ₺" min={0} className="w-1/2 rounded-lg border border-ink/20 px-3 py-2.5 text-sm focus:border-brand-600 focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-ink/60">
          Min Net Alan
        </label>
        <div className="relative">
          <input type="number" name="minArea" defaultValue={minArea} placeholder="0" min={0} className="w-full rounded-lg border border-ink/20 px-3 py-2.5 pr-8 text-sm focus:border-brand-600 focus:outline-none" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-ink/40">m²</span>
        </div>
      </div>
    </div>
  );

  return (
    <section id="portfoy" className="relative scroll-mt-20 pt-14 sm:pt-20">
      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-600">
          Tüm portföy
        </p>
        <h2 className="mt-3 font-display text-[clamp(26px,3.6vw,42px)] font-extrabold leading-[1.04] tracking-tight">
          Filtreleyin, keşfedin.
        </h2>
        <p className="mt-2 text-[15px] text-ink/55">
          Haritada veya listede gezin, kriterlerinize göre süzün.
        </p>
      </div>

      <div className="mb-4 space-y-4">
        <form method="GET" className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" size={16} />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Kelime, mahalle veya ilçe ara…"
              className="w-full rounded-full border border-ink/15 bg-white py-2.5 pl-10 pr-4 text-sm shadow-[0_1px_2px_rgba(23,32,28,0.04)] transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            {q && (
              <Link href={qs({ q: null })} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-ink/10 p-1 text-ink/60 hover:bg-ink/20 hover:text-ink">
                <X size={12} />
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 bg-white py-2.5 pl-4 pr-5 text-sm font-semibold shadow-[0_1px_2px_rgba(23,32,28,0.04)] lg:hidden"
            >
              <SlidersHorizontal size={16} />
              Filtreler
              {activeFilterCount > 0 && (
                <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="hidden items-center gap-2 lg:flex">
              <select name="purpose" defaultValue={purpose} onChange={(e) => router.push(qs({ purpose: e.target.value }))} className="cursor-pointer rounded-full border border-ink/15 bg-white px-4 py-2.5 text-[13px] font-semibold shadow-[0_1px_2px_rgba(23,32,28,0.04)] outline-none hover:border-ink/40">
                <option value="">İşlem: Tümü</option>
                <option value="SALE">Satılık</option>
                <option value="RENT">Kiralık</option>
              </select>
              <select name="type" defaultValue={type} onChange={(e) => router.push(qs({ type: e.target.value }))} className="cursor-pointer rounded-full border border-ink/15 bg-white px-4 py-2.5 text-[13px] font-semibold shadow-[0_1px_2px_rgba(23,32,28,0.04)] outline-none hover:border-ink/40">
                <option value="">Tip: Tümü</option>
                {LISTING_TYPES.map((t) => <option key={t} value={t}>{TYPE_TR[t]}</option>)}
              </select>
              <button type="button" onClick={() => setMobileFilterOpen(true)} className="flex items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2.5 text-[13px] font-semibold shadow-[0_1px_2px_rgba(23,32,28,0.04)] hover:border-brand-600">
                <SlidersHorizontal size={15} className="text-brand-700" />
                Detaylı
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] text-white">{activeFilterCount}</span>
                )}
              </button>
            </div>

            <button type="submit" className="btn-selvi hidden rounded-full px-5 py-2.5 text-sm font-bold text-white lg:block">
              Ara
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-3.5">
          <div className="flex items-center gap-3.5">
            <p className="font-mono text-[11px] font-semibold text-ink/50">
              {listings.length} ilan bulundu
            </p>
            <div className="inline-flex rounded-full border border-ink/15 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-full px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] ${
                  viewMode === "list" ? "bg-ink text-white" : "text-ink/50"
                }`}
              >
                Liste
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                disabled={mapListings.length === 0}
                className={`rounded-full px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] disabled:opacity-40 ${
                  viewMode === "map" ? "bg-ink text-white" : "text-ink/50"
                }`}
              >
                Harita
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SaveSearchButton
              slug={slug}
              filters={{ purpose, district, rooms, type, minPrice, maxPrice, minArea }}
            />
            <div className="flex gap-0.5 rounded-full border border-ink/15 bg-white p-0.5">
              {Object.entries(SORT_OPTIONS).map(([key, label]) => (
                <Link
                  key={key}
                  href={qs({ sort: key === "date_desc" ? null : key })}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                    sort === key ? "bg-ink text-white" : "text-ink/50 hover:text-ink"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/25 bg-white/60 p-16 text-center">
          <Building2 className="mx-auto mb-4 h-10 w-10 text-ink/20" />
          <h3 className="font-display text-lg font-bold text-ink">Sonuç bulunamadı</h3>
          <p className="mt-2 text-sm text-ink/55">Filtreleri esneterek tekrar aramayı deneyin.</p>
          <Link href={pathname} className="mt-4 inline-block rounded-full bg-ink px-5 py-2 text-sm font-bold text-white">
            Filtreleri Temizle
          </Link>
        </div>
      ) : viewMode === "map" ? (
        <div className="relative h-[min(52vh,420px)] overflow-hidden rounded-2xl border border-ink/15 bg-brand-50/80 sm:h-[min(56vh,480px)] lg:h-[500px]">
          <ShowcaseMap
            listings={mapListings}
            slug={slug}
            height={500}
            onPinClick={handlePinClick}
            zoomBias="close"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ShowcaseCard key={l.id} slug={slug} listing={l} isAuto={isAuto} />
          ))}
        </div>
      )}

      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-sm">
          <div className="flex w-full max-w-sm flex-col bg-white shadow-2xl sm:border-l sm:border-ink/15">
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <h2 className="font-display text-lg font-extrabold">Filtreler</h2>
              <button onClick={() => setMobileFilterOpen(false)} className="rounded-full bg-ink/5 p-2 text-ink/60 hover:bg-ink/10 hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">
              <form id="drawer-filter-form" method="GET" action={pathname}>
                {q && <input type="hidden" name="q" value={q} />}
                {sort && <input type="hidden" name="sort" value={sort} />}
                <FilterFields />
              </form>
            </div>
            <div className="border-t border-ink/10 bg-paper p-5">
              <div className="flex gap-3">
                <Link href={pathname} onClick={() => setMobileFilterOpen(false)} className="flex-1 rounded-xl border border-ink/20 bg-white py-3 text-center text-sm font-semibold text-ink/70 hover:border-ink/40">
                  Temizle
                </Link>
                <button type="submit" form="drawer-filter-form" onClick={() => setMobileFilterOpen(false)} className="btn-selvi flex-[2] rounded-xl py-3 text-sm font-bold text-white shadow-sm">
                  Sonuçları Gör
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
