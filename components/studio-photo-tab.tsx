"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  Sparkles,
  Loader2,
  Check,
  Upload,
  AlertCircle,
  SlidersHorizontal,
  RotateCcw,
  Sun,
  Contrast,
} from "lucide-react";
import { StudioBeforeAfter } from "./studio-before-after";
import { enhancePhoto, applyEnhancedPhoto } from "@/app/actions/studio";

type MediaItem = {
  id: string;
  url: string;
  key: string;
  thumbUrl: string | null;
  cardUrl: string | null;
  kind: string;
  order: number;
};

type Props = {
  listingId: string;
  media: MediaItem[];
  imageCredits: number;
  onCreditsChange: (credits: number) => void;
};

type EnhanceState = {
  mediaId: string;
  originalUrl: string;
  outputUrl: string | null;
  jobId: string | null;
  applied: boolean;
};

export function StudioPhotoTab({
  listingId,
  media,
  imageCredits,
  onCreditsChange,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [enhanceState, setEnhanceState] = useState<EnhanceState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showEditor, setShowEditor] = useState(false);
  const [filters, setFilters] = useState({ brightness: 100, contrast: 100 });

  const photos = media.filter((m) => m.kind === "photo");
  const selectedMedia = photos.find((m) => m.id === selected);

  function handleEnhance() {
    if (!selectedMedia) return;
    setError(null);

    startTransition(async () => {
      const result = await enhancePhoto({
        listingId,
        mediaId: selectedMedia.id,
        mediaUrl: selectedMedia.url,
      });

      if (result.ok) {
        setEnhanceState({
          mediaId: selectedMedia.id,
          originalUrl: selectedMedia.cardUrl ?? selectedMedia.url,
          outputUrl: result.outputUrl,
          jobId: result.jobId,
          applied: false,
        });
        onCreditsChange(result.remainingCredits);
      } else {
        setError(result.error);
      }
    });
  }

  function handleApply() {
    if (!enhanceState?.jobId) return;
    setError(null);

    startTransition(async () => {
      const result = await applyEnhancedPhoto({
        jobId: enhanceState.jobId!,
        listingId,
        originalMediaId: enhanceState.mediaId,
      });

      if (result.ok) {
        setEnhanceState((prev) => (prev ? { ...prev, applied: true } : null));
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Fotoğraf grid */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink/70">
          Fotoğraf seçin — AI ile iyileştirin
        </h3>
        {photos.length === 0 ? (
          <div className="dash-empty">
            Bu ilana henüz fotoğraf eklenmemiş. Önce portföyden fotoğraf yükleyin.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setSelected(m.id);
                  setEnhanceState(null);
                  setShowEditor(false);
                  setFilters({ brightness: 100, contrast: 100 });
                }}
                className={`studio-photo-tile group relative aspect-[4/3] overflow-hidden rounded-xl transition-all ${
                  selected === m.id
                    ? "ring-2 ring-brand-600 ring-offset-2 ring-offset-[var(--app-bg)]"
                    : "ring-1 ring-[var(--app-border)] hover:ring-brand-500/40"
                }`}
              >
                <Image
                  src={m.thumbUrl ?? m.url}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                {selected === m.id && (
                  <div className="absolute inset-0 bg-brand-600/10" />
                )}
                {m.order === 0 && (
                  <span className="absolute top-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    Kapak
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Seçili fotoğraf aksiyonları */}
      {selectedMedia && !enhanceState && (
        <div className="dash-card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-24 overflow-hidden rounded-lg">
                <Image
                  src={selectedMedia.cardUrl ?? selectedMedia.url}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold">Seçili fotoğraf</p>
                <p className="text-xs text-ink/45">
                  {imageCredits > 0
                    ? `${imageCredits} iyileştirme hakkınız var`
                    : "Krediniz kalmadı"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowEditor(!showEditor)}
                className="dash-btn-secondary"
              >
                <SlidersHorizontal size={14} />
                Manuel Düzenle
              </button>
              <button
                onClick={handleEnhance}
                disabled={pending || imageCredits < 1}
                className="dash-btn-primary"
              >
                {pending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    İyileştiriliyor…
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    AI ile İyileştir
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Manuel düzenleme */}
          {showEditor && (
            <div className="mt-5 space-y-4 border-t border-[var(--app-border)] pt-5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Manuel Düzenleme</h4>
                <button
                  onClick={() => setFilters({ brightness: 100, contrast: 100 })}
                  className="flex items-center gap-1 text-xs font-medium text-ink/45 hover:text-ink/70"
                >
                  <RotateCcw size={12} />
                  Sıfırla
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-ink/60">
                    <Sun size={13} />
                    Parlaklık: {filters.brightness}%
                  </span>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={filters.brightness}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        brightness: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-brand-600"
                  />
                </label>
                <label className="space-y-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-ink/60">
                    <Contrast size={13} />
                    Kontrast: {filters.contrast}%
                  </span>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={filters.contrast}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        contrast: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-brand-600"
                  />
                </label>
              </div>
              <div className="overflow-hidden rounded-xl">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={selectedMedia.cardUrl ?? selectedMedia.url}
                    alt=""
                    fill
                    className="object-cover"
                    style={{
                      filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%)`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Before/After sonucu */}
      {enhanceState && (
        <div className="dash-card space-y-5 p-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Sparkles size={15} className="text-brand-600" />
              AI İyileştirme Sonucu
            </h3>
            {enhanceState.applied && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <Check size={12} />
                İlana uygulandı
              </span>
            )}
          </div>

          <StudioBeforeAfter
            beforeUrl={enhanceState.originalUrl}
            afterUrl={enhanceState.outputUrl!}
          />

          {!enhanceState.applied && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleApply}
                disabled={pending}
                className="dash-btn-primary"
              >
                {pending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Uygulanıyor…
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    İlana Yükle ve Eskisini Kaldır
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setEnhanceState(null);
                  setSelected(null);
                }}
                className="dash-btn-secondary"
              >
                Vazgeç
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hata */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  );
}
