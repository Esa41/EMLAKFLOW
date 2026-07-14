// ── AI Stüdyo Hazır Şablonlar ──
// Kullanıcı konsept yerine ŞABLON seçer: şablon sahne reçetesini (oda sırası,
// kamera hareketi, süre), geçiş efektlerini, ekran yazısı slotlarını, müziği
// ve seslendirme tonunu belirler. Kullanıcı üzerinde manuel ince ayar yapar.
//
// Şablonlar kodda tanımlıdır; DB yalnızca templateKey + kullanıcı
// override'larını tutar. Eski projeler (templateKey=null) conceptKey
// üzerinden resolveTemplate ile aynı yoldan geçer (tek geri-uyum şimi).
//
// Kurgu iş bölümü: Kling sahneleri üretir (yazı/overlay YASAK —
// BASE_NEGATIVE_PROMPT), geçişler + ekran yazıları + müzik Shotstack
// birleştirme katmanında eklenir.

import {
  BASE_NEGATIVE_PROMPT,
  INTERIOR_TEMPLATE_ORDER,
  ROOMS,
  type RoomKey,
  type VideoConceptKey,
} from "@/lib/studio-prompts";
import type { MusicKey } from "@/lib/studio-music";

export type TemplateKey =
  | "fpv_tour"
  | "classic_interior"
  | "land_drone"
  | "social_promo";

/** Shotstack clip transition adları ile bire bir. */
export type TransitionKey =
  | "fade"
  | "zoom"
  | "wipeLeft"
  | "wipeRight"
  | "slideLeft"
  | "slideUp"
  | "carouselLeft"
  | "none";

export const TRANSITION_LABELS: Record<TransitionKey, string> = {
  fade: "Yumuşak Geçiş",
  zoom: "Zoom",
  wipeLeft: "Silme (Sola)",
  wipeRight: "Silme (Sağa)",
  slideLeft: "Kaydırma (Sola)",
  slideUp: "Kaydırma (Yukarı)",
  carouselLeft: "Dönme",
  none: "Kesme",
};

export type VoiceTone = "calm" | "energetic" | "informative";

export type OverlayStyleKey =
  | "bannerBottom"
  | "bigCenter"
  | "cardTopLeft"
  | "hook"
  | "cta";

export type OverlaySource =
  | "price"
  | "grossArea"
  | "location"
  | "rooms"
  | "adaParsel"
  | "custom";

/** Şablonun tanımladığı ekran yazısı slotu — ilan verisinden çözülür. */
export type OverlaySlotDef = {
  key: string; // "price" | "area" | "location" | "hook" | "cta"…
  label: string; // TR editör etiketi
  source: OverlaySource;
  /** Hangi sahnede görünür: "first" | "last" | sahne index'i | "all" */
  placement: "first" | "last" | "all" | number;
  startSec: number; // sahne içi başlangıç
  lengthSec: number;
  styleKey: OverlayStyleKey;
  /** source=custom için varsayılan metin */
  defaultText?: string;
};

/** DB'de StudioProject.overlayData olarak saklanan, kullanıcı düzenlenebilir hali. */
export type ResolvedOverlay = {
  key: string;
  label: string;
  text: string;
  enabled: boolean;
  placement: "first" | "last" | "all" | number;
  startSec: number;
  lengthSec: number;
  styleKey: OverlayStyleKey;
};

export type SceneSlotDef = {
  /** "Şablona göre sırala" + oda önerisi için ipucu */
  roomKeyHint?: RoomKey;
  /** Sahne index'i ile dönüşümlü kamera hareketleri — Kling prompt'una girer */
  motions: string[];
  durationSec: 5 | 10;
};

export type TemplateDef = {
  key: TemplateKey;
  /** CONCEPTS geri uyumu — StudioJob.videoConceptKey + regenerateScene yolu */
  legacyConceptKey: VideoConceptKey;
  label: string;
  subtitle: string;
  description: string;
  badge?: string;
  aspectRatio: "16:9" | "9:16";
  /** Otomatik öneri hedefi — LAND ilanlar "land", konutlar "housing" */
  targetListingTypes: "land" | "housing" | "any";
  /** Oda etiketi seçici bu şablonda gösterilsin mi */
  usesRooms: boolean;
  sceneRecipe: { slots: SceneSlotDef[]; fallback: SceneSlotDef };
  /** Sahne sınırları için geçişler — sequence varsa sınır index'i ile dönüşümlü */
  transitions: { default: TransitionKey; sequence?: TransitionKey[] };
  overlaySlots: OverlaySlotDef[];
  musicDefault: MusicKey;
  /** Seslendirme altında müzik seviyesi (duck) — 0..1 */
  musicVolume: number;
  voiceTone: VoiceTone;
  /** Her sahne prompt'unun sonuna eklenen stil çapası */
  style: string;
  /** BASE_NEGATIVE_PROMPT'a eklenen şablon negatifleri */
  negative: string;
};

