"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2, Loader2 } from "lucide-react";

export interface MediaItem {
  id: string;
  url: string;
  key: string;
  thumbUrl?: string | null;
}

/**
 * Yükleme öncesi tarayıcıda sıkıştırma: en uzun kenar 2560px'e indirilir
 * (yüksek çözünürlük korunur — sunucu bu orijinalden thumb/card varyantları
 * üretir), WebP'ye çevrilir (kalite 0.85). Başarısız olursa orijinal dosya
 * kullanılır — hiçbir zaman yüklemeyi bloklamaz.
 */
async function compressImage(
  file: File,
  maxDim = 2560,
  quality = 0.85,
): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (!blob || blob.size >= file.size) return file; // sıkıştırma işe yaramadıysa orijinali koru
    const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], newName, { type: "image/webp" });
  } catch {
    return file;
  }
}

export function PhotoUploader({
  listingId,
  initialMedia,
}: {
  listingId: string;
  initialMedia: MediaItem[];
}) {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /** Tek dosyayı sıkıştırıp R2'ye yükler → key döner (kayıt ayrı adımda). */
  async function uploadToR2(rawFile: File): Promise<string> {
    // 0. Tarayıcıda küçült + WebP'ye çevir (optimize edilmiş yükleme)
    const file = await compressImage(rawFile);

    // 1. Presigned URL al
    const presign = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, contentType: file.type }),
    });
    if (!presign.ok) {
      const d = await presign.json().catch(() => ({}));
      throw new Error(d.error ?? "Yükleme URL'si alınamadı.");
    }
    const { uploadUrl, key } = await presign.json();

    // 2. Doğrudan R2'ye PUT
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!put.ok) throw new Error("Dosya R2'ye yüklenemedi.");
    return key as string;
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);

    const list = Array.from(files);
    try {
      // Sıkıştırma + R2 PUT aşaması 3'lü eşzamanlı yürür (gecikmeyi düşürür);
      // sıra numarası tutarlılığı için ilana bağlama sıralı yapılır.
      const keys: string[] = new Array(list.length);
      const CONCURRENCY = 3;
      let next = 0;
      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, list.length) }, async () => {
          while (next < list.length) {
            const i = next++;
            keys[i] = await uploadToR2(list[i]);
          }
        }),
      );

      for (const key of keys) {
        const reg = await fetch(`/api/listings/${listingId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        });
        if (!reg.ok) throw new Error("Medya kaydedilemedi.");
        const data = await reg.json();
        setMedia(data.media);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yükleme başarısız.");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDelete(mediaId: string) {
    if (!confirm("Bu fotoğrafı kaldırmak istiyor musunuz?")) return;
    const prev = media;
    setDeletingId(mediaId);
    setError(null);
    setMedia((m) => m.filter((x) => x.id !== mediaId));
    const res = await fetch(`/api/listings/${listingId}/media`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId }),
    });
    setDeletingId(null);
    if (!res.ok) {
      setMedia(prev);
      setError("Fotoğraf silinemedi.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {media.map((m, i) => (
          <div
            key={m.id}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-ink/[0.05]"
          >
            <Image
              src={m.thumbUrl ?? m.url}
              alt=""
              fill
              sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="pointer-events-none object-cover"
            />
            {i === 0 && (
              <span className="absolute left-2 top-2 z-10 rounded-md bg-ink/65 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-white">
                Kapak
              </span>
            )}
            <button
              type="button"
              onClick={() => handleDelete(m.id)}
              disabled={deletingId === m.id}
              className="absolute right-2 top-2 z-20 flex min-h-11 touch-manipulation items-center justify-center gap-1.5 rounded-lg bg-white px-3 text-rose-600 shadow-md ring-1 ring-ink/10 active:scale-95 disabled:opacity-60 max-sm:bottom-2 max-sm:left-2 max-sm:right-2 max-sm:top-auto max-sm:w-auto max-sm:justify-center max-sm:bg-white/95 max-sm:py-2.5 max-sm:backdrop-blur-sm sm:min-h-9 sm:min-w-9 sm:px-2.5"
              aria-label="Fotoğrafı kaldır"
            >
              {deletingId === m.id ? (
                <Loader2 size={16} className="animate-spin shrink-0" aria-hidden />
              ) : (
                <Trash2 size={16} aria-hidden className="shrink-0" />
              )}
              <span className="text-[12px] font-semibold sm:text-[11px]">
                {deletingId === m.id ? "Kaldırılıyor…" : "Kaldır"}
              </span>
            </button>
          </div>
        ))}

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/25 text-ink/45 transition-colors hover:border-brand-500 hover:text-brand-600 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          {uploading ? (
            <Loader2 size={22} className="animate-spin" />
          ) : (
            <ImagePlus size={22} />
          )}
          <span className="text-xs font-medium">
            {uploading ? "Yükleniyor…" : "Fotoğraf ekle"}
          </span>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600">
          {error}
        </p>
      )}
      <p className="text-xs text-ink/45">
        JPEG, PNG veya WebP. Dosyalar doğrudan Cloudflare R2&apos;ye yüklenir.
        {media.length > 0 && (
          <span className="mt-1 block text-ink/55 sm:hidden">
            Fotoğrafı silmek için alttaki <strong className="font-semibold">Kaldır</strong> düğmesine dokunun.
          </span>
        )}
      </p>
    </div>
  );
}
