// ── Vitrin Sunucusu — AI avatar sunucu omurgası (tek kaynak) ──
// Premium emlakçının ilanını TUTARLI yüzlü bir AI sunucu tanıtır.
// Boru hattı (wiring ayrı adım):
//   1) Persona portresi  → Fal görüntü (buildPersonaPortraitPrompt)
//   2) Senaryo           → buildPresenterScript (deterministik, LLM'siz)
//   3) Seslendirme       → ElevenLabs (persona.voiceEnvVar ile ses ataması)
//   4) Konuşan klip      → Fal avatar modeli (generateAvatarVideo — registry)
//   5) Kurgu             → Shotstack: ilan sahneleri + sunucu PiP + AI ibaresi
// İstemci-güvenli: server-only import yok (hem UI hem action kullanır).

import {
  findNegativeTermViolations,
  type VoiceListingInput,
} from "@/lib/studio-prompts";

// ── Personalar ──
// Aynı persona her videoda AYNI yüzle görünür — portre bir kez üretilir,
// R2'de saklanır ve tüm avatar kliplerine kaynak görsel olarak verilir.
// Portre prompt'ları "karakter çapası" içerir (saç/yaş/giyim sabit) ki
// yeniden üretimde de aynı kişi çıksın.

export type AvatarPersonaKey = "elif" | "deniz" | "kerem";

export type AvatarPersona = {
  key: AvatarPersonaKey;
  label: string;
  desc: string;
  /** false → UI'da "Yakında" (avatar modeli bağlanınca açılır). */
  available: boolean;
  /** Tutarlı karakter portresi — Fal görüntü modeline gider. */
  portraitPrompt: string;
  /** Persona sesi için .env değişkeni — boşsa ELEVENLABS_VOICE_ID kullanılır. */
  voiceEnvVar: string;
};

export const AVATAR_PERSONAS: AvatarPersona[] = [
  {
    key: "elif",
    label: "Elif",
    desc: "Sıcak ve profesyonel — konut ilanları için önerilen sunucu.",
    available: false,
    portraitPrompt:
      "Professional Turkish real estate presenter, woman in her early 30s, " +
      "shoulder-length dark brown hair, warm confident smile, wearing a smart " +
      "tailored dark blazer over a cream blouse, studio lighting, clean soft " +
      "neutral background, photorealistic portrait, front-facing medium shot, " +
      "looking directly at the camera, natural skin texture, 4K",
    voiceEnvVar: "ELEVENLABS_VOICE_ELIF",
  },
  {
    key: "deniz",
    label: "Deniz",
    desc: "Genç ve enerjik — Reels/TikTok temposu için.",
    available: false,
    portraitPrompt:
      "Energetic Turkish social media presenter, woman in her mid 20s, " +
      "long chestnut hair, bright friendly smile, modern smart-casual outfit " +
      "with a light jacket, studio lighting, clean soft neutral background, " +
      "photorealistic portrait, front-facing medium shot, looking directly " +
      "at the camera, natural skin texture, 4K",
    voiceEnvVar: "ELEVENLABS_VOICE_DENIZ",
  },
  {
    key: "kerem",
    label: "Kerem",
    desc: "Olgun ve güven veren — lüks ve yatırım ilanları için.",
    available: false,
    portraitPrompt:
      "Distinguished Turkish real estate presenter, man in his early 40s, " +
      "short dark hair with subtle grey at the temples, trustworthy calm " +
      "smile, wearing a tailored navy suit without a tie, studio lighting, " +
      "clean soft neutral background, photorealistic portrait, front-facing " +
      "medium shot, looking directly at the camera, natural skin texture, 4K",
    voiceEnvVar: "ELEVENLABS_VOICE_KEREM",
  },
];

export const DEFAULT_AVATAR_PERSONA: AvatarPersonaKey = "elif";

export function getAvatarPersona(
  key: string | null | undefined,
): AvatarPersona | undefined {
  return AVATAR_PERSONAS.find((p) => p.key === key);
}

/**
 * Portre prompt'u — marka rengi verilirse kıyafete vurgu olarak eklenir
 * (hex modellerce kabaca anlaşılır; ana kimlik çapaları sabit kalır).
 */
export function buildPersonaPortraitPrompt(
  persona: AvatarPersona,
  brandColorHex?: string | null,
): string {
  const brand = brandColorHex
    ? `, outfit accent color ${brandColorHex}`
    : "";
  return `${persona.portraitPrompt}${brand}`;
}

export const PORTRAIT_NEGATIVE_PROMPT =
  "deformed hands, extra fingers, asymmetric eyes, plastic skin, cartoon, " +
  "illustration, anime, text, captions, watermark, logo, blurry, low quality";

