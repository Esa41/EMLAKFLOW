/**
 * Sosyal OS — ŞABLON BANKASI (LLM'siz)
 *
 * Karar (Tem 2026): sosyal içerik üretimi GPT çağrısından çıkarıldı.
 * Metinleri biz yazıyoruz; sistem ilan verisiyle doldurup çıktıyı veriyor.
 * Kazanç: 0 API maliyeti, anlık yanıt, JSON parse hatası yok, çıktı kalitesi
 * bizim kontrolümüzde. Müşteri şablonu görüp kendi içeriğini aynı tarzda
 * üretebilsin diye ham şablon da çıktıya konur (`sourceTemplate`).
 *
 * Kompozisyon mantığı — 11 paket × 9 ton × 6 format'ı elle yazmak yerine
 * üç katman birleştirilir:
 *   1) TONE_VOICE   — ses (açılış, köprü, CTA, emoji, görsel stili)
 *   2) PACK_ANGLE   — paketin açısı (yeni ilan / fiyat / açık kapı …)
 *   3) format iskeleti — çıktının biçimi (caption, karusel, story, reel…)
 * Kritik veri (oda, m², konum, fiyat) şablon tokenıyla değil, alan varsa
 * eklenen KOŞULLU cümleciklerle kurulur — eksik alan asla "{oda}" diye sızmaz.
 */

import { PURPOSE_TR, TYPE_TR, trMoney } from "@/lib/labels";
import type { FormatKey, ToneKey } from "./catalog";

export type ListingInput = {
  title: string;
  purpose: string;
  type: string;
  price: string;
  currency: string;
  city: string;
  district: string;
  neighborhood?: string | null;
  rooms?: string | null;
  netArea?: number | null;
  grossArea?: number | null;
  description?: string | null;
  features?: string[];
};

/* ─────────────  1) TON BANKASI  ───────────── */

type Voice = {
  /** {yer} ve {tip} tokenları desteklenir */
  openers: string[];
  /** Özellik listesine geçiş cümlesi */
  bridges: string[];
  ctas: string[];
  /** Emoji politikası "none" ise hiç basılmaz */
  emoji: string[];
  /** Görsel promptun İngilizce stil kısmı */
  imageStyle: string;
  videoStyle: string;
  /** Reel açılış kancası */
  hooks: string[];
};

