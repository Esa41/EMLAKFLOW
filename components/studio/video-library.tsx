"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  Clock,
  Download,
  Film,
  Pencil,
  Play,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { deleteStudioProject, type LibraryItem } from "@/app/actions/studio-video";

/**
 * Video kütüphanesi — üretilen tüm videolar tek yerde.
 *
 * Bu ekran olmadan düzenleyicilere (ekran yazısı, müzik, seslendirme, sahne
 * yenileme) yalnız üretimden HEMEN SONRA erişilebiliyordu; sekmeyi kapatan
 * müşteri projesini bir daha bulamıyordu. "Düzenle" projeyi mevcut
 * düzenleyicilere geri yükler — yeni bir editör yazılmadı, var olan
 * kullanılabilir hale getirildi.
 */

const STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Taslak", cls: "bg-ink/8 text-ink/60" },
  RENDERING: { label: "Üretiliyor", cls: "bg-[var(--app-warn-bg)] text-[var(--app-warn-text)]" },
  COMPLETED: { label: "Hazır", cls: "bg-emerald-50 text-emerald-700" },
  FAILED: { label: "Başarısız", cls: "bg-rose-50 text-rose-700" },
};

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const gun = Math.floor(diff / 86400000);
  if (gun === 0) return "bugün";
  if (gun === 1) return "dün";
  if (gun < 30) return `${gun} gün önce`;
  const ay = Math.floor(gun / 30);
  return `${ay} ay önce`;
}

export function VideoLibrary({
  items,
  onOpen,
  onDeleted,
}: {
  items: LibraryItem[];
  /** Projeyi düzenleyiciye yükler — video sekmesindeki mevcut editörler */
  onOpen: (projectId: string, listingId: string) => void;
  onDeleted: (projectId: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function remove(id: string) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const r = await deleteStudioProject(id);
      setBusyId(null);
      setConfirmId(null);
      if (r.ok) onDeleted(id);
      else setError(r.error);
    });
  }

  if (items.length === 0) {
    return (
      <div className="dash-empty">
        <Film className="mx-auto mb-3 h-8 w-8 text-ink/20" />
        Henüz video üretmediniz. Bir ilan seçip şablonlardan birini
        çalıştırdığınızda videolar burada toplanır.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <TriangleAlert size={14} /> {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => {
          const st = STATUS[it.status] ?? STATUS.DRAFT;
          const portrait = it.aspectRatio === "9:16";
          const rendering = it.status === "RENDERING";
          return (
            <div
              key={it.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]"
            >
              {/* Kapak — hazırsa video, değilse ilk sahnenin fotoğrafı.
                  Oran HER KARTTA 16:9: dikey kartı 3/4 yapmak ızgara satırını
                  bozuyor ve yatay kartların altında koca boşluk bırakıyordu.
                  Dikey içerik siyah zemin üstünde ortalanır — "9:16" etiketi
                  zaten dikey olduğunu söylüyor. */}
              <div
                className={`relative aspect-video overflow-hidden ${
                  portrait ? "bg-ink" : "bg-[var(--app-input-bg)]"
                }`}
              >
                {it.finalVideoUrl ? (
                  <video
                    src={it.finalVideoUrl}
                    poster={it.coverUrl ?? undefined}
                    controls
                    playsInline
                    preload="metadata"
                    className="h-full w-full bg-ink object-contain"
                  />
                ) : it.coverUrl ? (
                  <>
                    <Image
                      src={it.coverUrl}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 33vw, 50vw"
                      className={`opacity-60 ${portrait ? "object-contain" : "object-cover"}`}
                    />
                    <span className="absolute inset-0 flex items-center justify-center">
                      {rendering ? (
                        <span className="flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                          <Clock size={11} /> {it.doneCount}/{it.sceneCount} sahne
                        </span>
                      ) : (
                        <Play size={26} className="text-white/70" />
                      )}
                    </span>
                  </>
                ) : (
                  <span className="flex h-full items-center justify-center text-ink/20">
                    <Film size={26} />
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-1 text-[13.5px] font-bold">
                    {it.listingTitle}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${st.cls}`}
                  >
                    {st.label}
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink/40">
                  {it.templateLabel} · {it.aspectRatio} · {relativeDate(it.createdAt)}
                </p>

                <div className="mt-3 flex items-center gap-1.5">
                  {/* Düzenle: projeyi mevcut editörlere geri yükler */}
                  <button
                    type="button"
                    onClick={() => onOpen(it.id, it.listingId)}
                    className="flex items-center gap-1.5 rounded-lg bg-ink/[0.06] px-2.5 py-1.5 text-[11.5px] font-semibold text-ink transition-colors hover:bg-ink/[0.12]"
                  >
                    <Pencil size={12} /> Düzenle
                  </button>
                  {it.finalVideoUrl && (
                    <a
                      href={it.finalVideoUrl}
                      download
                      className="flex items-center gap-1.5 rounded-lg bg-ink/[0.06] px-2.5 py-1.5 text-[11.5px] font-semibold text-ink transition-colors hover:bg-ink/[0.12]"
                    >
                      <Download size={12} /> İndir
                    </a>
                  )}
                  {/* Silme onay ister — üretilmiş video kredi karşılığı */}
                  {confirmId === it.id ? (
                    <span className="ml-auto flex items-center gap-1">
                      <button
                        type="button"
                        disabled={pending && busyId === it.id}
                        onClick={() => remove(it.id)}
                        className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11.5px] font-bold text-white disabled:opacity-50"
                      >
                        {pending && busyId === it.id ? "Siliniyor…" : "Sil"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="rounded-lg px-2 py-1.5 text-[11.5px] font-semibold text-ink/50 hover:text-ink"
                      >
                        Vazgeç
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(it.id)}
                      aria-label="Projeyi sil"
                      className="ml-auto rounded-lg p-1.5 text-ink/35 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
