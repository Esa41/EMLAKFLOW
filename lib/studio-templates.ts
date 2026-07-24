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
  | "cinematic_fpv"
  | "fpv_reels"
  | "luxury_showcase"
  | "golden_hour"
  | "classic_interior"
  | "land_drone"
  | "social_promo"
  | "presenter_reels"
  | "timelapse"
  | "shadow_play";

/** Shotstack clip transition adları ile bire bir (Fast = whip/blur hissi). */
export type TransitionKey =
  | "fade"
  | "zoom"
  | "zoomFast"
  | "wipeLeft"
  | "wipeRight"
  | "slideLeft"
  | "slideUp"
  | "carouselLeft"
  | "none";

export const TRANSITION_LABELS: Record<TransitionKey, string> = {
  fade: "Yumuşak Geçiş",
  zoom: "Zoom",
  zoomFast: "Hızlı Zoom (whip)",
  wipeLeft: "Silme (Sola)",
  wipeRight: "Silme (Sağa)",
  slideLeft: "Kaydırma (Sola)",
  slideUp: "Kaydırma (Yukarı)",
  carouselLeft: "Dönme",
  none: "Kesme",
};

export type VoiceTone = "calm" | "energetic" | "informative";

/**
 * Üretim modu — şablonun videoyu nasıl ürettiği:
 *  reference : TÜM fotoğraflar tek Seedance çağrısına referans verilir
 *              (@Image1..@ImageN) → TEK bütünlüklü tur videosu. Akıcı,
 *              "geçiş" sorunu yok; ama beğenilmezse tamamı yeniden üretilir.
 *  per_scene : Her fotoğraf ayrı Kling klibi → tek tek onay/yeniden üretim →
 *              Shotstack'te geçişlerle birleştirilir (sahne bazlı kontrol).
 */
export type GenerationMode = "reference" | "per_scene";

/** reference modunda üretilen tek videonun süresi (Seedance: 4-15 sn). */
export const REFERENCE_DURATION_SEC = 10;

// ── Arka plan atmosferi (Vitrin Sunucusu) ──
// Sunucu anlatırken arkadaki ilan sahnelerinin ışık/ton karakteri. Sahne
// prompt'una stil eki olarak girer — mekân sabit kalır, yalnızca ışık tonlanır
// (Esa isteği, 24 Tem 2026). Referans RichKey kreatifi "evening" tonundadır.

export type AtmosphereKey = "natural" | "golden_hour" | "evening" | "shadow_play";

export type AtmosphereDef = {
  key: AtmosphereKey;
  label: string;
  desc: string;
  /** Sahne prompt'una eklenen ışık/ton çapası — "" = varsayılan (dokunma). */
  style: string;
};

export const ATMOSPHERES: AtmosphereDef[] = [
  {
    key: "natural",
    label: "Doğal Gündüz",
    desc: "Aydınlık, doğal ışık — nötr ve temiz.",
    style: "",
  },
  {
    key: "golden_hour",
    label: "Altın Saat",
    desc: "Sıcak gün batımı tonu, yumuşak ışık.",
    style:
      "bathed in warm golden hour light, soft sunset tones streaming in, " +
      "gentle lens flare, long soft shadows",
  },
  {
    key: "evening",
    label: "Sinematik Akşam",
    desc: "Loş, sıcak lamba ışığı — dramatik ve prestijli.",
    style:
      "warm cinematic evening ambiance, soft lamp light, moody low-key " +
      "lighting, elegant dramatic atmosphere, warm color grade",
  },
  {
    key: "shadow_play",
    label: "Gölge Oyunu",
    desc: "Pencereden süzülen ışık ve yumuşak gölgeler.",
    style:
      "warm sunlight streaming through the windows casting soft gentle " +
      "shadows across the surfaces, subtle dust particles floating in the light",
  },
];

export const DEFAULT_ATMOSPHERE: AtmosphereKey = "natural";

export function getAtmosphere(key: string | null | undefined): AtmosphereDef {
  return ATMOSPHERES.find((a) => a.key === key) ?? ATMOSPHERES[0];
}

