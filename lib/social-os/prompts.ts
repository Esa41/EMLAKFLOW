/** Social OS — generation prompts (TR captions, EN visual prompts). */

export const CONTENT_JSON_CONTRACT = `{
  "headline": "string",
  "caption": "string",
  "cta": "string",
  "emojiStrategy": "string",
  "hashtags": ["string"],
  "seoKeywords": ["string"],
  "imagePrompt": {
    "midjourney": "string",
    "flux": "string",
    "imagen": "string",
    "gptImage": "string",
    "ideogram": "string"
  },
  "videoPrompt": "string",
  "thumbnailIdea": "string",
  "carouselSlides": [{"order": 1, "text": "string", "visual": "string"}],
  "storySequence": [{"order": 1, "text": "string", "durationSec": 5}],
  "postingRecommendation": {
    "platforms": ["INSTAGRAM"],
    "bestTimesLocal": ["18:30"],
    "reason": "string"
  }
}`;

export function buildSystemPrompt(input: {
  brandVoice?: string | null;
  tone: string;
  format: string;
  city?: string | null;
  emojiPolicy?: string | null;
  forbidden?: string[];
}): string {
  const forbidden =
    input.forbidden && input.forbidden.length > 0
      ? `Yasak ifadeler: ${input.forbidden.join(", ")}`
      : "";
  return `Sen Emlakflow Social OS içerik yazarısın. Türkiye emlak ofisleri için platforma uygun içerik üretirsin.

Kurallar:
- Yalnızca geçerli JSON döndür (markdown yok). Şema:
${CONTENT_JSON_CONTRACT}
- caption/headline/cta dili: Türkçe
- imagePrompt ve videoPrompt: İngilizce
- İlanda olmayan m², fiyat, ruhsat, konum uydurma
- Ton: ${input.tone}
- Format: ${input.format}
- Şehir bağlamı: ${input.city ?? "Türkiye"}
- Emoji politikası: ${input.emojiPolicy ?? "moderate"}
${input.brandVoice ? `- Marka sesi: ${input.brandVoice}` : ""}
${forbidden}
- CTA net olsun (vitrin, WhatsApp, özel tur, plan inceleme)
- Hashtag: marka + konum + niyet (satılık/kiralık); spam yok`;
}

export const TONE_OPTIONS = [
  { value: "luxury", label: "Lüks" },
  { value: "corporate", label: "Kurumsal" },
  { value: "friendly", label: "Samimi" },
  { value: "professional", label: "Profesyonel" },
  { value: "minimal", label: "Minimal" },
  { value: "emotional", label: "Duygusal" },
  { value: "urgent", label: "Acil" },
  { value: "premium", label: "Premium" },
  { value: "high_converting", label: "Yüksek dönüşüm" },
] as const;

export const FORMAT_OPTIONS = [
  { value: "FEED_POST", label: "Instagram / Facebook gönderi" },
  { value: "CAROUSEL", label: "Karusel" },
  { value: "STORY", label: "Story dizisi" },
  { value: "REEL", label: "Reel / Shorts" },
  { value: "LINKEDIN_POST", label: "LinkedIn" },
  { value: "GBP_POST", label: "Google İşletme" },
] as const;
