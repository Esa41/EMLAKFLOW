"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Type } from "lucide-react";
import type { ResolvedOverlay } from "@/lib/studio-templates";

// Ekran yazısı stil rozetleri — kullanıcıya kartın nerede/nasıl görüneceğini anlatır
const STYLE_HINTS: Record<string, string> = {
  bannerBottom: "Alt bant",
  bigCenter: "Büyük merkez",
  cardTopLeft: "Sol üst kart",
  hook: "Dikkat çekici",
  cta: "Kapanış çağrısı",
};

const PLACEMENT_HINTS = {
  first: "İlk sahne",
  last: "Son sahne",
  all: "Tüm sahneler",
} as const;

function placementHint(placement: ResolvedOverlay["placement"]): string {
  if (typeof placement === "number") return `Sahne ${placement + 1}`;
  return PLACEMENT_HINTS[placement];
}

type Props = {
  overlays: ResolvedOverlay[];
  disabled: boolean;
  saving: boolean;
  onSave: (overlays: { key: string; text: string; enabled: boolean }[]) => void;
};

export function OverlayEditor({ overlays, disabled, saving, onSave }: Props) {
  const [draft, setDraft] = useState(overlays);
  const [dirty, setDirty] = useState(false);

  // Proje değişince (yeni video / polling güncellemesi) taslağı senkronla —
  // kullanıcı düzenleme yapmadıysa
  useEffect(() => {
    if (!dirty) setDraft(overlays);
  }, [overlays, dirty]);

  function update(key: string, patch: Partial<Pick<ResolvedOverlay, "text" | "enabled">>) {
    setDirty(true);
    setDraft((prev) =>
      prev.map((o) => (o.key === key ? { ...o, ...patch } : o)),
    );
  }

  if (!draft.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-sm font-bold">
          <Type size={14} className="text-brand-600" />
          Ekran Yazıları
        </h4>
        {dirty && (
          <button
            onClick={() => {
              onSave(draft.map((o) => ({ key: o.key, text: o.text, enabled: o.enabled })));
              setDirty(false);
            }}
            disabled={disabled || saving}
            className="dash-btn-secondary px-3 py-1 text-xs"
          >
            {saving ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Check size={12} />
            )}
            Kaydet
          </button>
        )}
      </div>
      <p className="text-xs text-ink/45">
        Videonun üzerine bindirilen bilgi kartları — metinleri düzenleyin,
        istemediklerinizi kapatın.
      </p>
      <div className="space-y-2">
        {draft.map((o) => (
          <div
            key={o.key}
            className={`flex flex-wrap items-center gap-2 rounded-xl bg-[var(--app-input-bg)] px-3 py-2 ${
              o.enabled ? "" : "opacity-55"
            }`}
          >
            <label className="flex shrink-0 cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={o.enabled}
                onChange={(e) => update(o.key, { enabled: e.target.checked })}
                disabled={disabled}
                className="h-3.5 w-3.5 accent-[var(--brand-fill,#4f46e5)]"
              />
              <span className="w-24 text-xs font-semibold text-ink/60">{o.label}</span>
            </label>
            <input
              type="text"
              value={o.text}
              onChange={(e) => update(o.key, { text: e.target.value })}
              disabled={disabled || !o.enabled}
              maxLength={80}
              placeholder="Metin girin…"
              className="dash-input min-w-[160px] flex-1 py-1.5 text-sm"
            />
            <span className="shrink-0 rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-ink/45">
              {STYLE_HINTS[o.styleKey] ?? o.styleKey}
            </span>
            <span className="shrink-0 rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-ink/45">
              {placementHint(o.placement)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