export function isAtmosphereKey(key: string): key is AtmosphereKey {
  return ATMOSPHERES.some((a) => a.key === key);
}

// ── Kredi bedelleri — birim: 1 tam video = 100 kredi (plans-config) ──
// Satış: 100 kredi = ₺450. Gerçek maliyetler (kur ₺50): Kling 5 sn ≈ ₺14,
// Seedance 10 sn ≈ ₺120 → marjlar korunur.

/** 5 sn Kling sahnesi. */
export const SCENE_CREDIT_COST = 20;
/** 10 sn Kling sahnesi (~2x vendor maliyeti). */
export const SCENE_CREDIT_COST_10S = 40;
/** reference modu (Seedance tek tur) = tam bir video. */
export const REFERENCE_CREDIT_COST = 100;

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
  /** false → seçici/galeride "Yakında", seçilemez (foto-preset omurga deseni). */
  available?: boolean;
  aspectRatio: "16:9" | "9:16";
  /** Videonun nasıl üretileceği — bkz. GenerationMode */
  generationMode: GenerationMode;
  /** Otomatik öneri hedefi — LAND ilanlar "land", konutlar "housing" */
  targetListingTypes: "land" | "housing" | "any";
  /** Oda etiketi seçici bu şablonda gösterilsin mi */
  usesRooms: boolean;
  /**
   * "Bu şablon için hangi fotoğrafları yükle" yönlendirmesi — seçici
   * ekranında madde madde gösterilir. Kullanıcının referans videonun
   * aynısını üretebilmesi için doğru girdiyi vermesini sağlar
   * (Esa geri bildirimi, 24 Tem 2026).
   */
  shotGuide?: string[];
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

// Kamera fotoğrafta görünen alanın İÇİNDE kalır — "kapıdan geç" gibi ifadeler
// modele olmayan mekân uydurtuyordu (Esa geri bildirimi, 16 Tem 2026).
const FPV_MOTIONS = [
  "FPV drone gliding slowly forward inside the room, smooth continuous forward motion, camera stays within the space visible in the photo",
  "first-person fly-through moving gently forward across the room, steady altitude, staying inside the photographed space",
  "FPV drone smooth forward push within the room, continuous glide, no new areas revealed",
];

const CLASSIC_MOTIONS = [
  "very slow steady push forward into the room",
  "gentle slow pan from left to right",
  "subtle slow push-in with natural parallax",
];

// Sinematik FPV Pro: hız rampası + motion blur + dinamik uçuş PROMPT'tan
// Kling'e istenir. Bilinçli olarak agresif — halüsinasyon riski yüksektir;
// sahne onay kapısı + tek sahne regenerate bu riski yönetir.
const CINEMATIC_FPV_MOTIONS = [
  "dynamic FPV drone push-in inside the room, speed ramp from slow to fast, natural motion blur, camera stays within the space visible in the photo",
  "sweeping first-person drone move forward across the room, quick acceleration then smooth deceleration, cinematic motion blur, staying inside the photographed space",
  "FPV drone forward glide with a dramatic speed ramp, adrenaline pacing, motion blur on fast movement, no doorway crossing",
];

// FPV Reels: sinematik FPV'nin dikey (9:16) sürümü — hız rampası + motion
// blur dikey kadrajda, sosyal medya için hook temposu.
const FPV_REELS_MOTIONS = [
  "vertical FPV drone push-in inside the room, speed ramp, natural motion blur, dynamic energy, camera stays within the space visible in the photo",
  "first-person drone gliding forward across the room in vertical framing, quick acceleration, cinematic motion blur, staying inside the photographed space",
  "FPV drone forward sweep within the room, punchy pacing, motion blur on fast movement, no doorway crossing",
];

// Lüks Vitrin: yavaş, zarif, sığ alan derinliği (bokeh) + anamorfik lens
// hissi. Halüsinasyon riski düşük — hareketler yumuşak.
const LUXURY_MOTIONS = [
  "very slow elegant push-in, shallow depth of field with soft bokeh, anamorphic lens flare",
  "smooth graceful slow pan revealing the space, cinematic shallow focus, luxury real estate look",
  "slow refined dolly forward, soft background blur, high-end architectural digest aesthetic",
];

