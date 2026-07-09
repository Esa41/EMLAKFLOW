import Link from "next/link";
import Image from "next/image";
import { Building2, Car } from "lucide-react";
import { trMoney } from "@/lib/labels";
import { rentPriceSuffix } from "@/lib/showcase-vertical";
import { showcaseKunyePlate } from "@/lib/showcase-card";
import { FavoriteButton } from "@/components/favorite-button";

export type ShowcaseCardListing = {
  id: string;
  slug: string | null;
  title: string;
  purpose: string;
  price: number;
  rooms: string | null;
  netArea: number | null;
  grossArea: number | null;
  district: string;
  neighborhood: string | null;
  features?: string[];
  vehicleYear?: number | null;
  mediaCount?: number;
  image: string | null;
  imageAlt: string;
};

type Props = {
  slug: string;
  listing: ShowcaseCardListing;
  isAuto?: boolean;
  showFavorite?: boolean;
  showNewBadge?: boolean;
  compact?: boolean;
};

export function ShowcaseCard({
  slug,
  listing: l,
  isAuto = false,
  showFavorite = true,
  showNewBadge = false,
  compact = false,
}: Props) {
  const EmptyIcon = isAuto ? Car : Building2;
  const href = `/ofis/${slug}/ilan/${l.slug ? `${l.id}-${l.slug}` : l.id}`;
  const area = l.netArea ?? l.grossArea;
  const ppm =
    area && area > 0 && l.purpose === "SALE"
      ? `${trMoney.format(Math.round(l.price / area))}/m²`
      : "—";

  return (
    <Link
      href={href}
      data-imp={l.id}
      className={`group flex shrink-0 flex-col overflow-hidden rounded-xl border border-ink/15 bg-white transition-all hover:border-ink/40 hover:shadow-[0_8px_24px_-12px_rgba(23,32,28,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
        compact ? "w-[300px] scroll-snap-align-start" : ""
      }`}
    >
      <div className="relative">
        {showFavorite && <FavoriteButton slug={slug} listingId={l.id} />}
        <div className={`relative overflow-hidden bg-brand-50 ${compact ? "h-44" : "h-48"}`}>
          {l.image ? (
            <Image
              src={l.image}
              alt={l.imageAlt}
              fill
              loading="lazy"
              sizes={compact ? "300px" : "(min-width: 1024px) 33vw, 50vw"}
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-brand-600/25">
              <EmptyIcon size={compact ? 34 : 30} strokeWidth={1.4} />
            </div>
          )}
          {showNewBadge && (
            <span className="absolute left-3 top-3 rounded-[5px] bg-brand-700 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-white">
              Yeni
            </span>
          )}
          {l.purpose === "RENT" && (
            <span className="absolute right-3 top-3 rounded-md border border-ink bg-paper px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider">
              Kiralık
            </span>
          )}
        </div>
        <span className="kunye absolute -bottom-3.5 left-3 max-w-[85%] truncate shadow-sm">
          {showcaseKunyePlate({ ...l, isAuto })}
        </span>
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-6">
        <h3 className="line-clamp-1 text-[15px] font-bold">{l.title}</h3>
        <p className="mt-0.5 text-xs text-ink/50">
          {l.district}
          {l.neighborhood ? ` · ${l.neighborhood}` : ""}
        </p>
        <p className="mt-2 font-display text-[19px] font-extrabold tracking-tight">
          {trMoney.format(l.price)}
          {rentPriceSuffix(isAuto, l.purpose) && (
            <span className="text-sm font-medium text-ink/50">
              {rentPriceSuffix(isAuto, l.purpose)}
            </span>
          )}
        </p>
        <p className="text-[11px] text-ink/50">{ppm}</p>
        <div className="olcu mt-3">
          <span className="olcu-cizgi" />
          <span>
            {l.rooms ?? "—"} · net {l.netArea ?? l.grossArea ?? "—"} m²
          </span>
          <span className="olcu-cizgi" />
        </div>
      </div>
    </Link>
  );
}
