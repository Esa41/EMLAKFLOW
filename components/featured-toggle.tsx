"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

export function FeaturedToggle({
  listingId,
  featured,
  disabled,
}: {
  listingId: string;
  featured: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [on, setOn] = useState(featured);
  const [pending, startTransition] = useTransition();

  async function toggle() {
    if (disabled || pending) return;
    const next = !on;
    setOn(next);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: next }),
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      setOn(!next);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled || pending}
      title={on ? "Öne çıkandan kaldır" : "Vitrinde öne çıkar"}
      className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 disabled:opacity-50 ${
        on
          ? "border-amber-300/60 bg-amber-50 text-amber-800 hover:bg-amber-100"
          : "border-ink/15 bg-white text-ink/70 hover:border-ink/30 hover:text-ink"
      }`}
    >
      <Star size={16} className={on ? "fill-amber-500 text-amber-500" : ""} />
      {on ? "Öne çıkan" : "Öne çıkar"}
    </button>
  );
}
