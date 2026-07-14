"use client";

import { Music, VolumeX } from "lucide-react";
import type { StudioMusicOption } from "@/app/actions/studio-video";

type Props = {
  options: StudioMusicOption[];
  /** Projedeki seçim — null ise şablon varsayılanı geçerli */
  value: string | null;
  /** Şablonun varsayılan müziği (value=null iken işaretli gösterilir) */
  templateDefault: string;
  disabled: boolean;
  onChange: (musicKey: string) => void;
};

export function MusicPicker({
  options,
  value,
  templateDefault,
  disabled,
  onChange,
}: Props) {
  const effective = value ?? templateDefault;

  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-1.5 text-sm font-bold">
        <Music size={14} className="text-brand-600" />
        Arka Plan Müziği
      </h4>
      <div className="space-y-1.5">
        {options.map((o) => (
          <label
            key={o.key}
            className={`flex cursor-pointer flex-wrap items-center gap-2.5 rounded-xl px-3 py-2 transition-colors ${
              effective === o.key
                ? "bg-brand-600/10 ring-1 ring-brand-600/40"
                : "bg-[var(--app-input-bg)] hover:bg-ink/[0.06]"
            }`}
          >
            <input
              type="radio"
              name="studio-music"
              checked={effective === o.key}
              onChange={() => onChange(o.key)}
              disabled={disabled}
              className="h-3.5 w-3.5 accent-[var(--brand-fill,#4f46e5)]"
            />
            <div className="min-w-[120px] flex-1">
              <p className="text-xs font-bold">
                {o.label}
                {o.key === templateDefault && (
                  <span className="ml-1.5 text-[10px] font-semibold text-ink/40">
                    (şablon varsayılanı)
                  </span>
                )}
              </p>
              <p className="text-[11px] text-ink/45">{o.mood}</p>
            </div>
            <audio
              src={o.url}
              controls
              preload="none"
              className="h-8 w-full max-w-[220px]"
            />
          </label>
        ))}
        <label
          className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 transition-colors ${
            effective === "none"
              ? "bg-brand-600/10 ring-1 ring-brand-600/40"
              : "bg-[var(--app-input-bg)] hover:bg-ink/[0.06]"
          }`}
        >
          <input
            type="radio"
            name="studio-music"
            checked={effective === "none"}
            onChange={() => onChange("none")}
            disabled={disabled}
            className="h-3.5 w-3.5 accent-[var(--brand-fill,#4f46e5)]"
          />
          <VolumeX size={14} className="text-ink/40" />
          <span className="text-xs font-bold">Müzik yok</span>
        </label>
      </div>
    </div>
  );
}
