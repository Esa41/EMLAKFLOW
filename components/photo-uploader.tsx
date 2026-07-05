"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2, Loader2 } from "lucide-react";

export interface MediaItem {
  id: string;
  url: string;
  key: string;
}

/**
 * Yükleme öncesi tarayıcıda sıkıştırma: en uzun kenar 1920px'e indirilir,
 * WebP'ye çevrilir (kalite 0.82). Başarısız olursa orijinal dosya kullanılır —
 * hiçbir zaman yüklemeyi bloklamaz. Sunucu tarafına dokunmadan (R2 doğrudan
 * PUT akışı korunarak) depolama ve indirme boyutunu ciddi ölçüde düşürür.
 */
async function compressImage(
  file: File,
  maxDim = 1920,
  quality = 0.82,
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
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);

    for (const rawFile of Array.from(files)) {
      try {
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

        // 3. Medyayı ilana bağla
        const reg = await fetch(`/api/listings/${listingId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        });
        if (!reg.ok) throw new Error("Medya kaydedilemedi.");
        const data = await reg.json();
        setMedia(data.media);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Yükleme başarısız.");
        break;
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDelete(mediaId: string) {
    const prev = media;
    setMedia((m) => m.filter((x) => x.id !== mediaId));
    const res = await fetch(`/api/listings/${listingId}/media`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId }),
    });
    if (!res.ok) {
      setMedia(prev); // geri al
      setError("Fotoğraf silinemedi.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {media.map((m) => (
          <div
            key={m.id}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-ink/[0.05]"
          >
            <Image
              src={m.url}
              alt=""
              fill
              sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover"
            />
            <button
              onClick={() => handleDelete(m.id)}
              className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-rose-500 opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400"
              aria-label="Fotoğrafı sil"
            >
              <Trash2 size={15} />
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
        JPEG, PNG veya WebP. Dosyalar doğrudan Cloudflare R2'ye yüklenir.
      </p>
    </div>
  );
}