// İç mekân şablonlarında oda ipuçları referans tur sırasını izler
const interiorSlots = (motions: string[]): SceneSlotDef[] =>
  INTERIOR_TEMPLATE_ORDER.map((roomKey, i) => ({
    roomKeyHint: roomKey,
    motions: [motions[i % motions.length]],
    durationSec: 5,
  }));

const FPV_MOTIONS = [
  "FPV drone flight moving forward through the doorway, smooth continuous forward motion",
  "first-person fly-through gliding forward through the room, steady altitude",
  "FPV drone smoothly weaving forward past furniture, continuous glide",
];

const CLASSIC_MOTIONS = [
  "very slow steady push forward into the room",
  "gentle slow pan from left to right",
  "subtle slow push-in with natural parallax",
];

export const TEMPLATES: Record<TemplateKey, TemplateDef> = {
  fpv_tour: {
    key: "fpv_tour",
    legacyConceptKey: "interior",
    label: "FPV Ev Turu",
    subtitle: "Akıcı drone içi uçuş hissi",
    description:
      "Fotoğraflarınızdan odadan odaya süzülen FPV drone tarzı dinamik bir ev turu. Zoom geçişler ve enerjik anlatımla.",
    badge: "Yeni",
    aspectRatio: "16:9",
    targetListingTypes: "housing",
    usesRooms: true,
    sceneRecipe: {
      slots: interiorSlots(FPV_MOTIONS),
      fallback: { motions: FPV_MOTIONS, durationSec: 5 },
    },
    transitions: { default: "zoom" },
    overlaySlots: [
      {
        key: "location",
        label: "Konum",
        source: "location",
        placement: "first",
        startSec: 0.8,
        lengthSec: 3.5,
        styleKey: "cardTopLeft",
      },
      {
        key: "price",
        label: "Fiyat",
        source: "price",
        placement: "last",
        startSec: 0.5,
        lengthSec: 4,
        styleKey: "bigCenter",
      },
    ],
    musicDefault: "uplifting_corporate",
    musicVolume: 0.18,
    voiceTone: "energetic",
    style:
      "smooth FPV drone interior footage, bright natural daylight, " +
      "photorealistic, stabilized continuous motion, camera movement only, " +
      "every piece of furniture and every fixture stays exactly where it is " +
      "in the source photo",
    negative:
      "rotating camera, orbiting, spinning, rearranged furniture, new decor, " +
      "changed lighting fixtures, doors or windows appearing or disappearing",
  },

  classic_interior: {
    key: "classic_interior",
    legacyConceptKey: "interior",
    label: "Klasik Ev Turu",
    subtitle: "Sakin ve zarif sunum",
    description:
      "Yavaş kamera hareketleri, yumuşak geçişler ve sakin piyano eşliğinde profesyonel bir iç mekân turu.",
    aspectRatio: "16:9",
    targetListingTypes: "housing",
    usesRooms: true,
    sceneRecipe: {
      slots: interiorSlots(CLASSIC_MOTIONS),
      fallback: { motions: CLASSIC_MOTIONS, durationSec: 5 },
    },
    transitions: { default: "fade" },
    overlaySlots: [
      {
        key: "cta",
        label: "Kapanış Mesajı",
        source: "custom",
        placement: "last",
        startSec: 1,
        lengthSec: 3.5,
        styleKey: "cta",
        defaultText: "Detaylı bilgi için hemen arayın",
      },
    ],
    musicDefault: "calm_piano",
    musicVolume: 0.15,
    voiceTone: "calm",
    style:
      "real estate interior video tour, bright natural daylight, " +
      "photorealistic, steady gimbal movement, inviting atmosphere, " +
      "camera movement only, every piece of furniture and every fixture " +
      "stays exactly where it is in the source photo",
    negative:
      "rotating camera, orbiting, fast movement, rearranged furniture, " +
      "new decor, changed lighting fixtures, doors or windows appearing or disappearing",
  },

  land_drone: {
    key: "land_drone",
    legacyConceptKey: "drone",
    label: "Arsa / Tarla Drone",
    subtitle: "Havadan tanıtım + bilgi kartları",
    description:
      "Arsanızın havadan sinematik uçuşu; konum, metrekare ve fiyat bilgisi ekranda kartlar halinde.",
    aspectRatio: "16:9",
    targetListingTypes: "land",
    usesRooms: false,
    sceneRecipe: {
      slots: [
        {
          motions: [
            "slow high aerial establishing shot, gentle forward drift over the land",
          ],
          durationSec: 5,
        },
        {
          motions: [
            "smooth lateral drone pan across the terrain, revealing the boundaries",
          ],
          durationSec: 5,
        },
        {
          motions: [
            "slow descending push-in towards the center of the plot, zoom emphasis",
          ],
          durationSec: 5,
        },
      ],
      fallback: {
        motions: [
          "slow aerial push-in towards the property, gentle descent",
          "smooth lateral drone pan across the landscape",
          "slow rising crane shot revealing the surroundings",
        ],
        durationSec: 5,
      },
    },
    transitions: { default: "fade", sequence: ["fade", "wipeLeft", "fade"] },
    overlaySlots: [
      {
        key: "location",
        label: "Konum",
        source: "location",
        placement: "first",
        startSec: 0.8,
        lengthSec: 3.5,
        styleKey: "cardTopLeft",
      },
      {
        key: "area",
        label: "Metrekare",
        source: "grossArea",
        placement: 1,
        startSec: 0.5,
        lengthSec: 4,
        styleKey: "bannerBottom",
      },
      {
        key: "adaParsel",
        label: "Ada / Parsel",
        source: "adaParsel",
        placement: 1,
        startSec: 0.5,
        lengthSec: 4,
        styleKey: "cardTopLeft",
      },
      {
        key: "price",
        label: "Fiyat",
        source: "price",
        placement: "last",
        startSec: 0.5,
        lengthSec: 4,
        styleKey: "bigCenter",
      },
    ],
    musicDefault: "ambient_nature",
    musicVolume: 0.18,
    voiceTone: "informative",
    style:
      "cinematic drone footage, golden hour sunlight, photorealistic, " +
      "smooth stabilized motion, high dynamic range, " +
      "the terrain remains exactly as in the source photo",
    negative:
      "added buildings, added roads, changing terrain, altered landscape",
  },

  social_promo: {
    key: "social_promo",
    legacyConceptKey: "social",
    label: "Sosyal Medya Reklamı",
    subtitle: "9:16 dikey, hızlı ve vurucu",
    description:
      "Instagram/TikTok için dikey format: hook açılışı, hızlı kesmeler, bold fiyat ve konum yazıları, enerjik müzik.",
    badge: "Popüler",
    aspectRatio: "9:16",
    targetListingTypes: "any",
    usesRooms: false,
    sceneRecipe: {
      slots: [],
      fallback: {
        motions: [
          "slow zoom-in with subtle drift",
          "smooth vertical reveal tilting up slowly",
          "slow push-in with gentle parallax",
        ],
        durationSec: 5,
      },
    },
    transitions: {
      default: "slideUp",
      sequence: ["slideUp", "carouselLeft", "zoom"],
    },
    overlaySlots: [
      {
        key: "hook",
        label: "Açılış Mesajı",
        source: "custom",
        placement: "first",
        startSec: 0.3,
        lengthSec: 3,
        styleKey: "hook",
        defaultText: "Bu ilanı kaçırmayın!",
      },
      {
        key: "rooms",
        label: "Oda Sayısı",
        source: "rooms",
        placement: 1,
        startSec: 0.5,
        lengthSec: 3.5,
        styleKey: "bannerBottom",
      },
      {
        key: "location",
        label: "Konum",
        source: "location",
        placement: "all",
        startSec: 0.5,
        lengthSec: 4,
        styleKey: "cardTopLeft",
      },
      {
        key: "price",
        label: "Fiyat",
        source: "price",
        placement: "last",
        startSec: 0.5,
        lengthSec: 4,
        styleKey: "bigCenter",
      },
      {
        key: "cta",
        label: "Kapanış Mesajı",
        source: "custom",
        placement: "last",
        startSec: 2,
        lengthSec: 2.5,
        styleKey: "cta",
        defaultText: "Detaylar için DM 📩",
      },
    ],
    musicDefault: "energetic_pop",
    musicVolume: 0.22,
    voiceTone: "energetic",
    style:
      "eye-catching vertical social media property showcase, vibrant colors, " +
      "crisp details, photorealistic, smooth cinematic motion, " +
      "scene content identical to the source photo, camera movement only",
    negative:
      "orbiting camera, spinning, fast cuts, added props, staging changes",
  },
};

