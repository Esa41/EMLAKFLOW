import Image from "next/image";
import { Building2, Car } from "lucide-react";
import { AnimatedCounter } from "@/components/animated-counter";

type Stat = { value: string; label: string };

type Props = {
  displayName: string;
  district: string | null;
  eyebrow: string;
  headline: string;
  tagline: string;
  stats: Stat[];
  slug: string;
  photoUrl?: string | null;
  isAuto?: boolean;
  updatedLabel?: string | null;
};

export function ShowcaseHero({
  displayName,
  district,
  eyebrow,
  headline,
  tagline,
  stats,
  photoUrl,
  isAuto = false,
  updatedLabel,
}: Props) {
  const PlaceholderIcon = isAuto ? Car : Building2;
  const kunyeLabel = [
    displayName.split(" ")[0]?.toUpperCase(),
    "VİTRİN",
    district?.toUpperCase(),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="relative overflow-hidden border-b border-ink">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(23,32,28,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(23,32,28,0.07) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage: "radial-gradient(120% 90% at 70% 0%, #000 40%, transparent 78%)",
        }}
      />
      <div className="relative px-4 sm:px-6">
        <div className="mx-auto grid max-w-[1080px] grid-cols-1 items-center gap-7 py-10 md:grid-cols-[1.15fr_0.85fr] md:gap-10 md:py-14">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">
              {eyebrow}
            </p>
            <h1 className="mt-3.5 font-display text-[38px] font-extrabold leading-[1.02] tracking-tight text-balance sm:text-[52px]">
              {headline}
            </h1>
            <p className="mt-4 max-w-[34ch] text-[17px] leading-snug text-ink/70">
              {tagline}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#koleksiyon"
                className="btn-selvi inline-flex items-center rounded-[9px] px-4 py-2.5 text-sm font-bold text-white"
              >
                Portföyü Gör
              </a>
              <a
                href="#talep-form"
                className="inline-flex items-center rounded-[9px] border border-ink/15 bg-white px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:border-ink/40"
              >
                Talep Bırak
              </a>
            </div>
            {updatedLabel && (
              <div className="olcu mt-6 max-w-[320px]">
                <span className="olcu-cizgi" />
                <span>güncellendi · {updatedLabel}</span>
                <span className="olcu-cizgi" />
              </div>
            )}
          </div>
          <div className="relative max-md:order-first">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] border border-ink bg-brand-50 shadow-[0_12px_40px_-12px_rgba(23,32,28,0.22)]">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt={`${displayName} ofis`}
                  fill
                  priority
                  sizes="(min-width: 768px) 420px, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-brand-600/25">
                  <PlaceholderIcon size={72} strokeWidth={1.4} />
                </div>
              )}
              <span className="kunye pointer-events-none absolute bottom-3.5 left-3.5 z-10 text-[10px]">
                {kunyeLabel}
              </span>
            </div>
          </div>
        </div>
        {stats.length > 0 && (
          <div className="mx-auto grid max-w-[1080px] grid-cols-2 border-t border-ink/15 md:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`py-4 text-center ${
                  i > 0
                    ? "border-l border-ink/10 max-md:[&:nth-child(3)]:border-l-0"
                    : ""
                }`}
              >
                <p className="font-display text-[30px] font-extrabold tracking-tight">
                  <AnimatedCounter value={s.value} />
                </p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink/50">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
