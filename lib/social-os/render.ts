/**
 * Sosyal OS — şablon render motoru (LLM'siz).
 *
 * `generateListingContent` (GPT çağrısı) yerine geçer ve AYNI `GeneratedAsset`
 * sözleşmesini döndürür — böylece ContentAsset kaydı, takvim, panel UI ve
 * Stüdyo köprüsü hiç değişmeden çalışır.
 *
 * Ek olarak `sourceTemplate` döner: müşteri şablonun ham hâlini görüp kendi
 * içeriğini aynı tarzda üretebilsin diye.
 */

import type { FormatKey, ToneKey } from "./catalog";
import {
  TONE_VOICE,
  PACK_ANGLE,
  derive,
  buildHashtags,
  buildImagePrompt,
  buildVideoPrompt,
  locative,
  type ListingInput,
  type Derived,
} from "./templates";

export type RenderedAsset = {
  headline: string;
  caption: string;
  cta: string;
  emojiStrategy: string;
  hashtags: string[];
  seoKeywords: string[];
  imagePrompt: string;
  videoPrompt: string;
  thumbnailIdea: string;
  carouselSlides: Array<{ order: number; text: string; visual: string }>;
  storySequence: Array<{ order: number; text: string; durationSec: number }>;
  postingRecommendation: {
    platforms: string[];
    bestTimesLocal: string[];
    reason: string;
  };
  /** Müşterinin kopyalayıp kendi içeriğini üretebilmesi için ham şablon */
  sourceTemplate: string;
};

const PLATFORM_REC: Record<
  FormatKey,
  { platforms: string[]; times: string[]; reason: string }
> = {
  FEED_POST: {
    platforms: ["INSTAGRAM", "FACEBOOK"],
    times: ["12:30", "18:30", "20:00"],
    reason: "Öğle arası ve akşam eve dönüş saatleri feed'de en yoğun aralık.",
  },
  CAROUSEL: {
    platforms: ["INSTAGRAM", "FACEBOOK", "LINKEDIN"],
    times: ["13:00", "19:00"],
    reason: "Karusel kaydırma süresi ister; kullanıcının acelesi olmadığı saat iyi.",
  },
  STORY: {
    platforms: ["INSTAGRAM", "FACEBOOK"],
    times: ["09:00", "17:30", "21:00"],
    reason: "Story 24 saat yaşar; sabah ve akşam iki ayrı zirveyi yakalar.",
  },
  REEL: {
    platforms: ["INSTAGRAM", "TIKTOK", "YOUTUBE"],
    times: ["18:00", "21:00"],
    reason: "Kısa video keşfet trafiği akşam saatlerinde belirgin biçimde artar.",
  },
  LINKEDIN_POST: {
    platforms: ["LINKEDIN"],
    times: ["08:30", "12:00"],
    reason: "İş saatleri başı ve öğle molası B2B erişimin en yüksek olduğu aralık.",
  },
  GBP_POST: {
    platforms: ["GOOGLE_BUSINESS"],
    times: ["10:00"],
    reason: "Yerel aramalar mesai içinde yoğunlaşır; sabah yayın gün boyu görünür.",
  },
};

function emojiFor(tone: ToneKey, policy: string | null | undefined): string {
  if (policy === "none") return "";
  const set = TONE_VOICE[tone].emoji;
  return set[0] ?? "";
}

function stripForbidden(text: string, forbidden: string[]): string {
  let out = text;
  for (const f of forbidden) {
    if (!f.trim()) continue;
    out = out.replace(new RegExp(f.trim(), "gi"), "").replace(/\s{2,}/g, " ");
  }
  return out.trim();
}

