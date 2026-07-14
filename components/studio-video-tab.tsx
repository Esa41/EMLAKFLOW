"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  Plane,
  Home,
  Clapperboard,
  Check,
  Loader2,
  AlertCircle,
  GripVertical,
  Film,
  Clock,
} from "lucide-react";
import { requestVideoGeneration } from "@/app/actions/studio";
import type { StudioJobItem } from "@/app/actions/studio";

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
  videoCredits: number;
  onCreditsChange: (credits: number) => void;
  history: StudioJobItem[];
};

const CONCEPTS = [
  {
    key: "drone",
    title: "Arsa / Tarla",
    subtitle: "Drone uçuşu",
    description: "Arsanızın veya tarlanızın kuş bakışı sinematik drone çekimi.",
    icon: Plane,
    gradient: "from-sky-500/10 to-blue-500/10",
    borderActive: "border-sky-500",
    iconColor: "text-sky-600",
  },
  {
    key: "interior",
    title: "Ev İçi Tur",
    subtitle: "Odalar arası geçiş",
    description: "Evin odaları arasında akıcı geçişlerle sanal tur videosu.",
    icon: Home,
    gradient: "from-amber-500/10 to-orange-500/10",
    borderActive: "border-amber-500",
    iconColor: "text-amber-600",
  },
  {
    key: "social",
    title: "Reklam / Sosyal Medya",
    subtitle: "Instagram / TikTok",
    description: "Dikkat çekici kısa format sosyal medya reklam videosu.",
    icon: Clapperboard,
    gradient: "from-violet-500/10 to-purple-500/10",
    borderActive: "border-violet-500",
    iconColor: "text-violet-600",
  },
] as const;

