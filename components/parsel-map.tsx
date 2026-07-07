"use client";

import { useState } from "react";
import { trMoney } from "@/lib/labels";

export interface ParselDeal {
  id: string;
  name: string;
  listing: string;
  value: number;
  stage: string;
  stageLabel: string;
  color: string;
}

export function ParselMap({ deals }: { deals: ParselDeal[] }) {
  const [selected, setSelected] = useState<ParselDeal | null>(null);
  const total = deals.reduce((s, d) => s + d.value, 0);

  if (deals.length === 0) {
    return (
      <div className="dash-empty mt-5 py-8">
        Henüz açık fırsat yok — ilki Kanban'dan eklendiğinde harita burada belirir.
      </div>
    );
  }

  return (
    <div>
      <div className="mt-5">
        <p className="font-display text-4xl font-extrabold tracking-tighter">
          {compact(total)}
        </p>
        <p className="mt-1 text-xs text-ink/55">
          açık pipeline · dilim genişliği = fırsat bedeli
        </p>
      </div>

      <div className="mt-4 flex h-13 gap-[3px]" style={{ height: 52 }}>
        {deals.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setSelected(selected?.id === d.id ? null : d.id === selected?.id ? null : d)}
            style={{
              flexGrow: Math.max(d.value, total / 60),
              background: d.color,
              animationDelay: `${i * 70}ms`,
            }}
            className={`parsel-dilim min-w-[22px] rounded-[5px] transition-[outline] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink ${
              selected?.id === d.id ? "outline outline-2 outline-offset-2 outline-ink" : ""
            }`}
            aria-label={`${d.name}, ${d.stageLabel}, ${trMoney.format(d.value)}`}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-ink/60">
        {[
          ["#c7d6c2", "İletişimde"],
          ["#8fb392", "Yer gösterildi"],
          ["#4e8362", "Teklif"],
          ["#1e5b3e", "Sözleşme"],
        ].map(([c, l]) => (
          <span key={l} className="flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: c }} />
            {l}
          </span>
        ))}
      </div>

      {selected && (
        <div className="mt-4 rounded-lg border border-ink/[0.12] bg-[var(--app-surface)] px-4 py-3 dark:border-white/[0.1]">
          <p className="text-sm font-bold">{selected.name}</p>
          <p className="mt-0.5 font-mono text-xs text-ink/55">
            {selected.listing} · {selected.stageLabel}
          </p>
          <p className="mt-1.5 font-display text-lg font-extrabold">
            {trMoney.format(selected.value)}
          </p>
        </div>
      )}
    </div>
  );
}

function compact(n: number) {
  if (n >= 1_000_000)
    return `₺${(n / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}M`;
  if (n >= 1_000)
    return `₺${(n / 1_000).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}B`;
  return trMoney.format(n);
}
