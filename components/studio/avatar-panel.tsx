"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, UserRound, Video } from "lucide-react";
import {
  AVATAR_PERSONAS,
  AVATAR_CREDIT_COST,
  PRESENTER_MAX_CLIP_SEC,
} from "@/lib/studio-avatar";
import { setAvatarPersona, generateAvatarClip } from "@/app/actions/studio-avatar";
import type { StudioProjectView } from "@/app/actions/studio-video";

const MAX_CHARS = PRESENTER_MAX_CLIP_SEC * 14;

/**
 * Vitrin Sunucusu paneli — persona seçimi + senaryo + klip üretimi.
 * presenter_reels projelerinde Senaryo Editörü YERİNE görünür (sunucu sesi
 * klipte gömülü olduğundan segment seslendirmesi bu şablonda kullanılmaz).
 */
export function AvatarPanel({
  project,
  unlimited,
  videoCredits,
  onProject,
}: {
  project: StudioProjectView;
  unlimited: boolean;
  videoCredits: number;
  onProject: (updater: (p: StudioProjectView) => StudioProjectView) => void;
}) {
  const [script, setScript] = useState(
    project.avatarScript ?? project.voiceText ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = project.avatarStatus;
  const generating = status === "PROCESSING";

  async function pickPersona(key: string) {
    if (generating || busy) return;
    setError(null);
    const result = await setAvatarPersona({ projectId: project.id, personaKey: key });
    if (result.ok) {
      onProject((p) => ({ ...p, avatarPersonaKey: result.state.personaKey }));
    } else {
      setError(result.error);
    }
  }

  async function handleGenerate() {
    setBusy(true);
    setError(null);
    try {
      const result = await generateAvatarClip({ projectId: project.id, script });
      if (result.ok) {
        onProject((p) => ({
          ...p,
          avatarStatus: result.state.status,
          avatarScript: result.state.script,
          avatarVideoUrl: result.state.videoUrl,
        }));
      } else {
        setError(result.error);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="flex items-center gap-1.5 text-sm font-bold">
        <UserRound size={14} className="text-emerald-600" />
        Vitrin Sunucusu
      </h4>

      {/* Persona seçimi */}
      <div className="grid gap-2 sm:grid-cols-3">
        {AVATAR_PERSONAS.map((persona) => {
          const selected = project.avatarPersonaKey === persona.key;
          const locked = !persona.available && !unlimited;
          return (
            <button
              key={persona.key}
              type="button"
              disabled={locked || generating || busy}
              onClick={() => pickPersona(persona.key)}
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                selected
                  ? "border-emerald-500 shadow-sm"
                  : "border-[var(--app-border)] hover:border-ink/20"
              } ${locked ? "opacity-55" : ""}`}
            >
              <p className="text-sm font-bold">
                {persona.label}
                {locked && (
                  <span className="ml-1.5 rounded bg-ink/[0.08] px-1.5 py-0.5 align-middle text-[9px] font-bold uppercase text-ink/50">
                    Yakında
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-ink/50">
                {persona.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Senaryo — tek parça seslendirilir, süre = maliyet */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-ink/60">
          Sunucu metni — ilan verinizden oluşturuldu, düzenleyebilirsiniz
        </label>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={3}
          disabled={generating}
          className="dash-input resize-y text-sm"
          placeholder="Sunucunun söyleyeceği metin…"
        />
        <p
          className={`text-[11px] font-medium ${
            script.length > MAX_CHARS ? "text-rose-600" : "text-ink/40"
          }`}
        >
          {script.length}/{MAX_CHARS} karakter (~{PRESENTER_MAX_CLIP_SEC} sn)
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={
            busy ||
            generating ||
            !script.trim() ||
            script.length > MAX_CHARS ||
            (!unlimited && videoCredits < AVATAR_CREDIT_COST)
          }
          className="dash-btn-secondary"
        >
          {busy || generating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              {generating ? "Sunucu klibi üretiliyor…" : "Gönderiliyor…"}
            </>
          ) : (
            <>
              <Video size={14} />
              {status === "COMPLETED" ? "Sunucuyu Yeniden Konuştur" : "Sunucuyu Konuştur"}
            </>
          )}
        </button>
        <span className="text-xs text-ink/45">
          {unlimited
            ? "Test modu — kredi düşülmez"
            : `${AVATAR_CREDIT_COST} kredi düşülecek — kalan: ${videoCredits}`}
        </span>
      </div>

      {status === "COMPLETED" && project.avatarVideoUrl && (
        <div className="space-y-2">
          <p className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={13} />
            Sunucu klibi hazır — birleştirmede köşe penceresi olarak eklenecek.
          </p>
          <video
            src={project.avatarVideoUrl}
            controls
            playsInline
            className="max-h-[280px] rounded-xl bg-black"
          />
        </div>
      )}

      {status === "FAILED" && (
        <p className="flex items-center gap-1 text-xs font-semibold text-rose-600">
          <AlertCircle size={13} />
          Sunucu klibi üretilemedi — krediniz iade edildi, yeniden deneyin.
        </p>
      )}

      {error && (
        <p className="flex items-center gap-1 text-xs font-semibold text-rose-600">
          <AlertCircle size={13} />
          {error}
        </p>
      )}
    </div>
  );
}
