import { ShowcaseCard, type ShowcaseCardListing } from "@/components/showcase-card";

type Props = {
  slug: string;
  featured: ShowcaseCardListing[];
  newest: ShowcaseCardListing[];
  isAuto?: boolean;
};

type Shelf = {
  id: string;
  title: string;
  subtitle: string;
  shelf: string;
  items: ShowcaseCardListing[];
  showNew?: boolean;
};

function Rail({
  slug,
  shelf,
  isAuto,
  first,
}: {
  slug: string;
  shelf: Shelf;
  isAuto: boolean;
  first: boolean;
}) {
  return (
    <section id={first ? "koleksiyon" : undefined} className={first ? "scroll-mt-20" : ""}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-[22px] font-extrabold tracking-tight">
            {shelf.title}
          </h2>
          <p className="mt-1 text-[12.5px] text-ink/50">{shelf.subtitle}</p>
        </div>
        <div className="bolum hidden w-[120px] sm:inline-flex">{shelf.shelf}</div>
      </div>

      <div className="-mx-4 flex gap-4 overflow-x-auto scroll-smooth px-4 pb-2 [scroll-snap-type:x_mandatory] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ink/15">
        {shelf.items.map((l) => (
          <ShowcaseCard
            key={l.id}
            slug={slug}
            listing={l}
            isAuto={isAuto}
            compact
            showNewBadge={shelf.showNew}
          />
        ))}
      </div>
    </section>
  );
}

export function ShowcaseCollections({ slug, featured, newest, isAuto = false }: Props) {
  const shelves: Shelf[] = [];

  if (featured.length > 0) {
    shelves.push({
      id: "featured",
      title: "Öne Çıkanlar",
      subtitle: `Danışmanlarımızın öne aldığı ${featured.length} ${isAuto ? "araç" : "mülk"}.`,
      shelf: "RAF 01",
      items: featured,
    });
  }
  if (newest.length > 0) {
    shelves.push({
      id: "new",
      title: "Yeni Eklenenler",
      subtitle: `Son 14 günde portföye giren ${isAuto ? "araçlar" : "mülkler"}.`,
      shelf: `RAF ${shelves.length > 0 ? "02" : "01"}`,
      items: newest,
      showNew: true,
    });
  }

  if (shelves.length === 0) return null;

  return (
    <div className="space-y-10">
      {shelves.map((shelf, i) => (
        <Rail key={shelf.id} slug={slug} shelf={shelf} isAuto={isAuto} first={i === 0} />
      ))}
    </div>
  );
}
