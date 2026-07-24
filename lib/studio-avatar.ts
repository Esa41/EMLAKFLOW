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
  /** false → UI'da "Yakında" (portre + ses hazır olunca açılır). */
  available: boolean;
  /** Tutarlı karakter portresi — Fal görüntü modeline gider. */
  portraitPrompt: string;
  /** Persona sesi için .env değişkeni — boşsa ELEVENLABS_VOICE_ID kullanılır. */
  voiceEnvVar: string;
  /**
   * Portrenin R2'deki SABİT anahtarı — bir kez üretilir
   * (scripts/generate-avatar-portraits.ts), tüm kliplere kimlik kaynağıdır.
   */
  portraitR2Key: string;
  /** Stinger (detay/siluet) prompt'larında geçen özne tarifi. */
  outfitEn: string;
};

export const AVATAR_PERSONAS: AvatarPersona[] = [
  {
    key: "elif",
    label: "Elif",
    desc: "Sıcak ve profesyonel — konut ilanları için önerilen sunucu.",
    available: false,
    portraitPrompt:
      "Cinematic portrait of a professional Turkish real estate presenter, " +
      "woman in her early 30s, shoulder-length dark brown hair in an elegant " +
      "low bun, warm confident smile, wearing a tailored dark blazer over a " +
      "cream silk blouse with a small gold brooch, seated at a sleek " +
      "executive desk in a luxury modern real estate office at dusk, warm " +
      "key light from a brass desk lamp, soft rim light, dark wood paneling " +
      "softly blurred in the background, shallow depth of field, warm " +
      "dramatic color grade, photorealistic, front-facing medium shot, " +
      "looking directly at the camera, natural skin texture, 4K",
    voiceEnvVar: "ELEVENLABS_VOICE_ELIF",
    portraitR2Key: "studio/avatars/elif.png",
    outfitEn:
      "an elegant woman in a tailored dark blazer over a cream silk blouse " +
      "with a small gold brooch",
  },
  {
    key: "deniz",
    label: "Deniz",
    desc: "Genç ve enerjik — Reels/TikTok temposu için.",
    available: false,
    portraitPrompt:
      "Cinematic portrait of an energetic Turkish social media presenter, " +
      "woman in her mid 20s, long chestnut hair, bright friendly smile, " +
      "wearing a chic ivory structured jacket with a small gold pin, " +
      "standing in a bright modern penthouse living room at golden hour, " +
      "floor-to-ceiling windows with warm sunlight and a soft city view " +
      "blurred behind, gentle lens flare, shallow depth of field, vibrant " +
      "warm color grade, photorealistic, front-facing medium shot, looking " +
      "directly at the camera, natural skin texture, 4K",
    voiceEnvVar: "ELEVENLABS_VOICE_DENIZ",
    portraitR2Key: "studio/avatars/deniz.png",
    outfitEn: "a young woman in a chic ivory structured jacket with a small gold pin",
  },
  {
    key: "kerem",
    label: "Kerem",
    desc: "Olgun ve güven veren — lüks ve yatırım ilanları için.",
    available: false,
    portraitPrompt:
      "Cinematic portrait of a distinguished Turkish real estate presenter, " +
      "man in his early 40s, short dark hair with subtle grey at the " +
      "temples, trustworthy calm smile, wearing a tailored navy suit with a " +
      "small gold lapel pin, no tie, seated in a dark luxury executive " +
      "office with walnut wood paneling and warm brass accent lighting, " +
      "moody low-key cinematic lighting with a soft rim light, shallow " +
      "depth of field, photorealistic, front-facing medium shot, looking " +
      "directly at the camera, natural skin texture, 4K",
    voiceEnvVar: "ELEVENLABS_VOICE_KEREM",
    portraitR2Key: "studio/avatars/kerem.png",
    outfitEn: "a distinguished man in a tailored navy suit with a small gold lapel pin",
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
// Kling v2'de video süresi = ses süresi — karakter bütçesi aynı zamanda
// klip maliyetinin tavanıdır.

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

// ── Sinematik kurgu sabitleri ──

/**
 * Tam ekran hook açılışı: sunucu ilk saniyelerde tam ekran konuşur,
 * sonra köşe penceresine (PiP) küçülür ve ilan sahneleri akar.
 */
export const AVATAR_INTRO_SEC = 3.5;

/** Hook tipografisinin varsayılan rengi — ofis marka rengi yoksa. */
export const HOOK_DEFAULT_COLOR = "#dc2626";

// ── Persona stinger'ları — tek seferlik sinematik ara klipler ──
// Her persona için bir kez üretilir (generate-avatar-portraits.ts),
// sonra TÜM videolarda bedavaya yeniden kullanılır:
//   detail : ceket/rozet yakın plan (gelecekte açılış b-roll'u)
//   pose   : siluet pozu — kurguda kapanış kartından önceki marka sahnesi

export type AvatarStingerKey = "detail" | "pose";

export const AVATAR_STINGERS: {
  key: AvatarStingerKey;
  label: string;
  imagePrompt: (p: AvatarPersona) => string;
  motionPrompt: string;
}[] = [
  {
    key: "detail",
    label: "Detay çekimi",
    imagePrompt: (p) =>
      `cinematic close-up detail shot of ${p.outfitEn}, focus on the jacket ` +
      "lapel and the small gold pin, one hand elegantly adjusting the lapel, " +
      "face not visible, luxury office bokeh background, warm dramatic " +
      "lighting, shallow depth of field, photorealistic, 4K",
    motionPrompt:
      "slow cinematic push-in, subtle natural hand movement, shallow depth " +
      "of field, steady camera",
  },
  {
    key: "pose",
    label: "Siluet pozu",
    imagePrompt: (p) =>
      `stylized dark silhouette of ${p.outfitEn}, standing confidently with ` +
      "arms crossed, backlit against a bright seamless studio background, " +
      "strong rim light, minimalist high-fashion editorial look, " +
      "photorealistic, 4K",
    motionPrompt:
      "very slow push-in, subtle breathing motion, fabric moving gently, " +
      "steady camera",
  },
];

export function stingerR2Key(
  personaKey: string,
  stingerKey: AvatarStingerKey,
): string {
  return `studio/avatars/${personaKey}-stinger-${stingerKey}.mp4`;
}

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
 * Kredi bedeli — birim: 1 tam video = 100 kredi (plans-config).
 * 30 sn konuşan klip Kling v2 standard'da ≈ $1.69 (~₺85, kur ₺50);
 * 60 kredi = ₺270 satış değeri → marj korunur.
 */
export const AVATAR_CREDIT_COST = 60;
