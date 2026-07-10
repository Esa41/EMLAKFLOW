"use client";

import { useState } from "react";
import { ShowcaseCard, type ShowcaseCardListing } from "@/components/showcase-card";
import { GhostTag, Reveal } from "@/components/showcase-fx";

type Tab = "featured" | "new";

type Props = {
  slug: string;
  featured: ShowcaseCardListing[];
  newest: ShowcaseCardListing[];
  isAuto?: boolean;
};

export function ShowcaseCollections({ slug, featured, newest, isAuto = false }: Props) {
  const hasFeatured = featured.length > 0;
  const hasNew = newest.length > 0;
  const [tab, setTab] = useState<Tab>(hasFeatured ? "featured" : "new");
  if (!hasFeatured && !hasNew) return null;

  const panels: {
    id: Tab;
    title: string;
    subtitle: string;
    shelf: string;
    items: ShowcaseCardListing[];
    showNew?: boolean;
  }[] = [];

  if (hasFeatured) {
    panels.push({
      id: "featured",
      title: "Öne Çıkanlar",
      subtitle: `Danışmanlarımızın öne aldığı ${featured.length} ${isAuto ? "araç" : "mülk"}.`,
      shelf: "RAF 01",
      items: featured,
    });
  }
  if (hasNew) {
    panels.push({
      id: "new",
      title: "Yeni Eklenenler",
      subtitle: `Son 14 günde portföye giren ${isAuto ? "araçlar" : "mülkler"}.`,
      shelf: panels.length > 0 ? "RAF 02" : "RAF 01",
      items: newest,
      showNew: true,
    });
  }

  const active = panels.find((p) => p.id === tab) ?? panels[0];

  return (
    <section id="koleksiyon" className="relative scroll-mt-20">
      <GhostTag text={active.shelf} speed={0.08} />
      <Reveal>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-[22px] font-extrabold tracking-tight">
              {active.title}
            </h2>
            <p className="mt-1 text-[12.5px] text-ink/50">{active.subtitle}</p>
          </div>
          {panels.length > 1 && (
            <div className="inline-flex rounded-full border border-ink/15 bg-white p-[3px] shadow-[0_1px_2px_rgba(23,32,28,0.04)]">
              {panels.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTab(p.id)}
                  className={`rounded-full px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] transition-all ${
                    tab === p.id ? "bg-ink text-white shadow-sm" : "text-ink/50 hover:text-ink"
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      <div
        key={active.id}
        className="-mx-4 flex gap-4 overflow-x-auto scroll-smooth px-4 pb-2 [scroll-snap-type:x_mandatory] duration-300 animate-in fade-in slide-in-from-top-1 sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ink/15"
      >
        {active.items.map((l) => (
          <ShowcaseCard
            key={l.id}
            slug={slug}
            listing={l}
            isAuto={isAuto}
            compact
            showNewBadge={active.showNew}
          />
        ))}
      </div>
    </section>
  );
}
