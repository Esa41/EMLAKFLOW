"use client";

import { Check, Clapperboard, Flame, Home, Plane, Rocket, Sparkles } from "lucide-react";
import {
  TEMPLATE_LIST,
  suggestedTemplateFor,
  type TemplateKey,
} from "@/lib/studio-templates";

// Şablon kartı görsel kimlikleri — veri lib/studio-templates.ts'te,
// renk/ikon eşlemesi UI katmanında kalır.
const TEMPLATE_STYLES: Record<
  TemplateKey,
  {
    icon: typeof Home;
    gradient: string;
    borderActive: string;
    iconColor: string;
  }
> = {
  fpv_tour: {
    icon: Rocket,
    gradient: "from-cyan-500/10 to-teal-500/10",
    borderActive: "border-cyan-500",
    iconColor: "text-cyan-600",
  },
  cinematic_fpv: {
    icon: Flame,
    gradient: "from-rose-500/10 to-orange-500/10",
    borderActive: "border-rose-500",
    iconColor: "text-rose-600",
  },
  classic_interior: {
    icon: Home,
    gradient: "from-amber-500/10 to-orange-500/10",
    borderActive: "border-amber-500",
    iconColor: "text-amber-600",
  },
  land_drone: {
    icon: Plane,
    gradient: "from-sky-500/10 to-blue-500/10",
    borderActive: "border-sky-500",
    iconColor: "text-sky-600",
  },
  social_promo: {
    icon: Clapperboard,
    gradient: "from-violet-500/10 to-purple-500/10",
    borderActive: "border-violet-500",
    iconColor: "text-violet-600",
  },
};

type Props = {
  /** İlan tipi (APARTMENT | LAND | …) — önerilen şablon rozeti için */
  listingType: string | null;
  selected: TemplateKey | null;
  onSelect: (key: TemplateKey) => void;
};

export function TemplatePicker({ listingType, selected, onSelect }: Props) {
  const suggested = suggestedTemplateFor(listingType);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {TEMPLATE_LIST.map((t) => {
        const s = TEMPLATE_STYLES[t.key];
        const isSelected = selected === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onSelect(t.key)}
            className={`studio-concept-card group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition-all ${
              isSelected
                ? `${s.borderActive} shadow-lg`
                : "border-[var(--app-border)] hover:border-ink/20 hover:shadow-md"
            }`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 transition-opacity group-hover:opacity-100 ${
                isSelected ? "opacity-100" : ""
              }`}
            />
            <div className="relative">
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--app-input-bg)] ${s.iconColor} transition-colors`}
                >
                  <s.icon size={22} />
                </div>
                <div className="flex items-center gap-1.5">
                  {t.key === suggested && (
                    <span className="flex items-center gap-1 rounded-full bg-brand-600/10 px-2 py-0.5 text-[10px] font-bold text-brand-600">
                      <Sparkles size={10} />
                      Önerilen
                    </span>
                  )}
                  <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[10px] font-bold text-ink/50">
                    {t.aspectRatio === "9:16" ? "9:16 Dikey" : "16:9"}
                  </span>
                </div>
              </div>
              <h4 className="text-[15px] font-bold">
                {t.label}
                {t.badge && (
                  <span className="ml-2 rounded-md bg-brand-600 px-1.5 py-0.5 align-middle text-[9px] font-bold uppercase text-white">
                    {t.badge}
                  </span>
                )}
              </h4>
              <p className="mt-0.5 text-xs font-medium text-ink/50">{t.subtitle}</p>
              <p className="mt-2 text-xs leading-relaxed text-ink/45">
                {t.description}
              </p>
              {isSelected && (
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand-600">
                  <Check size={14} />
                  Seçildi
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
