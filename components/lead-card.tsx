"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  LEAD_STATUS_BADGE,
  LEAD_STATUS_TR,
  leadCriteriaRows,
} from "@/lib/lead-display";

export type LeadRow = {
  id: string;
  purpose: string;
  type: string | null;
  status: string;
  source: string | null;
  city: string | null;
  district: string | null;
  rooms: string | null;
  minArea: number | null;
  maxArea: number | null;
  minPrice: string | null;
  maxPrice: string | null;
  needsCredit: boolean;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  minYear: number | null;
  maxKm: number | null;
  fuel: string | null;
  transmission: string | null;
  note: string | null;
  createdAt: string;
};

export function LeadCard({ lead, isAuto }: { lead: LeadRow; isAuto: boolean }) {
  const router = useRouter();
  const rows = leadCriteriaRows(lead, isAuto);
  const isVitrinNote = lead.note?.startsWith("[Vitrin");

  async function updateStatus(status: string) {
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function remove() {
    if (!confirm("Bu talebi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <article className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${LEAD_STATUS_BADGE[lead.status] ?? LEAD_STATUS_BADGE.OPEN}`}
            >
              {LEAD_STATUS_TR[lead.status] ?? lead.status}
            </span>
            <span className="font-mono text-[10px] text-ink/45">
              {new Date(lead.createdAt).toLocaleDateString("tr-TR")}
            </span>
          </div>
          {isVitrinNote && lead.note && (
            <p className="mt-2 text-sm text-ink/75">{lead.note}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <select
            value={lead.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="rounded-lg border border-ink/15 px-2 py-1 text-xs font-medium"
            aria-label="Talep durumu"
          >
            {Object.entries(LEAD_STATUS_TR).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={remove}
            className="rounded-lg p-1.5 text-ink/30 hover:bg-rose-50 hover:text-rose-600"
            aria-label="Talebi sil"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {rows.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {rows.map(({ label, value }) => (
            <div key={label}>
              <dt className="font-mono text-[9px] uppercase tracking-wider text-ink/45">{label}</dt>
              <dd className="text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {!isVitrinNote && lead.note && (
        <p className="mt-3 border-t border-ink/10 pt-2 text-xs text-ink/55">{lead.note}</p>
      )}
    </article>
  );
}
