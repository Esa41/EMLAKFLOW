import sharp from "sharp";
import { getObjectBuffer, putObject, publicUrl } from "./r2";

/**
 * Sunucu tarafı görsel optimizasyonu (sharp).
 * Orijinal dosya R2'de kalır (yüksek çözünürlük / lightbox), yanına iki
 * optimize WebP varyantı üretilir:
 *   - thumb: 400px  → küçük önizleme, panel ızgarası
 *   - card:  960px  → vitrin kartları, benzer ilanlar
 * Varyant üretimi best-effort'tur: hata olursa yükleme akışı bozulmaz,
 * UI `thumbUrl/cardUrl ?? url` ile orijinale düşer.
 */

const VARIANTS = [
  { suffix: "thumb", width: 400, quality: 76 },
  { suffix: "card", width: 960, quality: 82 },
] as const;

export interface ImageVariants {
  thumbUrl: string;
  cardUrl: string;
  width: number | null;
  height: number | null;
}

export async function processListingImage(key: string): Promise<ImageVariants> {
  const original = await getObjectBuffer(key);
  const img = sharp(original, { failOn: "none" }).rotate(); // EXIF yönünü düzelt
  const meta = await img.metadata();

  const base = key.replace(/\.[^.]+$/, "");
  const buffers = await Promise.all(
    VARIANTS.map((v) =>
      img
        .clone()
        .resize({ width: v.width, withoutEnlargement: true })
        .webp({ quality: v.quality })
        .toBuffer(),
    ),
  );

  const keys = VARIANTS.map((v) => `${base}_${v.suffix}.webp`);
  await Promise.all(
    keys.map((k, i) => putObject(k, buffers[i], "image/webp")),
  );

  return {
    thumbUrl: publicUrl(keys[0]),
    cardUrl: publicUrl(keys[1]),
    width: meta.width ?? null,
    height: meta.height ?? null,
  };
}

/** Bir medya kaydının R2'deki tüm nesnelerini (orijinal + varyantlar) siler. */
export function variantKeys(key: string): string[] {
  const base = key.replace(/\.[^.]+$/, "");
  return VARIANTS.map((v) => `${base}_${v.suffix}.webp`);
}
