import Link from "next/link";
import Image from "next/image";
import { Building2, Car } from "lucide-react";
import { trMoney } from "@/lib/labels";
import { listingCardMeta, rentPriceSuffix } from "@/lib/showcase-vertical";
import { FavoriteButton } from "@/components/favorite-button";

type Props = {
  slug: string;
  listing: {
    id: string;
    slug: string | null;
    title: string;
    purpose: string;
    price: unknown;
    type: string;
    rooms: string | null;
    netArea: number | null;
    grossArea: number | null;
    vehicleYear: number | null;
    vehicleKm: number | null;
    fuel: string | null;
    transmission: string | null;
    media: Array<{ url: string; cardUrl: string | null; alt: string | null }>;
  };
  isAuto: boolean;
  favorited: boolean;
  loggedIn: boolean;
};

export function ShowcaseListingCard({
  slug,
  listing: l,
  isAuto,
  favorited,
  loggedIn,
}: Props) {
  const EmptyIcon = isAuto ? Car : Building2;
  const href = `/ofis/${slug}/ilan/${l.slug ? `${l.id}-${l.slug}` : l.id}`;

  return (
    <Link
      href={href}
      data-imp={l.id}
      className="group overflow-hidden rounded-[10px] border border-ink/15 bg-white transition-colors hover:border-ink/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
    >
      <div className="relative">
        <FavoriteButton
          slug={slug}
          listingId={l.id}
          initialFavorited={favorited}
          loggedIn={loggedIn}
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
              <EmptyIcon size={30} />
            </div>
          )}
        </div>
        <span className="kunye absolute -bottom-3 left-3 max-w-[85%] truncate shadow-sm">
          {isAuto && l.vehicleYear ? `${l.vehicleYear} · ` : ""}
          {l.title}
        </span>
        <span className="absolute right-3 top-3 rounded-md border border-ink bg-paper px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider">
          {l.purpose === "SALE" ? "Satılık" : "Kiralık"}
        </span>
      </div>
      <div className="px-4 pb-4 pt-6">
        <h3 className="line-clamp-1 text-[15px] font-bold">{l.title}</h3>
        <p className="mt-1.5 font-display text-lg font-extrabold tracking-tight">
          {trMoney.format(Number(l.price))}
          {rentPriceSuffix(isAuto, l.purpose) && (
            <span className="text-sm font-medium text-ink/45">{rentPriceSuffix(isAuto, l.purpose)}</span>
          )}
        </p>
        <div className="olcu mt-2.5">
          <span className="olcu-cizgi" />
          <span>{listingCardMeta(l, isAuto)}</span>
          <span className="olcu-cizgi" />
        </div>
      </div>
    </Link>
  );
}