export const TONE_VOICE: Record<ToneKey, Voice> = {
  luxury: {
    openers: [
      "{yerDe} sessiz bir ayrıcalık.",
      "Az bulunur bir {tip}, {yerDe}.",
      "{yer}. Aceleye gelmeyen bir yaşam.",
    ],
    bridges: ["Kısaca:", "Öne çıkanlar:", "Künye:"],
    ctas: [
      "Özel tur için mesaj bırakın.",
      "Randevuyla gezilebilir.",
      "Detaylı sunum talep edin.",
    ],
    emoji: [],
    imageStyle:
      "editorial real estate photography, calm luxury, natural light, wide angle, muted palette, architectural digest style",
    videoStyle: "slow cinematic dolly, shallow depth of field, warm natural light",
    hooks: ["Bu adres kendini anlatıyor.", "Sessizliğin fiyatı olur mu?"],
  },
  premium: {
    openers: [
      "{yerDe} detaylarda fark yaratan bir {tip}.",
      "Kaliteyi abartmadan anlatan bir adres: {yer}.",
      "{yerDe} yaşam standardını yükselten seçenek.",
    ],
    bridges: ["Öne çıkanlar:", "Kısaca:", "Neden bu ev:"],
    ctas: [
      "Yerinde görmek için yazın.",
      "Uygun saati birlikte belirleyelim.",
      "Planı ve detayları paylaşalım.",
    ],
    emoji: ["✦"],
    imageStyle:
      "premium real estate photography, clean composition, soft daylight, balanced interior styling",
    videoStyle: "smooth gimbal walkthrough, soft daylight, elegant pacing",
    hooks: ["Detaylar fark yaratır.", "Bu evi ayıran şey ne?"],
  },
  professional: {
    openers: [
      "{yerDe} {tip} — güncel portföyümüzde.",
      "Portföyümüze yeni katılan {tip}: {yer}.",
      "{yerDe} yeni ilan.",
    ],
    bridges: ["Künye:", "Detaylar:", "Özet:"],
    ctas: [
      "Bilgi ve randevu için ulaşın.",
      "Detaylı bilgi için mesaj bırakın.",
      "Yerinde inceleme için bize yazın.",
    ],
    emoji: [],
    imageStyle:
      "clean real estate listing photo, bright daylight, wide angle, neutral tones, uncluttered",
    videoStyle: "steady walkthrough, even lighting, clear framing",
    hooks: ["Aradığınız bu olabilir.", "Kısaca bu ilan."],
  },
  corporate: {
    openers: [
      "{yer} lokasyonunda değerlendirilebilir {tip}.",
      "Yatırım gündeminize: {yerDe} {tip}.",
      "{yer} bölgesinde portföyümüze eklenen fırsat.",
    ],
    bridges: ["Temel veriler:", "Künye:", "Öne çıkan kriterler:"],
    ctas: [
      "Detaylı dosya için iletişime geçin.",
      "Fizibilite ve getiri bilgisi paylaşılır.",
      "Kurumsal görüşme için ulaşın.",
    ],
    emoji: [],
    imageStyle:
      "corporate real estate photography, exterior context, daylight, professional composition",
    videoStyle: "documentary style, stable shots, informative pacing",
    hooks: ["Rakamlarla bakalım.", "Bu lokasyon neden konuşuluyor?"],
  },
  friendly: {
    openers: [
      "{yerDe} gerçekten güzel bir {tip} var.",
      "Bu evi görünce anlarsınız — {yer}.",
      "{yerDe} sıcak bir yuva arayanlara.",
    ],
    bridges: ["Neler var:", "Kısaca:", "Şöyle anlatalım:"],
    ctas: [
      "Gezmek isterseniz yazın, ayarlayalım.",
      "Sorularınız olursa mesaj bırakın.",
      "Uygun olduğunuz saati söyleyin, birlikte bakalım.",
    ],
    emoji: ["🏡", "☀️", "✨"],
    imageStyle:
      "warm inviting home photography, cozy natural light, lived-in styling",
    videoStyle: "handheld friendly tour, warm light, casual pacing",
    hooks: ["Bu evi çok seveceksiniz.", "Girer girmez hissediliyor."],
  },
  emotional: {
    openers: [
      "Sabah kahvenizi burada içtiğinizi düşünün — {yer}.",
      "{yerDe} gün ışığıyla uyanmak.",
      "Eve dönmek istediğiniz yer: {yer}.",
    ],
    bridges: ["Ve dahası:", "Şunlar da var:", "Kısaca:"],
    ctas: [
      "Görmek isterseniz bir mesaj yeter.",
      "Hayalinizdekiyse konuşalım.",
      "Kapıyı birlikte açalım.",
    ],
    emoji: ["🌤️", "🤍"],
    imageStyle:
      "lifestyle interior photography, golden hour, soft shadows, human warmth, film grain",
    videoStyle: "golden hour lifestyle b-roll, soft slow motion, emotive pacing",
    hooks: ["Burada bir hayat var.", "Bu manzaraya uyanmak…"],
  },
  minimal: {
    openers: ["{yer}. {tip}.", "{yer} — sade ve hazır.", "{yer}. Taşınmaya hazır."],
    bridges: ["", "Künye:"],
    ctas: ["Bilgi: mesaj.", "Randevu için yazın.", "Detay için DM."],
    emoji: [],
    imageStyle:
      "minimal architectural photography, clean lines, negative space, muted palette, natural light",
    videoStyle: "static minimal frames, clean cuts, quiet pacing",
    hooks: ["Sade.", "Gerekli olan her şey."],
  },
  urgent: {
    openers: [
      "{yerDe} hızlı hareket etmek gerek.",
      "Bu {tip} uzun süre kalmaz — {yer}.",
      "{yerDe} bu hafta öne çıkan ilan.",
    ],
    bridges: ["Neden hızlı:", "Kısaca:", "Künye:"],
    ctas: [
      "Bugün yazın, bu hafta gezelim.",
      "Randevu için hemen mesaj bırakın.",
      "Gösterim saatleri sınırlı — ulaşın.",
    ],
    emoji: ["⚡"],
    imageStyle:
      "bright attention-grabbing real estate photo, high clarity, vivid daylight",
    videoStyle: "fast cuts, punchy transitions, energetic pacing",
    hooks: ["Bu fırsat hızlı gider.", "Bekleyenler kaçırıyor."],
  },
  high_converting: {
    openers: [
      "{yerDe} aradığınız {tip} burada olabilir.",
      "{yer} — karar vermenizi kolaylaştıracak bir ilan.",
      "{yerDe} doğru fiyat, net künye.",
    ],
    bridges: ["Ne sunuyor:", "Künye:", "Öne çıkanlar:"],
    ctas: [
      "Planı inceleyin · WhatsApp'tan randevu alın.",
      "Vitrinden tüm fotoğraflara bakın, sonra konuşalım.",
      "Yazın, aynı gün dönüş yapalım.",
    ],
    emoji: ["✅"],
    imageStyle:
      "high converting real estate ad photo, bright, clear focal point, space for text overlay",
    videoStyle: "hook-first ad edit, captions on screen, clear CTA end card",
    hooks: ["3 saniyede anlatayım.", "Şunu bilmeniz yeterli:"],
  },
};

