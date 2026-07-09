"use client";

import Link from "next/link";
import { getVertical, type VerticalConfig } from "@/lib/verticals";

/** Dikeye göre marka logosu — whiteLabelName varsa ofis markası gösterilir. */
export function BrandLogo({
  vertical,
  className = "",
  whiteLabelName,
}: {
  vertical?: string | null;
  className?: string;
  /** Premium white-label: EmlakFlow yerine ofis / marka adı */
  whiteLabelName?: string | null;
}) {
  if (whiteLabelName?.trim()) {
    return (
      <p
        className={`truncate font-display font-extrabold tracking-tight ${className}`}
      >
        {whiteLabelName.trim()}
      </p>
    );
  }
  const v = getVertical(vertical);
  return (
    <p className={`font-display font-extrabold tracking-tight ${className}`}>
      {v.brandHead}
      <span className="text-brand-600">{v.brandTail}</span>
    </p>
  );
}

export function BrandMark({
  vertical,
  size = "md",
  whiteLabelName,
}: {
  vertical?: string | null;
  size?: "sm" | "md";
  whiteLabelName?: string | null;
}) {
  const v = getVertical(vertical);
  const letter = (whiteLabelName?.trim() || v.brandHead).charAt(0).toUpperCase();
  const cls = size === "sm" ? "h-9 w-9 text-sm" : "h-10 w-10 text-base";
  return (
    <div
      className={`btn-selvi flex items-center justify-center rounded-xl font-extrabold text-white ${cls}`}
    >
      {letter}
    </div>
  );
}

export function ProductCard({
  config,
  href,
}: {
  config: VerticalConfig;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-ink/15 bg-white p-6 shadow-sm transition-all hover:border-brand-500/40 hover:shadow-md"
    >
      <p className="font-display text-2xl font-extrabold tracking-tight">
        {config.brandHead}
        <span className="text-brand-600">{config.brandTail}</span>
      </p>
      <p className="mt-2 flex-1 text-sm text-ink/60">{config.tagline}</p>
      <span className="mt-4 text-sm font-semibold text-brand-600 group-hover:underline">
        Başla →
      </span>
    </Link>
  );
}
