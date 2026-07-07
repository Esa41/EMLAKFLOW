"use client";

import { trMoney } from "@/lib/labels";
import type { DealCard } from "./kanban-board";

function daysInStage(iso: string | null | undefined): number {
  if (!iso) return 0;
  return Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function DealListView({
  deals,
  stageLabels,
  onSelect,
}: {
  deals: DealCard[];
  stageLabels: Record<string, string>;
  onSelect: (deal: DealCard) => void;
}) {
  if (deals.length === 0) {
    return (
      <div className="dash-empty py-12">Bu filtrede fırsat yok.</div>
    );
  }

  return (
    <div className="dash-surface overflow-hidden">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-ink/[0.06] bg-ink/[0.02] text-left text-[11px] font-semibold text-ink/40">
            <th className="px-4 py-3">Müşteri</th>
            <th className="hidden px-4 py-3 sm:table-cell">Aşama</th>
            <th className="hidden px-4 py-3 md:table-cell">İlan</th>
            <th className="px-4 py-3 text-right">Bedel</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((d) => {
            const days = daysInStage(d.stageChangedAt);
            const stale = days >= 7 && !["CLOSED_WON", "CLOSED_LOST"].includes(d.stage);
            return (
              <tr
                key={d.id}
                onClick={() => onSelect(d)}
                className={`cursor-pointer border-b border-ink/[0.04] transition-colors hover:bg-brand-50/30 ${
                  stale ? "bg-amber-500/5" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <p className="font-semibold">
                    {d.contact?.fullName ?? "İsimsiz"}
                  </p>
                  {stale && (
                    <span className="mt-0.5 inline-block rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      {days} gündür bu aşamada
                    </span>
                  )}
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  {stageLabels[d.stage] ?? d.stage}
                </td>
                <td className="hidden max-w-[200px] truncate px-4 py-3 md:table-cell">
                  {d.listing?.refCode ?? "—"}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-brand-700">
                  {d.value != null ? trMoney.format(d.value) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