/* ─────────────  2) PAKET AÇISI  ───────────── */

type Angle = {
  /** Açılışı ezer (boşsa ton açılışı kullanılır) */
  openers?: string[];
  /** Caption'ın sonuna eklenen özel satır */
  note?: string[];
  ctas?: string[];
  hashtags?: string[];
};

export const PACK_ANGLE: Record<string, Angle> = {
  "new-listing": {
    hashtags: ["yeniilan", "portföy"],
  },
  "feature-carousel": {
    note: ["Kaydırarak tüm detayları görebilirsiniz →"],
    hashtags: ["oda turu", "detaylar"],
  },
  "luxury-reel": {
    hashtags: ["lüksyaşam", "villa"],
  },
  "rental-fast": {
    openers: [
      "{yerDe} kiralık — hemen taşınmaya hazır.",
      "{yerDe} boşalan daire, hızlı bakanlara.",
    ],
    note: ["Anahtar teslim, bekletmeden."],
    hashtags: ["kiralık", "hemen taşın"],
  },
  "open-house": {
    openers: [
      "{yerDe} açık kapı günü.",
      "{yer} — bu hafta gösterim var.",
    ],
    note: ["Tarih ve saat için mesaj bırakın, listeye ekleyelim."],
    ctas: ["Katılmak için 'geliyorum' yazmanız yeterli."],
    hashtags: ["açıkkapı", "gösterim"],
  },
  "price-drop": {
    openers: [
      "{yerDe} fiyat güncellendi.",
      "{yer} — yeni fiyatıyla değerlendirmeye açık.",
    ],
    note: ["Güncelleme sonrası değerlendirmek isteyenler için detayları paylaşalım."],
    hashtags: ["fiyatgüncelleme", "fırsat"],
  },
  "investor-linkedin": {
    note: ["Bölge, kullanım izni ve getiri beklentisi için dosya paylaşılır."],
    hashtags: ["gayrimenkulyatırımı", "ticarigayrimenkul"],
  },
  "local-gbp": {
    ctas: ["Yol tarifi ve iletişim için işletme sayfamıza bakın."],
    hashtags: [],
  },
  lifestyle: {
    hashtags: ["yaşamtarzı", "evdekeyif"],
  },
  "social-promo-reel": {
    hashtags: ["keşfet", "emlak"],
  },
  "minimal-genz": {
    hashtags: ["sade", "taşınmayahazır"],
  },
};

/* ─────────────  3) YARDIMCILAR  ───────────── */

