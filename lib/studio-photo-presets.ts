/**
 * Foto iyileştirme şablonları (preset) — tek kaynak.
 * "upscale" = mevcut Fal.ai Clarity upscaler (aktif).
 * "edit"    = görsel-düzenleme modeli gerektirir (gökyüzü/dekor/dağınıklık) — YAKINDA.
 * İstemci-güvenli: server-only import yok (hem UI hem action kullanır).
 */

export type PhotoPresetKind = "upscale" | "edit";

export type PhotoPreset = {
  key: string;
  label: string;
  desc: string;
  kind: PhotoPresetKind;
  /** false → UI'da "Yakında" (edit modeli henüz bağlı değil). */
  available: boolean;
  /** edit modeline gidecek talimat (aktif olduğunda kullanılır). */
  prompt?: string;
  credits: number;
};

export const PHOTO_PRESETS: PhotoPreset[] = [
  {
    key: "netlik-isik",
    label: "Netlik & ışık",
    desc: "Bulanıklığı giderir, ışığı ve detayı yükseltir.",
    kind: "upscale",
    available: true,
    credits: 1,
  },
  {
    key: "gokyuzu",
    label: "Gökyüzü değiştir",
    desc: "Gri/soluk gökyüzünü berrak maviye çevirir.",
    kind: "edit",
    available: false,
    prompt:
      "replace only the sky with a clear, natural blue sky with soft clouds; keep the building, foreground and everything else pixel-identical",
    credits: 1,
  },
  {
    key: "sanal-dekor",
    label: "Sanal dekor",
    desc: "Boş odayı şık, gerçekçi mobilyayla döşer (staging).",
    kind: "edit",
    available: false,
    prompt:
      "virtually stage this empty room with tasteful modern furniture appropriate to the space, photorealistic lighting, keep walls/windows/floor unchanged",
    credits: 2,
  },
  {
    key: "daginiklik-gider",
    label: "Dağınıklık gider",
    desc: "Fazla eşyayı ve dağınıklığı temizler.",
    kind: "edit",
    available: false,
    prompt:
      "remove clutter, cables, personal items and mess; keep the room clean, tidy and photorealistic without changing the architecture",
    credits: 1,
  },
];

export function getPhotoPreset(key: string | null | undefined): PhotoPreset | undefined {
  return PHOTO_PRESETS.find((p) => p.key === key);
}

export const DEFAULT_PHOTO_PRESET = "netlik-isik";
