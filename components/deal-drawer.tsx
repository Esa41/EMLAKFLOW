"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  X,
  Phone,
  MessageCircle,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { trMoney } from "@/lib/labels";
import type { DealCard } from "./kanban-board";
import { ConversationPanel, type PanelEntry } from "./conversation-panel";

const LOST_REASONS = [
  { value: "price", label: "Fiyat uyuşmadı" },
  { value: "changed_mind", label: "Vazgeçti" },
  { value: "competitor", label: "Rakip ofis/galeri" },
  { value: "no_contact", label: "Ulaşılamadı" },
  { value: "other", label: "Diğer" },
];

export function DealDrawer({
  deal,
  stageLabels,
  listingLabel,
  open,
  onClose,
  onStageChange,
  onDelete,
  activities,
  onAddNote,
}: {
  deal: DealCard | null;
  stageLabels: Record<string, string>;
  listingLabel: string;
  open: boolean;
  onClose: () => void;
  onStageChange: (
    dealId: string,
    stage: string,
    lostReason?: string,
  ) => Promise<void>;
  onDelete: (dealId: string) => Promise<void>;
  activities: Array<{
    id: string;
    body: string;
    createdAt: string;
    type?: string;
    author?: string | null;
  }>;
  onAddNote?: (
    dealId: string,
    type: string,
    body: string,
  ) => Promise<{ ok: boolean; error?: string }>;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !deal) return null;

  const stages = [
    "NEW",
    "CONTACTED",
    "VIEWING",
    "OFFER",
    "CONTRACT",
    "CLOSED_WON",
    "CLOSED_LOST",
  ];

  async function handleLost(reason: string) {
    await onStageChange(deal!.id, "CLOSED_LOST", reason);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-ink/10 px-5 py-4">
          <div>
            <p className="font-display text-lg font-extrabold">
              {deal.contact?.fullName ?? "İsimsiz fırsat"}
            </p>
            <p className="text-xs text-ink/50">
              {stageLabels[deal.stage] ?? deal.stage}
              {deal.agent ? ` · ${deal.agent.name}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ink/45 hover:bg-ink/[0.04]"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex gap-2">
            {deal.contact?.phone && (
              <>
                <a
                  href={`tel:${deal.contact.phone}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-50 py-2.5 text-sm font-semibold text-brand-700"
                >
                  <Phone size={16} /> Ara
                </a>
                <a
                  href={`https://wa.me/${deal.contact.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700"
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
              </>
            )}
          </div>

          {deal.listing && (
            <div className="rounded-xl border border-ink/10 p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-ink/40">
                {listingLabel}
              </p>
              <Link
                href={`/portfoy/${deal.listing.id}`}
                className="mt-1 flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
              >
                {deal.listing.refCode} — {deal.listing.title}
                <ChevronRight size={14} />
              </Link>
            </div>
          )}

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/45">
              Beklenen bedel
            </p>
            <p className="font-display text-2xl font-extrabold text-brand-700">
              {deal.value != null ? trMoney.format(deal.value) : "—"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/45">
              Aşama
            </p>
            <div className="flex flex-wrap gap-1.5">
              {stages
                .filter((s) => !["CLOSED_WON", "CLOSED_LOST"].includes(s))
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => onStageChange(deal.id, s)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      deal.stage === s
                        ? "bg-brand-600 text-white"
                        : "bg-ink/[0.05] text-ink/65 hover:bg-brand-50 hover:text-brand-700"
                    }`}
                  >
                    {stageLabels[s]}
                  </button>
                ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                onClick={() => onStageChange(deal.id, "CLOSED_WON")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  deal.stage === "CLOSED_WON"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                }`}
              >
                {stageLabels.CLOSED_WON}
              </button>
            </div>
            {deal.stage !== "CLOSED_LOST" && (
              <div className="mt-3 space-y-1">
                <p className="text-[11px] font-medium text-ink/45">
                  Kaybedildi — neden?
                </p>
                <div className="flex flex-wrap gap-1">
                  {LOST_REASONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => handleLost(r.label)}
                      className="rounded-md border border-ink/15 px-2 py-1 text-[11px] font-medium text-ink/55 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {deal.lostReason && (
              <p className="mt-2 text-xs text-rose-600">
                Kayıp nedeni: {deal.lostReason}
              </p>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/45">
              Notlar & Aktivite
            </p>
            <ConversationPanel
              variant="notes"
              entries={activities as PanelEntry[]}
              showTypePicker={!!onAddNote}
              placeholder="Not ekle — arama, görüşme, WhatsApp…"
              emptyText="Henüz not yok. İlk görüşme/aramayı buraya kaydedin."
              heightClass="h-56"
              onSend={async (body, type) => {
                if (!onAddNote) return { ok: false, error: "Not eklenemiyor." };
                return onAddNote(deal!.id, type, body);
              }}
            />
          </div>
        </div>

        <div className="border-t border-ink/10 p-4">
          <button
            onClick={() => onDelete(deal.id)}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            <Trash2 size={16} /> Fırsatı sil
          </button>
        </div>
      </aside>
    </div>
  );
}

export { LOST_REASONS };