/**
 * Türkçe bulunma hâli eki (-de/-da/-te/-ta), özel ada kesme işaretiyle.
 * İki kural: son ünlüye göre kalın/ince uyumu, son sesi sertse ünsüz benzeşmesi.
 * "Uzunçiftlik" → "Uzunçiftlik'te" (yanlışı: "Uzunçiftlik'de").
 * Not: Kocaeli gibi tamlama kökenli adlarda kaynaştırma (-nde) uygulanmaz;
 * bu tür istisnalar için şablonlarda tire/iki nokta kurgusu tercih edilir.
 */
export function locative(word: string): string {
  const w = word.trim();
  if (!w) return "";
  const lower = w.toLocaleLowerCase("tr");
  const back = "aıou";
  let harmony: "a" | "e" = "e";
  for (let i = lower.length - 1; i >= 0; i--) {
    const ch = lower[i];
    if ("aeıioöuü".includes(ch)) {
      harmony = back.includes(ch) ? "a" : "e";
      break;
    }
  }
  const last = lower[lower.length - 1];
  const hard = "fstkçşhp".includes(last);
  const suffix = (hard ? "t" : "d") + harmony;
  return `${w}'${suffix}`;
}

function slug(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "");
}

/** Şablon tokenlarını doldurur: {yer}, {tip}, {sehir}, {ilce} */
function fill(tpl: string, v: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? "").trim();
}

export type Derived = {
  yer: string;
  tip: string;
  sehir: string;
  ilce: string;
  amac: string;
  fiyat: string;
  /** "3+1 · net 145 m² · Kartepe" — yalnız DOLU alanlardan kurulur */
  specs: string;
  specItems: string[];
  features: string[];
};

export function derive(l: ListingInput): Derived {
  const yer = l.neighborhood?.trim() || l.district || l.city;
  const tip = TYPE_TR[l.type] ?? "gayrimenkul";
  const amac = PURPOSE_TR[l.purpose] ?? "";
  const priceNum = Number(l.price);
  const fiyat = Number.isFinite(priceNum)
    ? `${trMoney.format(priceNum)}${l.purpose === "RENT" ? " /ay" : ""}`
    : "";

  // KOŞULLU künye — eksik alan hiç yazılmaz (token sızıntısı olmaz)
  const specItems = [
    l.rooms?.trim() || null,
    l.netArea ? `net ${l.netArea} m²` : l.grossArea ? `${l.grossArea} m²` : null,
    l.district || null,
  ].filter((x): x is string => !!x);

  return {
    yer,
    tip,
    sehir: l.city,
    ilce: l.district,
    amac,
    fiyat,
    specs: specItems.join(" · "),
    specItems,
    features: (l.features ?? []).slice(0, 6),
  };
}

export function buildHashtags(
  l: ListingInput,
  d: Derived,
  packId: string | null,
): string[] {
  const base = [
    slug(l.city),
    slug(l.district),
    l.purpose === "RENT" ? "kiralik" : "satilik",
    slug(d.tip),
    "emlak",
  ];
  const extra = (packId && PACK_ANGLE[packId]?.hashtags) || [];
  return Array.from(new Set([...base, ...extra.map(slug)])).filter(Boolean).slice(0, 10);
}

export function buildImagePrompt(
  l: ListingInput,
  d: Derived,
  tone: ToneKey,
): string {
  const v = TONE_VOICE[tone];
  const subject = `${d.tip}${l.rooms ? `, ${l.rooms}` : ""}${
    l.netArea ? `, ${l.netArea} sqm` : ""
  } in ${d.ilce}, ${d.sehir}, Turkey`;
  return `${subject}. ${v.imageStyle}. No text, no watermark, no people. 4:5 aspect ratio.`;
}

export function buildVideoPrompt(d: Derived, tone: ToneKey): string {
  const v = TONE_VOICE[tone];
  return `Vertical 9:16 real estate promo of a ${d.tip} in ${d.ilce}, ${d.sehir}. ${v.videoStyle}. 15-25 seconds, no on-screen text.`;
}
