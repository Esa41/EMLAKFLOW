import { ShowcaseCard, type ShowcaseCardListing } from "@/components/showcase-card";

type Props = {
  slug: string;
  title: string;
  subtitle: string;
  shelf: string;
  listings: ShowcaseCardListing[];
  isAuto?: boolean;
  showNewBadges?: boolean;
};

export function ShowcaseRail({
  slug,
  title,
  subtitle,
  shelf,
  listings,
  isAuto = false,
  showNewBadges = false,
}: Props) {
  if (listings.length === 0) return null;

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[22px] font-extrabold tracking-tight">
            {title}
          </h2>
          <p className="mt-1 text-[12.5px] text-ink/50">{subtitle}</p>
        </div>
        <div className="bolum w-[120px] shrink-0">{shelf}</div>
      </div>
      <div className="-mx-4 flex gap-4 overflow-x-auto scroll-smooth px-4 pb-2 [scroll-snap-type:x_mandatory] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ink/15">
        {listings.map((l) => (
          <ShowcaseCard
            key={l.id}
            slug={slug}
            listing={l}
            isAuto={isAuto}
            compact
            showNewBadge={showNewBadges}
          />
        ))}
      </div>
    </section>
  );
}