/** Aynı ilan için art arda üretimde farklı varyant gelsin diye tohum */
function seedFrom(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function fillTokens(tpl: string, d: Derived): string {
  return tpl
    .replace(/\{yerDe\}/g, locative(d.yer)) // Türkçe bulunma eki: 'de/'da/'te/'ta
    .replace(/\{yer\}/g, d.yer)
    .replace(/\{tip\}/g, d.tip)
    .replace(/\{sehir\}/g, d.sehir)
    .replace(/\{ilce\}/g, d.ilce)
    .trim();
}

/** Boş parçaları at, kalanları tek boş satırla birleştir. */
function block(parts: Array<string | false | null | undefined>): string {
  return parts
    .filter((x): x is string => typeof x === "string" && x.trim() !== "")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function renderListingContent(input: {
  listing: ListingInput;
  format: FormatKey | string;
  tone: ToneKey | string;
  packId?: string | null;
  brandVoice?: string | null;
  emojiPolicy?: string | null;
  forbidden?: string[];
  /** Varyant çeşitliliği için — verilmezse ilan+format+ton'dan türetilir */
  variantSeed?: number;
}): RenderedAsset {
  const l = input.listing;
  const format = (input.format as FormatKey) in PLATFORM_REC
    ? (input.format as FormatKey)
    : "FEED_POST";
  const tone = (input.tone as ToneKey) in TONE_VOICE
    ? (input.tone as ToneKey)
    : "professional";

  const d = derive(l);
  const v = TONE_VOICE[tone];
  const angle = input.packId ? PACK_ANGLE[input.packId] : undefined;
  const seed =
    input.variantSeed ?? seedFrom(`${l.title}|${format}|${tone}|${Date.now() >> 22}`);

  const openerPool = angle?.openers ?? v.openers;
  const opener = fillTokens(openerPool[seed % openerPool.length], d);
  const bridge = v.bridges[seed % v.bridges.length];
  const ctaPool = angle?.ctas ?? v.ctas;
  const cta = ctaPool[seed % ctaPool.length];
  const note = angle?.note?.[seed % angle.note.length] ?? "";
  const emoji = emojiFor(tone, input.emojiPolicy);

  /* Künye satırı: tek kalan bilgi ilçeyse ve açılış zaten orayı söylüyorsa
     tekrar etme ("Başiskele — … / Detaylar: Başiskele" gibi). */
  const specsRedundant = d.specItems.length <= 1 && d.yer === d.ilce;
  const specsLine =
    d.specs && !specsRedundant ? `${bridge} ${d.specs}`.trim() : "";

  const hashtags = buildHashtags(l, d, input.packId ?? null);
  const priceLine = d.fiyat ? `${emoji ? emoji + " " : ""}${d.fiyat}` : "";

  /* ── Caption — format iskeleti ── */
  let caption: string;
  let headline: string;
  let sourceTemplate: string;

  if (format === "LINKEDIN_POST") {
    headline = opener;
    caption = [
      opener,
      "",
      specsLine,
      d.features.length ? d.features.map((f) => `• ${f}`).join("\n") : "",
      priceLine,
      note,
      "",
      cta,
    ]
      .filter(Boolean)
      .join("\n");
    sourceTemplate =
      "{açılış}\n\n{köprü} {oda · m² · ilçe}\n{özellik listesi}\n{fiyat}\n{paket notu}\n\n{CTA}";
  } else if (format === "GBP_POST") {
    headline = opener;
    caption = [opener, specsRedundant ? "" : d.specs, priceLine, cta].filter((x) => x && x.trim()).join(" ");
    sourceTemplate = "{açılış} {oda · m² · ilçe} {fiyat} {CTA}";
  } else if (format === "STORY") {
    headline = opener;
    caption = block([opener, specsRedundant ? null : d.specs, priceLine, cta]);
    sourceTemplate = "{açılış}\n{künye}\n{fiyat}\n{CTA}";
  } else {
    // FEED_POST · CAROUSEL · REEL ortak caption iskeleti
    headline = opener;
    caption = [
      opener,
      block([
        specsLine,
        d.features.length
          ? d.features.slice(0, 4).map((f) => `• ${f}`).join("\n")
          : null,
        priceLine,
        note,
      ]),
      cta,
      hashtags.map((h) => `#${h}`).join(" "),
    ]
      .filter((x) => x.trim() !== "")
      .join("\n\n");
    sourceTemplate =
      "{açılış}\n\n{köprü} {oda · m² · ilçe}\n{özellikler}\n{fiyat}\n{paket notu}\n\n{CTA}\n\n{hashtagler}";
  }

  /* ── Karusel slaytları — ilan alanlarından türetilir ── */
  const carouselSlides =
    format === "CAROUSEL"
      ? [
          { order: 1, text: opener, visual: "Dış cephe veya en güçlü geniş açı kare" },
          ...(d.specItems.length
            ? [{ order: 2, text: d.specItems.join(" · "), visual: "Salon geniş açı" }]
            : []),
          ...d.features.slice(0, 4).map((f, i) => ({
            order: i + 3,
            text: f,
            visual: `${f} detayını gösteren kare`,
          })),
          {
            order: d.features.slice(0, 4).length + 3,
            text: `${d.fiyat}\n${cta}`,
            visual: "Ofis logosu + iletişim kapanış karesi",
          },
        ]
      : [];

  /* ── Story kareleri ── */
  const storySequence =
    format === "STORY"
      ? [
          { order: 1, text: opener, durationSec: 5 },
          ...(d.specs ? [{ order: 2, text: d.specs, durationSec: 5 }] : []),
          ...(d.fiyat ? [{ order: 3, text: d.fiyat, durationSec: 4 }] : []),
          { order: 4, text: cta, durationSec: 6 },
        ].map((s, i) => ({ ...s, order: i + 1 }))
      : [];

  const rec = PLATFORM_REC[format];

  const result: RenderedAsset = {
    headline: stripForbidden(headline, input.forbidden ?? []),
    caption: stripForbidden(caption, input.forbidden ?? []),
    cta,
    emojiStrategy:
      input.emojiPolicy === "none"
        ? "Emoji kullanılmadı (marka politikası)."
        : `Ton "${tone}" için ölçülü emoji: ${v.emoji.join(" ") || "yok"}`,
    hashtags,
    seoKeywords: [
      `${d.ilce} ${l.purpose === "RENT" ? "kiralık" : "satılık"} ${d.tip}`,
      `${d.sehir} ${d.tip}`,
      `${d.yer} emlak`,
    ],
    imagePrompt: buildImagePrompt(l, d, tone),
    videoPrompt: buildVideoPrompt(d, tone),
    thumbnailIdea:
      format === "REEL"
        ? `Kanca metni: "${v.hooks[seed % v.hooks.length]}" — en etkileyici kare üzerine büyük tipografi.`
        : "İlanın en güçlü fotoğrafı, sol üstte ofis logosu.",
    carouselSlides,
    storySequence,
    postingRecommendation: {
      platforms: rec.platforms,
      bestTimesLocal: rec.times,
      reason: rec.reason,
    },
    sourceTemplate,
  };

  return result;
}