// Golden Hour Dış Cephe: gün batımı sıcak tonu + lens flare + uzun gölgeler,
// dış çekim (crane/orbit serbest — açık alanda morf riski düşük).
const GOLDEN_HOUR_MOTIONS = [
  "slow cinematic crane shot rising over the exterior at golden hour, warm sunset light, long shadows, gentle lens flare",
  "smooth aerial orbit around the property in warm sunset glow, floating dust particles in the light",
  "slow drone push-in towards the entrance at golden hour, warm rim light, atmospheric haze",
];

// Zaman Akışı (timelapse): dış çekimde bulut/ışık akışı + gün-alacakaranlık
// geçişi hissi. Mimari sabit kalır, yalnızca gökyüzü ve ışık hareketlenir.
const TIMELAPSE_MOTIONS = [
  "cinematic timelapse of the property exterior, clouds streaking fast across the sky, sunlight shifting from day to golden dusk, long moving shadows, the building and landscape remain perfectly static and unchanged",
  "timelapse drone hold over the property, fast drifting clouds, changing warm light, gentle shadow movement across the facade, architecture stays exactly as in the source photo",
];

// Gölge Oyunu (shadow play): iç mekânda pencereden süzülen güneş ışığının
// zemin/duvarda yavaşça gezinen sıcak gölgeleri — sinematik atmosfer.
const SHADOW_PLAY_MOTIONS = [
  "cinematic interior with warm sunlight streaming through the window, soft shadows of blinds slowly moving across the floor and walls, gentle dust particles floating in the light beam, the room and furniture stay exactly as in the source photo",
  "slow push-in through a sunlit room, golden light and soft window shadows drifting gently over the surfaces, warm atmospheric glow, furniture and layout unchanged",
];

// Vitrin Sunucusu: sahneler PiP sunucunun ARKA PLANIDIR — hareketler bilinçli
// sakin ki izleyicinin gözü sunucuda kalsın (avatar klip lib/studio-avatar.ts).
const PRESENTER_MOTIONS = [
  "very slow gentle push-in, calm steady motion",
  "subtle slow drift with natural parallax, steady framing",
  "gentle slow pan, smooth and unhurried",
];

