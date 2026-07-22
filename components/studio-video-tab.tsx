"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import {
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
  Pencil,
  Trash2,
  ShieldCheck,
  Wand2,
  ListOrdered,
  Share2,
} from "lucide-react";
import { sendStudioToSocial } from "@/app/actions/social-os";
import {
  createStudioProject,
  getStudioProject,
  getLatestStudioProject,
  regenerateScene,
  approveScene,
  mergeProject,
  updateOverlayData,
  setProjectMusic,
  updateSceneTransition,
  getStudioMusicOptions,
  type StudioProjectView,
  type StudioMusicOption,
} from "@/app/actions/studio-video";
import {
  generateVoiceSegments,
  regenerateVoiceSegment,
  deleteVoiceSegment,
} from "@/app/actions/studio-voice";
import {
  ROOMS,
  INTERIOR_TEMPLATE_ORDER,
  parseNegativeTerms,
  findNegativeTermViolations,
  type RoomKey,
} from "@/lib/studio-prompts";
import {
  TEMPLATES,
  TRANSITION_LABELS,
  templateLabel,
  resolveTemplate,
  transitionForBoundary,
  REFERENCE_DURATION_SEC,
  REFERENCE_CREDIT_COST,
  type TemplateKey,
  type TransitionKey,
} from "@/lib/studio-templates";
import { TemplatePicker } from "@/components/studio/template-picker";
import { OverlayEditor } from "@/components/studio/overlay-editor";
import { MusicPicker } from "@/components/studio/music-picker";
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
  /** Test modu — kredi kapıları kapalı (sunucu da bedel almıyor) */
  unlimited: boolean;
  listingId: string;
  /** İlan tipi (APARTMENT | LAND | …) — önerilen şablon rozeti için */
  listingType: string | null;
  media: MediaItem[];
  videoCredits: number;
  onCreditsChange: (credits: number) => void;
  history: StudioJobItem[];
  /** Şablon örnek klipleri — templateKey → imzalı R2 URL */
  templatePreviews: Record<string, string>;
};

const MAX_SCENES = 8;
const POLL_MS = 15_000;

const SCENE_STATUS_LABEL: Record<string, string> = {
  PENDING: "Sırada",
  PROCESSING: "İşleniyor",
  COMPLETED: "Hazır",
  FAILED: "Başarısız",
};