export const TEMPLATE_LIST: TemplateDef[] = [
  TEMPLATES.fpv_tour,
  TEMPLATES.classic_interior,
  TEMPLATES.land_drone,
  TEMPLATES.social_promo,
];

const LEGACY_CONCEPT_TO_TEMPLATE: Record<VideoConceptKey, TemplateKey> = {
  drone: "land_drone",
  interior: "classic_interior",
  social: "social_promo",
};

export function isTemplateKey(key: string): key is TemplateKey {
  return key in TEMPLATES;
}

/**
 * Tek geri-uyum şimi: geçerli templateKey → eski conceptKey eşlemesi →
 * classic_interior. Eski projeler (templateKey=null) böylece aynı
 * birleştirme yolundan geçer.
 */
export function resolveTemplate(
  templateKey: string | null | undefined,
  conceptKey?: string | null,
): TemplateDef {
  if (templateKey && isTemplateKey(templateKey)) return TEMPLATES[templateKey];
  const legacy = LEGACY_CONCEPT_TO_TEMPLATE[conceptKey as VideoConceptKey];
  return TEMPLATES[legacy ?? "classic_interior"];
}

/** İlan tipine göre önerilen şablon — LAND: drone, diğerleri: FPV tur. */
export function suggestedTemplateFor(listingType: string | null | undefined): TemplateKey {
  return listingType === "LAND" ? "land_drone" : "fpv_tour";
}

