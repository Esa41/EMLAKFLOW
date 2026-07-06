"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Building2, ChevronLeft, ChevronRight, X, Play, Expand } from "lucide-react";

export type GalleryMedia = {
  id: string;
  url: string;
  thumbUrl?: string | null;
  cardUrl?: string | null;
  alt: string;
  kind: string;
};

/**
 * Vitrin galeri — tıklanabilir küçük görseller + tam ekran lightbox.
 * Sunucu bileşeni olan ilan detay sayfasından `media` (alt metni çözülmüş)
 * ve `title` prop'larıyla kullanılır.
 */
export function ListingGallery({
  media,
  title,
}: {
  media: GalleryMedia[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchRef = useRef<{ startX: number; lastX: number; startY: number; lastY: number; scale: number; baseScale: number; panning: boolean }>({
    startX: 0, lastX: 0, startY: 0, lastY: 0, scale: 1, baseScale: 1, panning: false
  });

  // Yalnız görsel medya — video (YouTube) ve tour360 (Matterport) embed URL'leri
  // next/image ile render edilemez, galeri dışında bırakılır.
  const photos = media.filter(
    (m) => m.kind !== "video" && m.kind !== "tour360",
  );
  const count = photos.length;
  const go = useCallback(
    (dir: number) => setActive((i) => (i + dir + count) % count),
    [count],
  );

  // Lightbox açıkken klavye ile gezinme + body scroll kilidi
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, go]);

  // Touch/swipe handling for lightbox
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchRef.current.startX = e.touches[0].clientX;
      touchRef.current.startY = e.touches[0].clientY;
      touchRef.current.lastX = e.touches[0].clientX;
      touchRef.current.lastY = e.touches[0].clientY;
      touchRef.current.panning = touchRef.current.scale > 1;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchRef.current.startX = dist; // reuse startX for distance
      touchRef.current.baseScale = touchRef.current.scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && !touchRef.current.panning) {
      // Normal swipe
      const dx = e.touches[0].clientX - touchRef.current.startX;
      // prevent default if swiping horizontally to avoid navigating back
      if (Math.abs(dx) > 10) e.preventDefault();
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = Math.min(Math.max(1, touchRef.current.baseScale * (dist / touchRef.current.startX)), 4);
      touchRef.current.scale = newScale;
      const el = e.currentTarget.querySelector('img');
      if (el) el.style.transform = `scale(${newScale})`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchRef.current.scale === 1 && !touchRef.current.panning) {
      const dx = e.changedTouches[0].clientX - touchRef.current.startX;
      if (Math.abs(dx) > 50) go(dx > 0 ? -1 : 1);
    }
    if (e.touches.length === 0 && touchRef.current.scale === 1) {
      const el = e.currentTarget.querySelector('img');
      if (el) el.style.transform = '';
    }
  };

  if (count === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[10px] border border-ink/15 bg-brand-50 text-ink/20 sm:h-96">
        <Building2 size={40} />
      </div>
    );
  }

  const current = photos[active];

  return (
    <div>
      {/* Ana görsel */}
      <div className="relative h-64 overflow-hidden rounded-[10px] border border-ink/15 bg-brand-50 sm:h-96">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="group absolute inset-0 h-full w-full cursor-zoom-in"
          aria-label="Fotoğrafı büyüt"
        >
          <Image
            src={current.cardUrl ?? current.url}
            alt={current.alt}
            fill
            priority
            sizes="(min-width: 1024px) 683px, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-ink/60 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <Expand size={12} /> Büyüt
          </span>
          {current.kind === "video" && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/85 text-ink shadow-lg">
                <Play size={22} className="ml-0.5" fill="currentColor" />
              </span>
            </span>
          )}
        </button>
        <span className="kunye absolute -bottom-3 left-4 max-w-[85%] truncate shadow-sm">
          {title}
        </span>
        {count > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-ink/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {active + 1} / {count}
          </span>
        )}
      </div>

      {/* Küçük görseller */}
      {count > 1 && (
        <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-8">
          {photos.map((m, i) => (
            <button
              type="button"
              key={m.id}
              onClick={() => setActive(i)}
              aria-label={`${i + 1}. fotoğrafı göster`}
              aria-current={i === active}
              className={`relative aspect-[4/3] w-full overflow-hidden rounded-md border transition ${
                i === active
                  ? "border-brand-600 ring-2 ring-brand-600/40"
                  : "border-ink/10 opacity-80 hover:opacity-100"
              }`}
            >
              <Image
                src={m.thumbUrl ?? m.url}
                alt={m.alt}
                fill
                loading="lazy"
                sizes="(min-width: 640px) 12vw, 20vw"
                className="object-cover"
              />
              {m.kind === "video" && (
                <span className="absolute inset-0 flex items-center justify-center bg-ink/20">
                  <Play size={14} className="text-white" fill="currentColor" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Fotoğraf galerisi"
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Kapat"
          >
            <X size={20} />
          </button>

          <div
            className="relative h-[80vh] w-full max-w-5xl touch-none"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={current.url}
              alt={current.alt}
              fill
              sizes="100vw"
              className="object-contain transition-transform duration-200"
              style={{ transformOrigin: "center center" }}
            />
          </div>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Önceki"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Sonraki"
              >
                <ChevronRight size={24} />
              </button>
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white">
                {active + 1} / {count}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
