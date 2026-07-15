"use client";

import {
  Clapperboard,
  Flame,
  Gem,
  Home,
  Plane,
  Play,
  Rocket,
  Smartphone,
  Sparkles,
  Sunset,
} from "lucide-react";
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
  fpv_reels: {
    icon: Smartphone,
    gradient: "from-fuchsia-500/10 to-pink-500/10",
    borderActive: "border-fuchsia-500",
    iconColor: "text-fuchsia-600",
  },
  luxury_showcase: {
    icon: Gem,
    gradient: "from-amber-500/10 to-yellow-500/10",
    borderActive: "border-amber-500",
    iconColor: "text-amber-600",
  },
  golden_hour: {
    icon: Sunset,
    gradient: "from-orange-500/10 to-amber-500/10",
    borderActive: "border-orange-500",
    iconColor: "text-orange-600",
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
  /** templateKey → imzalı örnek klip URL'si (yoksa "örnek yakında") */
  previews: Record<string, string>;
};

export function TemplatePicker({ listingType, selected, onSelect, previews }: Props) {
  const suggested = suggestedTemplateFor(listingType);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {TEMPLATE_LIST.map((t) => {
        const s = TEMPLATE_STYLES[t.key];
        const isSelected = selected === t.key;
        const previewUrl = previews[t.key];
        const portrait = t.aspectRatio === "9:16";
        return (
          // Kart içinde <video controls> olduğu için <button> değil <div>:
          // video kontrolleri iç içe interaktif eleman sorununu önler.
          <div
            key={t.key}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(t.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(t.key);
              }
            }}
            className={`studio-concept-card group relative cursor-pointer overflow-hidden rounded-2xl border-2 p-5 text-left transition-all ${
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

              {/* Örnek klip — seçilince oynar; kontroller kartı seçmesin */}
              {isSelected && previewUrl && (
                <div
                  className="mt-3 flex justify-center overflow-hidden rounded-xl bg-black"
                  onClick={(e) => e.stopPropagation()}
                >
                  <video
                    src={previewUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className={portrait ? "max-h-[340px] w-auto" : "aspect-video w-full object-cover"}
                  />
                </div>
              )}

              {isSelected && !previewUrl && (
                <div className="mt-3 rounded-lg bg-ink/[0.05] px-3 py-2 text-[11px] font-medium text-ink/45">
                  Örnek video yakında eklenecek.
                </div>
              )}

              {!isSelected && previewUrl && (
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-ink/45">
                  <Play size={11} className="fill-current" />
                  Örneği izlemek için seçin
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