export function StudioVideoTab({
  unlimited,
  listingId,
  listingType,
  media,
  videoCredits,
  onCreditsChange,
  history,
  templatePreviews,
}: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [roomAssignments, setRoomAssignments] = useState<Record<string, string>>({});
  const [sceneDurations, setSceneDurations] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [project, setProject] = useState<StudioProjectView | null>(null);
  const [voiceDraft, setVoiceDraft] = useState("");
  const [negativeInput, setNegativeInput] = useState("");
  const [busySceneId, setBusySceneId] = useState<string | null>(null);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [editingSegment, setEditingSegment] = useState<{ id: string; text: string } | null>(null);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [outroOn, setOutroOn] = useState(true);
  const [musicOptions, setMusicOptions] = useState<StudioMusicOption[]>([]);
  const [overlaySaving, setOverlaySaving] = useState(false);

  const photos = media.filter((m) => m.kind === "photo");
  const template = selectedTemplate ? TEMPLATES[selectedTemplate] : undefined;

  // İlan değişince devam eden projeyi yükle
  useEffect(() => {
    let cancelled = false;
    setProject(null);
    getLatestStudioProject(listingId).then((p) => {
      if (!cancelled && p) {
        setProject(p);
        setVoiceDraft(p.voiceText ?? "");
        setNegativeInput(p.negativeTerms.join(", "));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  // Müzik önizleme seçenekleri (statik liste — bir kez yüklenir)
  useEffect(() => {
    getStudioMusicOptions().then(setMusicOptions);
  }, []);

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

  /** Referans şablon: profesyonel tur dizilimine göre sırala (dış cephe → salon → …) */
  function applyTemplateOrder() {
    setSelectedPhotos((prev) =>
      [...prev].sort((a, b) => {
        const ra = INTERIOR_TEMPLATE_ORDER.indexOf(roomAssignments[a] as RoomKey);
        const rb = INTERIOR_TEMPLATE_ORDER.indexOf(roomAssignments[b] as RoomKey);
        return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
      }),
    );
  }

  function handleGenerate() {
    if (!selectedTemplate) return;
    setError(null);

    startTransition(async () => {
      const result = await createStudioProject({
        listingId,
        templateKey: selectedTemplate,
        selectedMedia: selectedPhotos.map((id) => ({
          id,
          roomKey: roomAssignments[id] ?? null,
          durationSec: sceneDurations[id] === 10 ? 10 : 5,
        })),
      });

      if (result.ok) {
        setProject(result.project);
        setVoiceDraft(result.project.voiceText ?? "");
        setNegativeInput(result.project.negativeTerms.join(", "));
        if (result.remainingCredits !== undefined) {
          onCreditsChange(result.remainingCredits);
        }
        setSelectedTemplate(null);
        setSelectedPhotos([]);
        setRoomAssignments({});
        setSceneDurations({});
      } else {
        setError(result.error);
      }
    });
  }

  function handleRegenerate(sceneId: string, cost: number) {
    setError(null);
    setBusySceneId(sceneId);
    startTransition(async () => {
      const result = await regenerateScene(sceneId);
      setBusySceneId(null);
      if (result.ok) {
        setProject(result.project);
        onCreditsChange(videoCredits - cost);
      } else {
        setError(result.error);
      }
    });
  }

  function handleTransitionChange(sceneId: string, transitionKey: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateSceneTransition({ sceneId, transitionKey });
      if (result.ok) setProject(result.project);
      else setError(result.error);
    });
  }

  function handleApprove(sceneId: string, approved: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await approveScene({ sceneId, approved });
      if (result.ok) setProject(result.project);
      else setError(result.error);
    });
  }

  function handleVoiceSegments() {
    if (!project) return;
    setError(null);
    setVoiceBusy(true);
    startTransition(async () => {
      const result = await generateVoiceSegments({
        projectId: project.id,
        voiceText: voiceDraft,
        negativeTermsInput: negativeInput,
      });
      setVoiceBusy(false);
      if (result.ok) {
        setProject((p) => (p ? { ...p, voiceSegments: result.segments, voiceText: voiceDraft } : p));
      } else {
        setError(result.error);
      }
    });
  }

  function handleSegmentSave() {
    if (!editingSegment) return;
    setError(null);
    setVoiceBusy(true);
    startTransition(async () => {
      const result = await regenerateVoiceSegment({
        segmentId: editingSegment.id,
        text: editingSegment.text,
      });
      setVoiceBusy(false);
      setEditingSegment(null);
      if (result.ok) {
        setProject((p) => (p ? { ...p, voiceSegments: result.segments } : p));
      } else {
        setError(result.error);
      }
    });
  }

  function handleSegmentRevoice(segmentId: string) {
    setError(null);
    setVoiceBusy(true);
    startTransition(async () => {
      const result = await regenerateVoiceSegment({ segmentId });
      setVoiceBusy(false);
      if (result.ok) {
        setProject((p) => (p ? { ...p, voiceSegments: result.segments } : p));
      } else {
        setError(result.error);
      }
    });
  }

  function handleSegmentDelete(segmentId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteVoiceSegment({ segmentId });
      if (result.ok) {
        setProject((p) => (p ? { ...p, voiceSegments: result.segments } : p));
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
        captions: captionsOn,
        outro: outroOn,
      });
      if (result.ok) setProject(result.project);
      else setError(result.error);
    });
  }

  function handleOverlaySave(
    overlays: { key: string; text: string; enabled: boolean }[],
  ) {
    if (!project) return;
    setError(null);
    setOverlaySaving(true);
    startTransition(async () => {
      const result = await updateOverlayData({ projectId: project.id, overlays });
      setOverlaySaving(false);
      if (result.ok) setProject(result.project);
      else setError(result.error);
    });
  }

  function handleMusicChange(musicKey: string) {
    if (!project) return;
    setError(null);
    startTransition(async () => {
      const result = await setProjectMusic({ projectId: project.id, musicKey });
      if (result.ok) setProject(result.project);
      else setError(result.error);
    });
  }

  const allScenesDone =
    !!project &&
    project.scenes.length > 0 &&
    project.scenes.every((s) => s.status === "COMPLETED");
  const allApproved =
    !!project && allScenesDone && project.scenes.every((s) => s.approved);
  const anyFailed = !!project && project.scenes.some((s) => s.status === "FAILED");
  const segments = project?.voiceSegments ?? [];
  const segmentsReady =
    segments.length > 0 && segments.every((v) => v.status === "COMPLETED");
  const liveViolations = findNegativeTermViolations(
    voiceDraft,
    parseNegativeTerms(negativeInput),
  );
  const videoJobs = history.filter((j) => j.type === "VIDEO_GENERATE");
  // reference: tüm fotoğraflar tek videoya girer → sabit süre/bedel
  // per_scene: 5 sn = 1 kredi, 10 sn = 2 kredi
  const isReference = template?.generationMode === "reference";
  const totalSeconds = isReference
    ? REFERENCE_DURATION_SEC
    : selectedPhotos.reduce(
        (sum, id) => sum + (sceneDurations[id] === 10 ? 10 : 5),
        0,
      );
  const totalCost = isReference
    ? REFERENCE_CREDIT_COST
    : selectedPhotos.reduce(
        (sum, id) => sum + (sceneDurations[id] === 10 ? 2 : 1),
        0,
      );

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
                      ? allApproved
                        ? "Onaylandı — birleştirilebilir"
                        : "Onay bekliyor"
                      : "Render sürüyor"}
            </span>
          </div>

          {/* Sahne şeridi */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {project.scenes.map((s) => (
              <div
                key={s.id}
                className={`overflow-hidden rounded-xl ring-1 ${
                  s.approved ? "ring-emerald-500/60" : "ring-[var(--app-border)]"
                }`}
              >
                <div className="relative aspect-video bg-ink/5">
                  {s.status === "COMPLETED" && s.outputUrl ? (
                    <video
                      src={s.outputUrl}
                      className="h-full w-full object-cover"
                      muted
                      loop
                      playsInline
                      controls
                      preload="metadata"
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
                    {s.roomKey && ROOMS[s.roomKey as RoomKey]
                      ? ` · ${ROOMS[s.roomKey as RoomKey].label}`
                      : ""}
                  </span>
                </div>
                <div className="space-y-1.5 px-2.5 py-2">
                  <div className="flex items-center justify-between">
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
                          onClick={() =>
                            handleRegenerate(s.id, s.durationSec === 10 ? 2 : 1)
                          }
                          disabled={
                            pending ||
                            (!unlimited &&
                              videoCredits < (s.durationSec === 10 ? 2 : 1))
                          }
                          className="flex items-center gap-1 text-[10px] font-semibold text-ink/45 hover:text-brand-600 disabled:opacity-40"
                          title={`${s.durationSec === 10 ? 2 : 1} kredi ile yeniden üret`}
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
                  {/* Onay kapısı */}
                  {s.status === "COMPLETED" && !project.finalVideoUrl && !project.merging && (
                    <button
                      onClick={() => handleApprove(s.id, !s.approved)}
                      disabled={pending}
                      className={`flex w-full items-center justify-center gap-1 rounded-lg py-1 text-[10px] font-bold transition-colors ${
                        s.approved
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-ink/[0.05] text-ink/55 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                    >
                      <ShieldCheck size={11} />
                      {s.approved ? "Onaylandı" : "İzledim, Onayla"}
                    </button>
                  )}
                  {/* Giriş geçişi — kurgu katmanında uygulanır, yeniden render gerektirmez */}
                  {s.order > 0 && !project.finalVideoUrl && !project.merging && (
                    <select
                      value={
                        (s.transitionKey as TransitionKey | null) ??
                        transitionForBoundary(
                          resolveTemplate(project.templateKey, project.conceptKey),
                          s.order - 1,
                        )
                      }
                      onChange={(e) => handleTransitionChange(s.id, e.target.value)}
                      disabled={pending}
                      className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-1.5 py-1 text-[10px] font-medium"
                      title="Bu sahneye giriş geçiş efekti"
                    >
                      {Object.entries(TRANSITION_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          Geçiş: {label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Akıllı Senaryo Editörü ── */}
          {allScenesDone && !project.finalVideoUrl && !project.merging && (
            <div className="space-y-4 border-t border-[var(--app-border)] pt-4">
              <h4 className="flex items-center gap-1.5 text-sm font-bold">
                <Mic size={14} className="text-brand-600" />
                Akıllı Senaryo Editörü
              </h4>

              {/* Yasaklı kelimeler */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink/60">
                  Yasaklı kelimeler — bu kelimeler metinde asla geçmez (virgülle ayırın)
                </label>
                <input
                  type="text"
                  value={negativeInput}
                  onChange={(e) => setNegativeInput(e.target.value)}
                  placeholder="örn: acil, kelepir, pazarlıklı"
                  className="dash-input text-sm"
                />
              </div>

              {/* Metin */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink/60">
                  Tanıtım metni — ilan verinizden otomatik oluşturuldu, düzenleyebilirsiniz
                </label>
                <textarea
                  value={voiceDraft}
                  onChange={(e) => setVoiceDraft(e.target.value)}
                  rows={3}
                  className="dash-input resize-y text-sm"
                  placeholder="Tanıtım metni…"
                />
                {liveViolations.length > 0 && (
                  <p className="flex items-center gap-1 text-xs font-semibold text-rose-600">
                    <AlertCircle size={12} />
                    Yasaklı kelime kullanıldı: {liveViolations.join(", ")}
                  </p>
                )}
              </div>

              <button
                onClick={handleVoiceSegments}
                disabled={pending || voiceBusy || !voiceDraft.trim() || liveViolations.length > 0}
                className="dash-btn-secondary"
              >
                {voiceBusy ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Cümleler seslendiriliyor…
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    {segments.length ? "Yeniden Cümle Cümle Seslendir" : "Cümle Cümle Seslendir"}
                  </>
                )}
              </button>

              {/* Segment listesi */}
              {segments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-ink/50">
                    Seslendirme segmentleri — beğenmediğiniz cümleyi tek başına düzenleyin
                  </p>
                  {segments.map((v) => (
                    <div
                      key={v.id}
                      className="space-y-2 rounded-xl bg-[var(--app-input-bg)] px-3 py-2.5"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 rounded-md bg-ink/[0.07] px-1.5 py-0.5 text-[10px] font-bold text-ink/55">
                          {v.order + 1}
                        </span>
                        {editingSegment?.id === v.id ? (
                          <div className="flex-1 space-y-2">
                            <textarea
                              value={editingSegment.text}
                              onChange={(e) =>
                                setEditingSegment({ id: v.id, text: e.target.value })
                              }
                              rows={2}
                              className="dash-input text-sm"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSegmentSave}
                                disabled={voiceBusy}
                                className="dash-btn-primary px-3 py-1 text-xs"
                              >
                                {voiceBusy ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Check size={12} />
                                )}
                                Kaydet ve Seslendir
                              </button>
                              <button
                                onClick={() => setEditingSegment(null)}
                                className="dash-btn-secondary px-3 py-1 text-xs"
                              >
                                Vazgeç
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="flex-1 text-sm leading-relaxed">{v.text}</p>
                        )}
                        {editingSegment?.id !== v.id && (
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              onClick={() => setEditingSegment({ id: v.id, text: v.text })}
                              disabled={voiceBusy}
                              className="rounded-md p-1 text-ink/40 hover:bg-ink/10 hover:text-ink/70"
                              title="Cümleyi düzenle"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => handleSegmentRevoice(v.id)}
                              disabled={voiceBusy}
                              className="rounded-md p-1 text-ink/40 hover:bg-ink/10 hover:text-ink/70"
                              title="Bu cümleyi yeniden seslendir"
                            >
                              <RotateCcw size={13} />
                            </button>
                            <button
                              onClick={() => handleSegmentDelete(v.id)}
                              disabled={voiceBusy}
                              className="rounded-md p-1 text-ink/40 hover:bg-rose-50 hover:text-rose-600"
                              title="Cümleyi sil"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                      {editingSegment?.id !== v.id && (
                        <div className="flex items-center gap-2 pl-7">
                          {v.status === "COMPLETED" && v.audioUrl ? (
                            <>
                              <audio src={v.audioUrl} controls preload="none" className="h-8 w-full max-w-[320px]" />
                              {v.durationMs && (
                                <span className="text-[10px] text-ink/40">
                                  {(v.durationMs / 1000).toFixed(1)} sn
                                </span>
                              )}
                            </>
                          ) : v.status === "FAILED" ? (
                            <span className="text-xs font-semibold text-rose-600" title={v.errorMessage ?? undefined}>
                              Seslendirme başarısız — yeniden deneyin
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-blue-600">
                              <Loader2 size={11} className="animate-spin" />
                              Üretiliyor…
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Ekran yazıları — şablonun bilgi kartları */}
              {(project.overlayData?.length ?? 0) > 0 && (
                <div className="border-t border-[var(--app-border)] pt-4">
                  <OverlayEditor
                    overlays={project.overlayData!}
                    disabled={pending || project.merging}
                    saving={overlaySaving}
                    onSave={handleOverlaySave}
                  />
                </div>
              )}

              {/* Arka plan müziği */}
              {musicOptions.length > 0 && (
                <div className="border-t border-[var(--app-border)] pt-4">
                  <MusicPicker
                    options={musicOptions}
                    value={project.musicKey}
                    templateDefault={
                      resolveTemplate(project.templateKey, project.conceptKey)
                        .musicDefault
                    }
                    disabled={pending || project.merging}
                    onChange={handleMusicChange}
                  />
                </div>
              )}

              {/* Birleştirme */}
              <div className="space-y-3 border-t border-[var(--app-border)] pt-4">
                <div className="flex flex-wrap items-center gap-4">
                  <label
                    className={`flex cursor-pointer items-center gap-2 text-xs font-semibold ${
                      segments.length === 0 ? "opacity-40" : "text-ink/60"
                    }`}
                    title={
                      segments.length === 0
                        ? "Altyazı için önce cümle cümle seslendirme yapın"
                        : "Konuşma metni videonun altında kısa gruplar halinde akar"
                    }
                  >
                    <input
                      type="checkbox"
                      checked={captionsOn && segments.length > 0}
                      onChange={(e) => setCaptionsOn(e.target.checked)}
                      disabled={segments.length === 0}
                      className="h-3.5 w-3.5 accent-[var(--brand-fill,#4f46e5)]"
                    />
                    Altyazı
                  </label>
                  <label
                    className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink/60"
                    title="Video sonuna ofis adı/telefon/logo kartı + sahnelerde köşe filigranı"
                  >
                    <input
                      type="checkbox"
                      checked={outroOn}
                      onChange={(e) => setOutroOn(e.target.checked)}
                      className="h-3.5 w-3.5 accent-[var(--brand-fill,#4f46e5)]"
                    />
                    Kapanış kartı + logo
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleMerge}
                  disabled={
                    pending ||
                    voiceBusy ||
                    !allApproved ||
                    (segments.length > 0 && !segmentsReady)
                  }
                  className="dash-btn-primary"
                >
                  {pending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Başlatılıyor…
                    </>
                  ) : (
                    <>
                      <Clapperboard size={14} />
                      {segments.length ? "Videoyu Birleştir" : "Sessiz Birleştir"}
                    </>
                  )}
                </button>
                {!allApproved && (
                  <span className="text-xs text-ink/45">
                    Birleştirme için tüm sahneleri izleyip onaylayın.
                  </span>
                )}
                {allApproved && segments.length === 0 && (
                  <span className="text-xs text-ink/45">
                    Seslendirme eklemek için önce "Cümle Cümle Seslendir" kullanın.
                  </span>
                )}
                </div>
              </div>
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                  <Check size={15} />
                  Tanıtım videonuz hazır
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        try {
                          const res = await sendStudioToSocial({
                            studioProjectId: project.id,
                          });
                          window.location.href = `/sosyal/planlayici?focus=${res.assetId}`;
                        } catch (e) {
                          alert(
                            e instanceof Error
                              ? e.message
                              : "Sosyal’e gönderilemedi",
                          );
                        }
                      });
                    }}
                    className="dash-btn-primary inline-flex items-center gap-1.5 text-xs"
                  >
                    <Share2 size={13} />
                    Sosyal’e gönder
                  </button>
                  <a
                    href={project.finalVideoUrl}
                    download
                    className="dash-btn-secondary text-xs"
                  >
                    <Download size={13} />
                    İndir
                  </a>
                </div>
              </div>
              <video
                src={project.finalVideoUrl}
                controls
                className={`w-full rounded-xl bg-black ${
                  project.aspectRatio === "9:16" ? "mx-auto max-h-[480px] max-w-[270px]" : ""
                }`}
              />
              <p className="text-[11px] text-ink/40">
                Sosyal OS Planlayıcı’da caption + hashtag üretilir; takvime
                ekleyebilirsiniz.
              </p>
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

      {/* Şablon seçimi */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink/70">
          {project ? "Yeni video oluştur" : "Hazır şablon seçin"}
        </h3>
        <TemplatePicker
          listingType={listingType}
          selected={selectedTemplate}
          onSelect={setSelectedTemplate}
          previews={templatePreviews}
        />
      </div>

      {/* Fotoğraf seçimi — şablon seçildikten sonra */}
      {template && (
        <div className="dash-card p-5">
          <h3 className="mb-1 text-sm font-bold">
            Videoda kullanılacak fotoğrafları seçin
          </h3>
          <p className="mb-4 text-xs text-ink/45">
            {isReference ? (
              <>
                Seçtiğiniz fotoğrafların tamamı AI'a referans verilir ve{" "}
                <strong>tek akıcı tur videosu</strong> üretilir (
                {REFERENCE_DURATION_SEC} sn, {REFERENCE_CREDIT_COST} kredi — en
                fazla {MAX_SCENES} fotoğraf). Sıralama turun akışını belirler:
                kamera fotoğraflarınızı bu sırayla dolaşır.
              </>
            ) : (
              <>
                Her fotoğraf bir sahne olur: 5 sn = 1 kredi, 10 sn = 2 kredi (en
                fazla {MAX_SCENES} sahne). Sıralama videonun akışını belirler.
              </>
            )}
            {template.usesRooms &&
              " Her fotoğrafa oda etiketi verin — AI mekânı tanır ve görüntüye sadık kalır."}
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

              {/* Sıralama + oda etiketleri */}
              {selectedPhotos.length > 0 && (
                <div className="mt-5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-ink/50">
                      Sıralama ({selectedPhotos.length} sahne · {totalSeconds}{" "}
                      saniye · {totalCost} kredi)
                    </p>
                    {template.usesRooms &&
                      selectedPhotos.some((id) => roomAssignments[id]) && (
                        <button
                          onClick={applyTemplateOrder}
                          className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                          title="Profesyonel tur dizilimi: Dış Cephe → Salon → Mutfak → Yatak → Banyo → Balkon"
                        >
                          <ListOrdered size={13} />
                          Şablona göre sırala
                        </button>
                      )}
                  </div>
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
                          {template.usesRooms && (
                            <select
                              value={roomAssignments[id] ?? ""}
                              onChange={(e) =>
                                setRoomAssignments((prev) => ({
                                  ...prev,
                                  [id]: e.target.value,
                                }))
                              }
                              className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-1.5 py-1 text-[11px] font-medium"
                            >
                              <option value="">Oda seçin…</option>
                              {Object.entries(ROOMS).map(([key, r]) => (
                                <option key={key} value={key}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          )}
                          {/* reference modunda süre tüm videoya ait — sahne
                              başına seçim anlamsız */}
                          {!isReference && (
                            <select
                              value={sceneDurations[id] === 10 ? "10" : "5"}
                              onChange={(e) =>
                                setSceneDurations((prev) => ({
                                  ...prev,
                                  [id]: Number(e.target.value),
                                }))
                              }
                              className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-1.5 py-1 text-[11px] font-medium"
                              title="Sahne süresi — 10 sn sahne 2 kredi düşer"
                            >
                              <option value="5">5 sn · 1 kredi</option>
                              <option value="10">10 sn · 2 kredi</option>
                            </select>
                          )}
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
                    !selectedTemplate ||
                    selectedPhotos.length === 0 ||
                    (!unlimited && videoCredits < totalCost)
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
                    ? unlimited
                      ? "Test modu — kredi düşülmez"
                      : videoCredits >= totalCost
                        ? `${totalCost} kredi düşülecek — kalan: ${videoCredits}`
                        : `Yetersiz kredi: ${totalCost} gerekli, ${videoCredits} kaldı`
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
                      {templateLabel(null, job.videoConceptKey)}{" "}
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