// ── Konuşan klip prompt'u ──
// Avatar modelleri (görsel + ses → dudak senkronlu video) çoğunlukla
// prompt'suz çalışır; prompt kabul edenlerde bu çapa kimlik kaymasını ve
// abartılı mimikleri bastırır.

export const AVATAR_CLIP_PROMPT =
  "presenter speaking naturally to the camera, subtle hand gestures, gentle " +
  "head movement, steady eye contact, warm professional delivery, static " +
  "camera, consistent identity, clean background";

export const AVATAR_CLIP_NEGATIVE_PROMPT =
  "distorted face, changing identity, morphing facial features, extra " +
  "fingers, deformed hands, exaggerated expressions, camera movement, " +
  "text, captions, watermark";

// ── Sunucu senaryosu ──
// buildVoiceoverText'in sunucu formatı: birinci ağızdan, kancayla açar,
// SADECE ilan verisini kullanır (uydurma özellik = güven kaybı + yasal risk).
// Hedef: ≤30 sn klip; Türkçe seslendirme ~14 karakter/sn → ~420 karakter.

export const PRESENTER_MAX_CLIP_SEC = 30;
const PRESENTER_MAX_CHARS = PRESENTER_MAX_CLIP_SEC * 14;

export function buildPresenterScript(
  listing: VoiceListingInput,
  negativeTerms: string[] = [],
): string {
  const location = [listing.neighborhood, listing.district, listing.city]
    .filter(Boolean)
    .join(", ");
  const action = listing.purpose === "RENT" ? "kiralık" : "satılık";

  const safeFeatures = (listing.features ?? []).filter(
    (f) => findNegativeTermViolations(f, negativeTerms).length === 0,
  );

  const parts: string[] = [];
  parts.push(`Bugün size ${location}'dan çok özel bir ${action} ilan tanıtacağım.`);
  if (listing.rooms && listing.grossArea) {
    parts.push(`${listing.rooms} planlı, tam ${listing.grossArea} metrekare.`);
  } else if (listing.rooms) {
    parts.push(`${listing.rooms} planlı, ferah bir yaşam alanı.`);
  } else if (listing.grossArea) {
    parts.push(`Toplam ${listing.grossArea} metrekare kullanım alanı var.`);
  }
  if (safeFeatures.length) {
    parts.push(`Üstelik ${safeFeatures.slice(0, 2).join(" ve ")} özellikli.`);
  }
  parts.push(`Fiyatı ${listing.price}.`);
  parts.push("Detaylar ve randevu için hemen bize ulaşın.");

  // Yasaklı kelime içeren orta cümleler düşer (ilk/son cümle güvenli kalıp)
  const safeParts = parts.filter(
    (p, i) =>
      i === 0 ||
      i === parts.length - 1 ||
      findNegativeTermViolations(p, negativeTerms).length === 0,
  );

  // Karakter bütçesini aşmayacak kadar cümle — ilk ve son her zaman kalır
  let text = safeParts[0];
  for (let i = 1; i < safeParts.length - 1; i++) {
    if (
      (text + " " + safeParts[i] + " " + safeParts[safeParts.length - 1]).length >
      PRESENTER_MAX_CHARS
    )
      break;
    text += " " + safeParts[i];
  }
  text += " " + safeParts[safeParts.length - 1];
  return text;
}

// ── AI şeffaflık ibaresi ──
// HER sunucu videosuna kurgu aşamasında basılır; kullanıcı KAPATAMAZ
// (overlay slotu değildir). Meta/Instagram AI içerik işaretlemesi + etik
// şart: izleyici gerçek bir insan izlediğini sanmamalı.

export const AI_DISCLOSURE_TEXT = "Bu video yapay zekâ ile üretilmiştir";

// ── Shotstack PiP yerleşimi ──
// Sunucu klibi ilan sahnelerinin üzerine köşe penceresi olarak biner.
// Değerler Shotstack clip alanlarıyla eşleşir (position/scale/offset).

export const AVATAR_PIP = {
  position: "bottomRight",
  scale: 0.34,
  offsetX: -0.03,
  offsetY: 0.04,
} as const;

/**
 * Kredi bedeli — FİYATLANDIRMA KARARI BEKLİYOR (REFERENCE_CREDIT_COST ile
 * aynı durum): avatar modeli liste fiyatı doğrulanınca netleşecek.
 * ~30 sn konuşan klip, Kling 5 sn klibin (~1 kredi) birkaç katı maliyette.
 */
export const AVATAR_CREDIT_COST = 3;
