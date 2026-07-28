import { isPremium } from "./plans-config";

/**
 * Vitrin temaları (Faz 2 — bkz. docs/vitrin-evrensel-tasarim-plani.md).
 *
 * TASARIM KARARI: her tema AYNI bileşenleri kullanır; değişen düzen ve
 * yoğunluktur. Böylece yeni bir tema eklemek yeni bir sayfa yazmak değil,
 * bir düzen varyantı tanımlamaktır — bakım yükü sabit kalır.
 *
 * Görsel farklar CSS değişkenlerinden gelir: `[data-showcase-theme]` altında
 * globals.css'te tanımlı `--sc-*` kümesi (ızgara sütun sayısı, fotoğraf oranı,
 * köşe yarıçapı, başlık ölçeği, gölge, hero yüksekliği, bölüm boşluğu).
 * Bileşenler `sc-grid / sc-card / sc-media / sc-title / sc-hero` sınıflarını
 * taşır ve tema ADINI bilmez.
 */

export type ShowcaseHeroLayout = "split" | "editorial" | "gallery" | "compact";

export type ShowcaseTheme = {
  key: string;
  label: string;
  /** Ayarlar'da gösterilen bir cümlelik tarif */
  desc: string;
  /** Kime uygun — seçim yaparken yön verir */
  bestFor: string;
  /** Somut olarak NE değişiyor — seçim ekranında tek satır olarak basılır */
  changes: string;
  hero: ShowcaseHeroLayout;
  /** Ücretsiz/Pro planlarda kilitli mi */
  premium: boolean;
};

export const SHOWCASE_THEMES: ShowcaseTheme[] = [
  {
    key: "classic",
    label: "Klasik",
    desc: "Dengeli düzen: üç sütunluk ızgara, 4:3 fotoğraf, yumuşak köşe. Her portföyde çalışır.",
    bestFor: "Karma portföy · varsayılan",
    changes: "3 sütun · 4:3 foto · 20px köşe · tam ekran hero",
    hero: "split",
    premium: false,
  },
  {
    key: "editorial",
    label: "Editoryal",
    desc: "Dev tipografi ve keskin köşeler; kartlar iki sütuna büyür, aralar genişler. Az ilanla da dolu görünür.",
    bestFor: "Butik ofis · az ilan",
    changes: "2 geniş sütun · 3:2 foto · keskin köşe · %18 büyük başlık",
    hero: "editorial",
    premium: true,
  },
  {
    key: "gallery",
    label: "Galeri",
    desc: "Kare fotoğraflar, çok yumuşak köşeler ve yükseltilmiş kartlar. Metin geri çekilir, görsel öne çıkar.",
    bestFor: "Villa · lüks segment",
    changes: "Kare (1:1) foto · 28px köşe · gölgeli kart · küçük başlık",
    hero: "gallery",
    premium: true,
  },
  {
    key: "minimal",
    label: "Minimal",
    desc: "Süs yok: dört sütunluk sıkı ızgara, köşesiz kart, alçak hero. Çok ilanı hızlı taratır.",
    bestFor: "Ticari · kurumsal · geniş portföy",
    changes: "4 sıkı sütun · 16:9 foto · köşesiz · alçak hero",
    hero: "compact",
    premium: true,
  },
];

export const DEFAULT_SHOWCASE_THEME = "classic";

export function getShowcaseTheme(key: string | null | undefined): ShowcaseTheme {
  return (
    SHOWCASE_THEMES.find((t) => t.key === key) ??
    SHOWCASE_THEMES.find((t) => t.key === DEFAULT_SHOWCASE_THEME)!
  );
}

/**
 * Plan kapısı — SUNUCU TARAFINDA uygulanır.
 * Ofis Premium'dan düşerse (ödeme durursa, plan değişirse) vitrini kendiliğinden
 * Klasik'e döner; veritabanındaki seçim silinmez, yeniden Premium olunca
 * eski teması geri gelir.
 */
export function resolveShowcaseTheme(
  key: string | null | undefined,
  plan: string | null | undefined,
): ShowcaseTheme {
  const theme = getShowcaseTheme(key);
  if (theme.premium && !isPremium(plan)) {
    return getShowcaseTheme(DEFAULT_SHOWCASE_THEME);
  }
  return theme;
}
