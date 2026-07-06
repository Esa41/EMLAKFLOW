"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { SiteAuthModal } from "./site-auth";

/**
 * Kalp (favori) butonu — ilan kartlarında ve detay sayfasında.
 * Giriş yoksa üyelik modalını açar; girişliyse optimistic toggle yapar.
 */
export function FavoriteButton({
  slug,
  listingId,
  initialFavorited,
  loggedIn,
  variant = "overlay",
}: {
  slug: string;
  listingId: string;
  initialFavorited: boolean;
  loggedIn: boolean;
  variant?: "overlay" | "inline";
}) {
  const [fav, setFav] = useState(initialFavorited);
  const [authOpen, setAuthOpen] = useState(false);

  async function toggle(e: React.MouseEvent) {
    // Kart Link'inin navigasyonunu engelle
    e.preventDefault();
    e.stopPropagation();
    if (!loggedIn) {
      setAuthOpen(true);
      return;
    }
    const prev = fav;
    setFav(!prev);
    const res = await fetch(`/api/ofis/${slug}/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    if (!res.ok) setFav(prev);
  }

  const heart = (
    <Heart
      size={variant === "overlay" ? 16 : 17}
      className={fav ? "fill-rose-500 text-rose-500" : ""}
    />
  );

  return (
    <>
      {variant === "overlay" ? (
        <button
          onClick={toggle}
          aria-label={fav ? "Favorilerden çıkar" : "Favorilere ekle"}
          className={`absolute left-3 top-3 z-10 rounded-full border bg-white/95 p-2 shadow-sm transition-colors ${
            fav
              ? "border-rose-300 text-rose-500"
              : "border-ink/15 text-ink/45 hover:text-rose-500"
          }`}
        >
          {heart}
        </button>
      ) : (
        <button
          onClick={toggle}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition-colors ${
            fav
              ? "border-rose-300 bg-rose-50 text-rose-600"
              : "border-ink/20 bg-white text-ink hover:border-rose-300 hover:text-rose-500"
          }`}
        >
          {heart}
          {fav ? "Favorilerimde" : "Favorilere ekle"}
        </button>
      )}
      <SiteAuthModal
        slug={slug}
        open={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </>
  );
}
