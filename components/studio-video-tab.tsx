"use client";

import { useEffect, useState, useTransition } from "react";
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
  RotateCcw,
  Mic,
  Download,
} from "lucide-react";
import {
  createStudioProject,
  getStudioProject,
  getLatestStudioProject,
  regenerateScene,
  mergeProject,
  type StudioProjectView,
} from "@/app/actions/studio-video";
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

const MAX_SCENES = 8;
const POLL_MS = 15_000;

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
    description: "Dikkat çekici dikey format sosyal medya reklam videosu.",
    icon: Clapperboard,
    gradient: "from-violet-500/10 to-purple-500/10",
    borderActive: "border-violet-500",
    iconColor: "text-violet-600",
  },
] as const;

const SCENE_STATUS_LABEL: Record<string, string> = {
  PENDING: "Sırada",
  PROCESSING: "İşleniyor",
  COMPLETED: "Hazır",
  FAILED: "Başarısız",
};

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
  const [project, setProject] = useState<StudioProjectView | null>(null);
  const [voiceDraft, setVoiceDraft] = useState("");
  const [busySceneId, setBusySceneId] = useState<string | null>(null);

  const photos = media.filter((m) => m.kind === "photo");
  const concept = CONCEPTS.find((c) => c.key === selectedConcept);

  // İlan değişince devam eden projeyi yükle
  useEffect(() => {
    let cancelled = false;
    setProject(null);
    getLatestStudioProject(listingId).then((p) => {
      if (!cancelled && p) {
        setProject(p);
        setVoiceDraft(p.voiceText ?? "");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  // Render/birleştirme sürerken durumu Fal ile mutabakatlı sorgula
  const needsPoll =
    !!project &&
    (project.merging || project.scenes.some((s) => s.status === "PROCESSING"));

  useEffect(() => {
    if (!needsPoll || !project) return;
    const timer = setInterval(async () => {
      const result = await getStudioProject(project.id);
      if (result.ok) setProject(result.project);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [needsPoll, project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function togglePhoto(id: string) {
    setSelectedPhotos((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= MAX_SCENES) return prev;
      return [...prev, id];
    });
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
      const result = await createStudioProject({
        listingId,
        conceptKey: selectedConcept,
        selectedMediaIds: selectedPhotos,
      });

      if (result.ok) {
        setProject(result.project);
        setVoiceDraft(result.project.voiceText ?? "");
        if (result.remainingCredits !== undefined) {
          onCreditsChange(result.remainingCredits);
        }
        setSelectedConcept(null);
        setSelectedPhotos([]);
      } else {
        setError(result.error);
      }
    });
  }

  function handleRegenerate(sceneId: string) {
    setError(null);
    setBusySceneId(sceneId);
    startTransition(async () => {
      const result = await regenerateScene(sceneId);
      setBusySceneId(null);
      if (result.ok) {
        setProject(result.project);
        onCreditsChange(videoCredits - 1);
      } else {
        setError(result.error);
      }
    });
  }

  function handleMerge() {
    if (!project) return;
    setError(null);
    startTransition(async () => {
      const result = await mergeProject({
        projectId: project.id,
        voiceText: voiceDraft,
      });
      if (result.ok) {
        setProject(result.project);
      } else {
        setError(result.error);
      }
    });
  }

  const allScenesDone =
    !!project &&
    project.scenes.length > 0 &&
    project.scenes.every((s) => s.status === "COMPLETED");
  const anyFailed = !!project && project.scenes.some((s) => s.status === "FAILED");
  const videoJobs = history.filter((j) => j.type === "VIDEO_GENERATE");

  return (
    <div className="space-y-6">
      {/* ── Aktif proje — sahne zaman çizelgesi ── */}
      {project && (
        <div className="dash-card space-y-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Film size={15} className="text-brand-600" />
              {project.title}
            </h3>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                project.status === "COMPLETED"
                  ? "bg-emerald-50 text-emerald-700"
                  : anyFailed
                    ? "bg-rose-50 text-rose-700"
                    : "bg-blue-50 text-blue-700"
              }`}
            >
              {project.status === "COMPLETED"
                ? "Video hazır"
                : project.merging
                  ? "Birleştiriliyor"
                  : anyFailed
                    ? "Sahne hatası"
                    : allScenesDone
                      ? "Sahneler hazır"
                      : "Render sürüyor"}
            </span>
          </div>

          {/* Sahne şeridi */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {project.scenes.map((s) => (
              <div
                key={s.id}
                className="overflow-hidden rounded-xl ring-1 ring-[var(--app-border)]"
              >
                <div className="relative aspect-video bg-ink/5">
                  {s.status === "COMPLETED" && s.outputUrl ? (
                    <video
                      src={s.outputUrl}
                      className="h-full w-full object-cover"
                      muted
                      loop
                      playsInline
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => e.currentTarget.pause()}
                    />
                  ) : (
                    <>
                      <Image
                        src={s.sourceThumbUrl ?? s.sourceImageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 640px) 25vw, 50vw"
                        className={`object-cover ${s.status === "PROCESSING" ? "opacity-50" : ""}`}
                      />
                      {s.status === "PROCESSING" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 size={20} className="animate-spin text-brand-600" />
                        </div>
                      )}
                    </>
                  )}
                  <span className="absolute top-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    Sahne {s.order + 1}
                  </span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-2">
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      s.status === "COMPLETED"
                        ? "text-emerald-600"
                        : s.status === "FAILED"
                          ? "text-rose-600"
                          : "text-blue-600"
                    }`}
                    title={s.errorMessage ?? undefined}
                  >
                    {SCENE_STATUS_LABEL[s.status] ?? s.status}
                  </span>
                  {(s.status === "FAILED" || s.status === "COMPLETED") &&
                    !project.merging &&
                    !project.finalVideoUrl && (
                      <button
                        onClick={() => handleRegenerate(s.id)}
                        disabled={pending || videoCredits < 1}
                        className="flex items-center gap-1 text-[10px] font-semibold text-ink/45 hover:text-brand-600 disabled:opacity-40"
                        title="1 kredi ile yeniden üret"
                      >
                        {busySceneId === s.id ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <RotateCcw size={11} />
                        )}
                        Yeniden
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>

          {/* Seslendirme + birleştirme */}
          {allScenesDone && !project.finalVideoUrl && !project.merging && (
            <div className="space-y-3 border-t border-[var(--app-border)] pt-4">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-ink/60">
                <Mic size={13} />
                Seslendirme metni — düzenleyebilirsiniz (boş bırakılırsa video sessiz olur)
              </label>
              <textarea
                value={voiceDraft}
                onChange={(e) => setVoiceDraft(e.target.value)}
                rows={3}
                className="dash-input resize-y text-sm"
                placeholder="Tanıtım metni…"
              />
              <button onClick={handleMerge} disabled={pending} className="dash-btn-primary">
                {pending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Başlatılıyor…
                  </>
                ) : (
                  <>
                    <Clapperboard size={14} />
                    Seslendir ve Birleştir
                  </>
                )}
              </button>
            </div>
          )}

          {project.merging && (
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <Loader2 size={15} className="animate-spin" />
              Sahneler ve seslendirme tek videoda birleştiriliyor — ortalama 1-2 dakika.
            </div>
          )}

          {/* Nihai video */}
          {project.finalVideoUrl && (
            <div className="space-y-3 border-t border-[var(--app-border)] pt-4">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                  <Check size={15} />
                  Tanıtım videonuz hazır
                </h4>
                <a
                  href={project.finalVideoUrl}
                  download
                  className="dash-btn-secondary text-xs"
                >
                  <Download size={13} />
                  İndir
                </a>
              </div>
              <video
                src={project.finalVideoUrl}
                controls
                className={`w-full rounded-xl bg-black ${
                  project.aspectRatio === "9:16" ? "mx-auto max-h-[480px] max-w-[270px]" : ""
                }`}
              />
            </div>
          )}

          {project.errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-xs text-rose-700">
              <AlertCircle size={14} />
              {project.errorMessage}
            </div>
          )}
        </div>
      )}

      {/* Konsept seçimi */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink/70">
          {project ? "Yeni video oluştur" : "Video konsepti seçin"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {CONCEPTS.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelectedConcept(c.key)}
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
            Her fotoğraf 5 saniyelik bir sahne olur ve 1 kredi düşer (en fazla{" "}
            {MAX_SCENES} sahne). Sıralama videonun akışını belirler.
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
                    Sıralama ({selectedPhotos.length} sahne ·{" "}
                    {selectedPhotos.length * 5} saniye)
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
                          <GripVertical size={14} className="text-ink/30" />
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
                    videoCredits < selectedPhotos.length
                  }
                  className="dash-btn-primary"
                >
                  {pending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Sahneler gönderiliyor…
                    </>
                  ) : (
                    <>
                      <Film size={14} />
                      Videoyu Oluştur
                    </>
                  )}
                </button>
                <span className="text-xs text-ink/45">
                  {selectedPhotos.length > 0
                    ? videoCredits >= selectedPhotos.length
                      ? `${selectedPhotos.length} kredi düşülecek — kalan: ${videoCredits}`
                      : `Yetersiz kredi: ${selectedPhotos.length} gerekli, ${videoCredits} kaldı`
                    : `Kalan kredi: ${videoCredits}`}
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