export function StudioVideoTab({
  listingId,
  media,
  videoCredits,
  onCreditsChange,
  history,
}: Props) {
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [successJobId, setSuccessJobId] = useState<string | null>(null);

  const photos = media.filter((m) => m.kind === "photo");
  const concept = CONCEPTS.find((c) => c.key === selectedConcept);

  function togglePhoto(id: string) {
    setSelectedPhotos((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function movePhoto(id: string, direction: -1 | 1) {
    setSelectedPhotos((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  }

  function handleGenerate() {
    if (!selectedConcept) return;
    setError(null);

    startTransition(async () => {
      const result = await requestVideoGeneration({
        listingId,
        conceptKey: selectedConcept,
        selectedMediaIds: selectedPhotos,
      });

      if (result.ok) {
        setSuccessJobId(result.jobId);
        onCreditsChange(result.remainingCredits);
        setSelectedConcept(null);
        setSelectedPhotos([]);
      } else {
        setError(result.error);
      }
    });
  }

  const videoJobs = history.filter((j) => j.type === "VIDEO_GENERATE");

  return (
    <div className="space-y-6">
      {/* Başarı mesajı */}
      {successJobId && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <Check size={18} className="mt-0.5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Video üretim talebi başarıyla oluşturuldu
            </p>
            <p className="mt-1 text-xs text-emerald-700/70">
              Video hazır olduğunda bildirim alacaksınız. Ortalama süre 3-5
              dakikadır.
            </p>
          </div>
        </div>
      )}

      {/* Konsept seçimi */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink/70">
          Video konsepti seçin
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {CONCEPTS.map((c) => (
            <button
              key={c.key}
              onClick={() => {
                setSelectedConcept(c.key);
                setSuccessJobId(null);
              }}
              className={`studio-concept-card group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition-all ${
                selectedConcept === c.key
                  ? `${c.borderActive} shadow-lg`
                  : "border-[var(--app-border)] hover:border-ink/20 hover:shadow-md"
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-0 transition-opacity group-hover:opacity-100 ${
                  selectedConcept === c.key ? "opacity-100" : ""
                }`}
              />
              <div className="relative">
                <div
                  className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--app-input-bg)] ${c.iconColor} transition-colors`}
                >
                  <c.icon size={22} />
                </div>
                <h4 className="text-[15px] font-bold">{c.title}</h4>
                <p className="mt-0.5 text-xs font-medium text-ink/50">
                  {c.subtitle}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ink/45">
                  {c.description}
                </p>
                {selectedConcept === c.key && (
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand-600">
                    <Check size={14} />
                    Seçildi
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Fotoğraf seçimi — konsept seçildikten sonra */}
      {concept && (
        <div className="dash-card p-5">
          <h3 className="mb-1 text-sm font-bold">
            Videoda kullanılacak fotoğrafları seçin
          </h3>
          <p className="mb-4 text-xs text-ink/45">
            Fotoğrafları seçin ve sıralamalarını belirleyin. Sıralama videonun
            akışını belirler.
          </p>

          {photos.length === 0 ? (
            <div className="dash-empty">
              Bu ilana henüz fotoğraf eklenmemiş.
            </div>
          ) : (
            <>
              {/* Fotoğraf grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {photos.map((m) => {
                  const isSelected = selectedPhotos.includes(m.id);
                  const orderIdx = selectedPhotos.indexOf(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => togglePhoto(m.id)}
                      className={`group relative aspect-[4/3] overflow-hidden rounded-xl transition-all ${
                        isSelected
                          ? "ring-2 ring-brand-600 ring-offset-2 ring-offset-[var(--app-bg)]"
                          : "ring-1 ring-[var(--app-border)] hover:ring-brand-500/40"
                      }`}
                    >
                      <Image
                        src={m.thumbUrl ?? m.url}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                        className="object-cover"
                      />
                      {isSelected && (
                        <>
                          <div className="absolute inset-0 bg-brand-600/15" />
                          <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white shadow-md">
                            {orderIdx + 1}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Sıralama */}
              {selectedPhotos.length > 0 && (
                <div className="mt-5 space-y-2">
                  <p className="text-xs font-semibold text-ink/50">
                    Sıralama ({selectedPhotos.length} fotoğraf)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPhotos.map((id, idx) => {
                      const m = photos.find((p) => p.id === id);
                      if (!m) return null;
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-2 rounded-xl bg-[var(--app-input-bg)] px-3 py-2"
                        >
                          <GripVertical
                            size={14}
                            className="text-ink/30"
                          />
                          <div className="relative h-8 w-12 overflow-hidden rounded-md">
                            <Image
                              src={m.thumbUrl ?? m.url}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="text-xs font-bold text-ink/60">
                            #{idx + 1}
                          </span>
                          <div className="flex gap-0.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                movePhoto(id, -1);
                              }}
                              disabled={idx === 0}
                              className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-ink/40 hover:bg-ink/10 disabled:opacity-30"
                            >
                              ◀
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                movePhoto(id, 1);
                              }}
                              disabled={idx === selectedPhotos.length - 1}
                              className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-ink/40 hover:bg-ink/10 disabled:opacity-30"
                            >
                              ▶
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Üret butonu */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={
                    pending ||
                    !selectedConcept ||
                    selectedPhotos.length === 0 ||
                    videoCredits < 1
                  }
                  className="dash-btn-primary"
                >
                  {pending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Gönderiliyor…
                    </>
                  ) : (
                    <>
                      <Film size={14} />
                      Videoyu Oluştur
                    </>
                  )}
                </button>
                <span className="text-xs text-ink/45">
                  {videoCredits > 0
                    ? `1 kredi düşülecek — kalan: ${videoCredits}`
                    : "Video krediniz kalmadı"}
                </span>
              </div>
            </>
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

      {/* Video Geçmişi */}
      {videoJobs.length > 0 && (
        <div className="dash-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold">
            <Clock size={15} className="text-ink/45" />
            Video Üretim Geçmişi
          </h3>
          <div className="space-y-2">
            {videoJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between rounded-xl bg-[var(--app-input-bg)] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Film size={16} className="text-ink/40" />
                  <div>
                    <p className="text-sm font-semibold">
                      {job.videoConceptKey === "drone"
                        ? "Drone Uçuşu"
                        : job.videoConceptKey === "interior"
                          ? "Ev İçi Tur"
                          : "Sosyal Medya"}{" "}
                      {job.listing && (
                        <span className="text-ink/45">
                          · {job.listing.refCode}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-ink/40">
                      {new Date(job.createdAt).toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                    job.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700"
                      : job.status === "PROCESSING"
                        ? "bg-blue-50 text-blue-700"
                        : job.status === "FAILED"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {job.status === "COMPLETED"
                    ? "Tamamlandı"
                    : job.status === "PROCESSING"
                      ? "İşleniyor"
                      : job.status === "FAILED"
                        ? "Başarısız"
                        : "Beklemede"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