// Vitrin Sunucusu AÇILIŞ sahnesi: dış cephe/drone fotoğrafından sinematik
// iniş — sunucu bu kuruluş sahnesinden SONRA tam ekran videoya girer
// (Esa geri bildirimi, 24 Tem 2026: yapay marka sahnesi değil, gerçek
// mekândan sinematik açılış).
const PRESENTER_OPENING_MOTIONS = [
  "cinematic aerial drone shot descending slowly toward the building entrance, smooth stabilized approach, warm natural light, the property remains exactly as in the source photo",
  "slow drone push-in from above toward the property facade, gentle descent, golden hour glow, terrain and building unchanged from the source photo",
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
    generationMode: "reference",
    targetListingTypes: "housing",
    usesRooms: true,
    shotGuide: [
      "Dış cephe fotoğrafıyla başlayın, sonra oda oda ilerleyin.",
      "Her odadan geniş açı, net bir fotoğraf seçin (koridor/geçiş fotoğrafları akışı güçlendirir).",
      "En fazla 8 fotoğraf — sıralamayı gerçek gezinme rotası gibi yapın.",
    ],
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

  cinematic_fpv: {
    key: "cinematic_fpv",
    legacyConceptKey: "interior",
    label: "Sinematik FPV Pro",
    subtitle: "Hız rampası + motion blur + film tonu",
    description:
      "Agresif FPV uçuş: hız rampaları, doğal motion blur ve sinematik renk tonu doğrudan AI'dan istenir. En etkileyici sonuç — sahne başına bozulma riski daha yüksek, beğenmediğiniz sahneyi yeniden üretin.",
    badge: "Pro",
    aspectRatio: "16:9",
    generationMode: "reference",
    targetListingTypes: "housing",
    usesRooms: true,
    sceneRecipe: {
      slots: interiorSlots(CINEMATIC_FPV_MOTIONS),
      fallback: { motions: CINEMATIC_FPV_MOTIONS, durationSec: 5 },
    },
    transitions: { default: "zoomFast", sequence: ["zoomFast", "carouselLeft", "zoomFast"] },
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
    musicDefault: "epic_cinematic",
    musicVolume: 0.2,
    voiceTone: "energetic",
    // Efektler burada: speed ramp + motion blur + renk tonu Kling prompt'una
    // stil çapası olarak girer; sadakat çapası korunur ama hız kısıtı yoktur.
    style:
      "cinematic FPV drone footage, dramatic speed ramps, natural motion blur " +
      "on fast movement, cinematic teal and orange color grade, film look, " +
      "high contrast, photorealistic, the room layout, furniture and fixtures " +
      "remain exactly as in the source photo",
    // Hız serbest — yalnızca mekân bütünlüğü ve baş döndürücü dönüş yasak
    negative:
      "360 spin, continuous spinning, rearranged furniture, new decor, " +
      "changed lighting fixtures, doors or windows appearing or disappearing",
  },

  fpv_reels: {
    key: "fpv_reels",
    legacyConceptKey: "social",
    label: "FPV Reels",
    subtitle: "9:16 dikey sinematik FPV",
    description:
      "Sinematik FPV'nin dikey sürümü: hız rampası, motion blur ve hook temposu. Instagram Reels / TikTok için birebir.",
    badge: "Pro",
    aspectRatio: "9:16",
    generationMode: "reference",
    targetListingTypes: "housing",
    usesRooms: true,
    sceneRecipe: {
      slots: interiorSlots(FPV_REELS_MOTIONS),
      fallback: { motions: FPV_REELS_MOTIONS, durationSec: 5 },
    },
    transitions: { default: "zoomFast", sequence: ["zoomFast", "slideUp", "carouselLeft"] },
    overlaySlots: [
      {
        key: "hook",
        label: "Açılış Mesajı",
        source: "custom",
        placement: "first",
        startSec: 0.3,
        lengthSec: 3,
        styleKey: "hook",
        defaultText: "Bu evi görmelisiniz!",
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
    ],
    musicDefault: "energetic_pop",
    musicVolume: 0.22,
    voiceTone: "energetic",
    style:
      "cinematic vertical FPV drone footage, dramatic speed ramps, natural " +
      "motion blur on fast movement, cinematic teal and orange color grade, " +
      "film look, high contrast, photorealistic, the room layout, furniture " +
      "and fixtures remain exactly as in the source photo",
    negative:
      "360 spin, continuous spinning, rearranged furniture, new decor, " +
      "changed lighting fixtures, doors or windows appearing or disappearing",
  },

  luxury_showcase: {
    key: "luxury_showcase",
    legacyConceptKey: "interior",
    label: "Lüks Vitrin",
    subtitle: "Zarif, sığ odak, film tonu",
    description:
      "Villa ve rezidanslar için: yavaş zarif hareketler, sığ alan derinliği (bokeh), anamorfik lens ışığı ve prestijli sıcak-koyu ton.",
    badge: "Yeni",
    aspectRatio: "16:9",
    generationMode: "reference",
    targetListingTypes: "housing",
    usesRooms: true,
    sceneRecipe: {
      slots: interiorSlots(LUXURY_MOTIONS),
      fallback: { motions: LUXURY_MOTIONS, durationSec: 5 },
    },
    transitions: { default: "fade" },
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
      {
        key: "cta",
        label: "Kapanış Mesajı",
        source: "custom",
        placement: "last",
        startSec: 1.5,
        lengthSec: 3,
        styleKey: "cta",
        defaultText: "Ayrıcalıklı yaşam için bize ulaşın",
      },
    ],
    musicDefault: "epic_cinematic",
    musicVolume: 0.18,
    voiceTone: "calm",
    style:
      "luxury real estate cinematic tour, shallow depth of field, soft bokeh, " +
      "anamorphic lens flare, rich warm and dark color grade, elegant film " +
      "look, architectural digest aesthetic, photorealistic, camera movement " +
      "only, every piece of furniture and every fixture stays exactly where " +
      "it is in the source photo",
    negative:
      "rotating camera, orbiting, fast movement, rearranged furniture, " +
      "new decor, changed lighting fixtures, doors or windows appearing or disappearing",
  },

  golden_hour: {
    key: "golden_hour",
    legacyConceptKey: "drone",
    label: "Golden Hour Dış Cephe",
    subtitle: "Gün batımı tonu + lens flare",
    description:
      "Dış cephe, bahçe ve manzara ağırlıklı ilanlar için: gün batımı sıcak ışığı, uzun gölgeler, lens flare ve havadan crane/orbit çekim.",
    aspectRatio: "16:9",
    generationMode: "reference",
    targetListingTypes: "any",
    usesRooms: false,
    sceneRecipe: {
      slots: [],
      fallback: { motions: GOLDEN_HOUR_MOTIONS, durationSec: 5 },
    },
    transitions: { default: "fade", sequence: ["fade", "zoom", "fade"] },
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
    musicDefault: "epic_cinematic",
    musicVolume: 0.18,
    voiceTone: "calm",
    // Golden hour aydınlatma stili prompt'tan istenir — mimari yapı korunur,
    // yalnızca ışık/atmosfer tonlanır.
    style:
      "cinematic exterior real estate footage at golden hour, warm sunset " +
      "light, long shadows, gentle lens flare, atmospheric haze, high dynamic " +
      "range, photorealistic, the building and landscape structure remains " +
      "exactly as in the source photo",
    negative:
      "added buildings, added roads, changing architecture, altered landscape, " +
      "people, added vehicles",
    shotGuide: [
      "Gün ışığında çekilmiş net bir dış cephe fotoğrafı seçin.",
      "Varsa drone/havadan çekim en iyi sonucu verir.",
      "Bahçe, havuz veya manzara fotoğrafları ekleyin.",
    ],
  },

  timelapse: {
    key: "timelapse",
    legacyConceptKey: "drone",
    label: "Zaman Akışı",
    subtitle: "Timelapse — akan bulutlar, değişen ışık",
    description:
      "Dış cephe fotoğrafınız sinematik bir timelapse'e dönüşür: hızla akan bulutlar, günden alacakaranlığa kayan ışık ve uzayan gölgeler. Bina sabit kalır, yalnızca gökyüzü ve atmosfer hareketlenir.",
    badge: "Yeni",
    aspectRatio: "16:9",
    generationMode: "reference",
    targetListingTypes: "any",
    usesRooms: false,
    shotGuide: [
      "Açık gökyüzü görünen bir dış cephe fotoğrafı seçin (gökyüzü ne kadar çok görünürse o kadar etkileyici).",
      "Drone/havadan çekim varsa idealdir.",
      "Gündüz çekilmiş, net ve yüksek çözünürlüklü olsun.",
    ],
    sceneRecipe: {
      slots: [],
      fallback: { motions: TIMELAPSE_MOTIONS, durationSec: 10 },
    },
    transitions: { default: "fade" },
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
    musicDefault: "epic_cinematic",
    musicVolume: 0.2,
    voiceTone: "calm",
    style:
      "cinematic real estate timelapse, fast moving clouds, shifting warm " +
      "light from day to dusk, long moving shadows, high dynamic range, " +
      "photorealistic, the building and landscape remain perfectly static and " +
      "unchanged, only the sky and light move",
    negative:
      "moving building, warping architecture, added buildings, changing " +
      "structure, people, distortion, morphing",
  },

  shadow_play: {
    key: "shadow_play",
    legacyConceptKey: "interior",
    label: "Gölge Oyunu",
    subtitle: "Pencereden süzülen ışık ve gölgeler",
    description:
      "İç mekân fotoğraflarınıza sinematik atmosfer: pencereden süzülen sıcak güneş ışığı, zemin ve duvarda yavaşça gezinen gölgeler, ışık huzmesinde uçuşan toz. Odalar ve eşyalar aynen kalır.",
    badge: "Yeni",
    aspectRatio: "9:16",
    generationMode: "per_scene",
    targetListingTypes: "housing",
    usesRooms: true,
    shotGuide: [
      "Pencere veya doğal ışık alan odaların fotoğraflarını seçin.",
      "Salon, yatak odası, mutfak gibi ferah mekânlar en iyi sonucu verir.",
      "Loş/karanlık fotoğraflardan kaçının — ışık kaynağı görünsün.",
    ],
    sceneRecipe: {
      slots: interiorSlots(SHADOW_PLAY_MOTIONS),
      fallback: { motions: SHADOW_PLAY_MOTIONS, durationSec: 5 },
    },
    transitions: { default: "fade", sequence: ["fade", "zoom", "fade"] },
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
    musicDefault: "calm_piano",
    musicVolume: 0.16,
    voiceTone: "calm",
    style:
      "cinematic interior with warm sunlight streaming through the window, " +
      "soft moving shadows across the floor and walls, gentle dust particles " +
      "in the light beam, warm atmospheric glow, photorealistic, the room, " +
      "furniture and fixtures stay exactly as in the source photo",
    negative:
      "rearranged furniture, new decor, added objects, people, changing " +
      "room layout, doors or windows appearing or disappearing, distortion",
  },

  classic_interior: {
    key: "classic_interior",
    legacyConceptKey: "interior",
    label: "Klasik Ev Turu",
    subtitle: "Sakin ve zarif sunum",
    description:
      "Yavaş kamera hareketleri, yumuşak geçişler ve sakin piyano eşliğinde profesyonel bir iç mekân turu.",
    aspectRatio: "16:9",
    generationMode: "reference",
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
    generationMode: "per_scene",
    targetListingTypes: "land",
    usesRooms: false,
    shotGuide: [
      "Havadan/drone çekilmiş arazi fotoğrafları en iyi sonucu verir.",
      "Farklı açılardan (geniş + yakın) 2-4 fotoğraf ekleyin.",
      "Varsa yola cephe, sınır taşı veya manzara fotoğrafı koyun.",
    ],
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
    generationMode: "per_scene",
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

  presenter_reels: {
    key: "presenter_reels",
    legacyConceptKey: "social",
    label: "Vitrin Sunucusu",
    subtitle: "AI sunucu ilanınızı anlatır",
    description:
      "Drone/dış cephe fotoğrafınızdan sinematik iniş açılışı, ardından AI sunucunuz videoya girer ve ev turu akarken ilanınızı anlatır. Reels/TikTok için birebir — yapay zekâ ibaresi otomatik eklenir.",
    badge: "Yakında",
    available: false,
    aspectRatio: "9:16",
    generationMode: "per_scene",
    targetListingTypes: "any",
    usesRooms: true,
    shotGuide: [
      "İLK sıraya dış cephe veya drone fotoğrafı koyun — sinematik iniş açılışı bundan üretilir.",
      "Sonra her odadan 1 net fotoğraf ekleyin (salon, mutfak, yatak odası…).",
      "Manzara/balkon fotoğrafıyla bitirin — güçlü bir kapanış olur.",
    ],
    sceneRecipe: {
      // İlk sahne: dış cephe/drone kuruluş çekimi — sinematik iniş
      slots: [
        {
          roomKeyHint: "exterior",
          motions: PRESENTER_OPENING_MOTIONS,
          durationSec: 5,
        },
      ],
      fallback: { motions: PRESENTER_MOTIONS, durationSec: 5 },
    },
    transitions: { default: "fade" },
    overlaySlots: [
      {
        key: "location",
        label: "Konum",
        source: "location",
        placement: "first",
        // Kuruluş (drone iniş) sahnesinin üzerinde görünür
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
    musicDefault: "calm_piano",
    // Sunucu konuşması NET duyulmalı — müzik diğer şablonlardan da kısık
    musicVolume: 0.08,
    voiceTone: "energetic",
    style:
      "vertical real estate showcase serving as background behind a presenter " +
      "overlay, calm smooth motion, photorealistic, scene content identical " +
      "to the source photo, camera movement only",
    negative:
      "orbiting camera, spinning, fast movement, added props, staging changes, " +
      "people appearing in the background scenes",
  },
};

export const TEMPLATE_LIST: TemplateDef[] = [
  TEMPLATES.fpv_tour,
  TEMPLATES.cinematic_fpv,
  TEMPLATES.fpv_reels,
  TEMPLATES.luxury_showcase,
  TEMPLATES.golden_hour,
  TEMPLATES.classic_interior,
  TEMPLATES.land_drone,
  TEMPLATES.social_promo,
  TEMPLATES.presenter_reels,
  TEMPLATES.timelapse,
  TEMPLATES.shadow_play,
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
  /** Arka plan atmosferi (Vitrin Sunucusu) — ışık/ton eki; boş = varsayılan. */
  atmosphereKey?: string | null,
): string {
  const room = roomKey ? ROOMS[roomKey as RoomKey] : undefined;
  const slot = slotFor(template, sceneIndex);
  const templateMotion = slot.motions[sceneIndex % slot.motions.length];
  // FPV şablonlarında hareket kimliği (hız rampası/uçuş) şablondan gelir;
  // klasik turda odanın kendi güvenli hareketi tercih edilir.
  const fpvTemplate =
    template.key === "fpv_tour" ||
    template.key === "cinematic_fpv" ||
    template.key === "fpv_reels";
  // Vitrin Sunucusu'nda şablonun sinematik açılış/sakin arka plan hareketi
  // odanın genel hareketine tercih edilir
  const templateFirst = fpvTemplate || template.key === "presenter_reels";
  const motion = templateFirst ? templateMotion : (room?.motion ?? templateMotion);
  const context = room ? `${room.en}, ` : "";
  const atmosphere = atmosphereKey ? getAtmosphere(atmosphereKey).style : "";
  const atmoSuffix = atmosphere ? `, ${atmosphere}` : "";
  return `${context}${motion}, ${template.style}${atmoSuffix}`;
}

/**
 * TEK VİDEO tur prompt'u (generationMode="reference" — Seedance).
 * Seçilen fotoğraflar sırayla @Image1..@ImageN olarak referans verilir;
 * şablonun kamera dili + stil çapası + sadakat kısıtı eklenir.
 */
export function buildTemplateTourPrompt(
  template: TemplateDef,
  photos: { roomKey?: string | null }[],
): string {
  const seq = photos
    .map((p, i) => {
      const room = p.roomKey ? ROOMS[p.roomKey as RoomKey] : undefined;
      return room ? `@Image${i + 1} (${room.en})` : `@Image${i + 1}`;
    })
    .join(" → ");

  // Kamera kimliği şablonun hareket havuzunun ilkinden gelir (FPV hız rampası,
  // lüks bokeh, golden hour crane… hepsi buradan)
  const camera = template.sceneRecipe.fallback.motions[0];

  return [
    "Cinematic real estate tour of a single property, one continuous smooth camera flow.",
    `Move through the property in this exact order: ${seq}.`,
    `Camera language: ${camera}.`,
    template.style + ".",
    "Each reference image is a real space of this property — the camera stays strictly inside the spaces shown in the reference images.",
    "Do not invent rooms, do not pass into spaces that are not in the references, do not change the layout; furniture and fixtures stay exactly as in the photos.",
  ].join(" ");
}

/** Sahne negative prompt'u: ortak koruma seti + şablon negatifleri. */
export function buildTemplateNegativePrompt(template: TemplateDef): string {
  // Sinematik FPV şablonları motion blur İSTER — ortak setteki "blurry"
  // yasağı bunu bastırmasın diye bu şablonlarda çıkarılır (diğer korumalar
  // aynen kalır).
  const wantsMotionBlur =
    template.key === "cinematic_fpv" || template.key === "fpv_reels";
  const base = wantsMotionBlur
    ? BASE_NEGATIVE_PROMPT.replace("blurry, ", "")
    : BASE_NEGATIVE_PROMPT;
  return `${base}, ${template.negative}`;
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
