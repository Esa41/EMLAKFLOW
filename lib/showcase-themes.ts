import { isPremium } from "./plans-config";

/**
 * Vitrin temaları (Faz 2 — bkz. docs/vitrin-evrensel-tasarim-plani.md).
 *
 * TASARIM KARARI: her tema AYNI bileşenleri kullanır; değişen düzen ve
 * yoğunluktur. Böylece yeni bir tema eklemek yeni bir sayfa yazmak değil,
 * bir düzen varyantı tanımlamaktır — bakım yükü sabit kalır.
 *
 * Görsel farklar iki kanaldan uygulanır:
 *  1. `hero` — hero bileşeninin düzen varyantı (React tarafında dallanır)
 *  2. CSS değişkenleri — `[data-showcase-theme]` altında globals.css'te
 *     tanımlı; köşe yarıçapı, tipografi ölçeği, kart oranı, yoğunluk.
 */

export type ShowcaseHeroLayout = "split" | "editorial" | "gallery" | "compact";

export type ShowcaseTheme = {
  key: string;
  label: string;
  /** Ayarlar'da gösterilen bir cümlelik tarif */
  desc: string;
  /** Kime uygun — seçim yaparken yön verir */
  bestFor: string;
  hero: ShowcaseHeroLayout;
  /** Ücretsiz/Pro planlarda kilitli mi */
  premium: boolean;
};

export const SHOWCASE_THEMES: ShowcaseTheme[] = [
  {
    key: "classic",
    label: "Klasik",
    desc: "Kimlik solda, öne çıkan mülk sağda. Dengeli ve her portföyde çalışır.",
    bestFor: "Karma portföy · varsayılan",
    hero: "split",
    premium: false,
  },
  {
    key: "editorial",
    label: "Editoryal",
    desc: "Dev tipografi öne çıkar, fotoğraf ikincil kalır. Az fotoğrafla da dolu görünür.",
    bestFor: "Butik ofis · az fotoğraf",
    hero: "editorial",
    premium: true,
  },
  {
    key: "gallery",
    label: "Galeri",
    desc: "Fotoğraf büyür, metin geri çekilir. Görseli güçlü portföylerde etkileyici.",
    bestFor: "Villa · lüks segment",
    hero: "gallery",
    premium: true,
  },
  {
    key: "minimal",
    label: "Minimal",
    desc: "Sıkı satırlar, süs yok. Çok ilanı hızlı taratır.",
    bestFor: "Ticari · kurumsal · geniş portföy",
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