/** Sahne slotu: reçetede varsa slot, yoksa fallback. */
function slotFor(template: TemplateDef, sceneIndex: number): SceneSlotDef {
  return template.sceneRecipe.slots[sceneIndex] ?? template.sceneRecipe.fallback;
}

export function sceneDefaults(
  template: TemplateDef,
  sceneIndex: number,
): { roomKeyHint: RoomKey | null; durationSec: 5 | 10 } {
  const slot = slotFor(template, sceneIndex);
  return { roomKeyHint: slot.roomKeyHint ?? null, durationSec: slot.durationSec };
}

/**
 * Sahne prompt'u: (varsa) oda bağlamı + şablon hareketi + stil çapası.
 * Oda etiketli şablonlarda odanın güvenli hareketi FPV dışı şablonlarda
 * önceliklidir; FPV kendi ileri-uçuş hareketini korur.
 */
export function buildTemplateScenePrompt(
  template: TemplateDef,
  sceneIndex: number,
  roomKey?: string | null,
): string {
  const room = roomKey ? ROOMS[roomKey as RoomKey] : undefined;
  const slot = slotFor(template, sceneIndex);
  const templateMotion = slot.motions[sceneIndex % slot.motions.length];
  // FPV turda hareket kimliği şablondan gelir; klasik turda odanın
  // kendi güvenli hareketi tercih edilir (mevcut davranış).
  const motion =
    template.key === "fpv_tour" ? templateMotion : (room?.motion ?? templateMotion);
  const context = room ? `${room.en}, ` : "";
  return `${context}${motion}, ${template.style}`;
}

/** Sahne negative prompt'u: ortak koruma seti + şablon negatifleri. */
export function buildTemplateNegativePrompt(template: TemplateDef): string {
  return `${BASE_NEGATIVE_PROMPT}, ${template.negative}`;
}

/** Sahne sınırı geçişi — boundaryIndex: 0 = 1.→2. sahne sınırı. */
export function transitionForBoundary(
  template: TemplateDef,
  boundaryIndex: number,
): TransitionKey {
  const seq = template.transitions.sequence;
  if (seq?.length) return seq[boundaryIndex % seq.length];
  return template.transitions.default;
}

/** Geçmiş listesi vb. için etiket — hem template hem legacy concept anlar. */
export function templateLabel(
  templateKey: string | null | undefined,
  conceptKey?: string | null,
): string {
  return resolveTemplate(templateKey, conceptKey).label;
}
