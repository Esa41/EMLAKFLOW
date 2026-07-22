import Link from "next/link";
import Image from "next/image";
import { Building2, Car, Play } from "lucide-react";
import { trMoney } from "@/lib/labels";
import { rentPriceSuffix } from "@/lib/showcase-vertical";
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
  /** İlanın tamamlanmış stüdyo tanıtım videosu var — kartta rozet gösterilir */
  hasVideo?: boolean;
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

  const meta = [
    l.rooms,
    area ? `${area} m²` : null,
    l.purpose === "SALE" && ppm !== "—" ? ppm : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={href}
      data-imp={l.id}
      className={`group flex shrink-0 flex-col rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
        compact ? "w-[300px] [scroll-snap-align:start]" : ""
      }`}
    >
      <div className={`relative overflow-hidden rounded-2xl bg-brand-50/60 ${compact ? "h-52" : "aspect-[4/3.3]"}`}>
        {l.image ? (
          <Image
            src={l.image}
            alt={l.imageAlt}
            fill
            loading="lazy"
            sizes={compact ? "300px" : "(min-width: 1024px) 33vw, 50vw"}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-600/25">
            <EmptyIcon size={compact ? 34 : 30} strokeWidth={1.4} />
          </div>
        )}
        {showFavorite && <FavoriteButton slug={slug} listingId={l.id} />}
        <div className="pointer-events-none absolute left-3 top-3 flex gap-1.5">
          {showNewBadge && (
            <span className="rounded-full bg-white/95 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-ink backdrop-blur">
              Yeni
            </span>
          )}
          {l.purpose === "RENT" && (
            <span className="rounded-full bg-white/95 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-ink backdrop-blur">
              Kiralık
            </span>
          )}
        </div>
        {l.hasVideo && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-ink/70 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            <Play size={10} className="fill-current" />
            Video
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-0.5 pt-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-[15px] font-semibold tracking-tight">{l.title}</h3>
          <p className="shrink-0 font-display text-[16px] font-extrabold tracking-tight">
            {trMoney.format(l.price)}
            {rentPriceSuffix(isAuto, l.purpose) && (
              <span className="text-[12px] font-medium text-ink/50">
                {rentPriceSuffix(isAuto, l.purpose)}
              </span>
            )}
          </p>
        </div>
        <p className="mt-0.5 line-clamp-1 text-[13.5px] text-ink/55">
          {l.district}
          {l.neighborhood ? ` · ${l.neighborhood}` : ""}
        </p>
        {meta && <p className="mt-1.5 font-mono text-[11px] text-ink/45">{meta}</p>}
      </div>
    </Link>
  );
}
