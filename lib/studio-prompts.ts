// ── AI Stüdyo Prompt Kütüphanesi ──
// Kullanıcı serbest prompt yazmaz: konsept seçer, sistem her sahne için
// Kling'in iyi anladığı standart İngilizce prompt'u üretir. Böylece
// sahneler tutarlı çıkar ve "prompt karışıklığı" yaşanmaz.

export type VideoConceptKey = "drone" | "interior" | "social";

type ConceptDefinition = {
  label: string;
  aspectRatio: "16:9" | "9:16";
  /** Sahne sırasına göre kamera hareketi çeşitlemesi — art arda aynı
   *  hareket monoton durduğu için sahne index'i ile dönüşümlü seçilir.
   *  Görsel sadakat için hareketler bilinçli yavaş/yumuşak tutulur:
   *  agresif hareket (hızlı orbit vb.) = daha çok halüsinasyon. */
  motions: string[];
  /** Her sahne prompt'unun sonuna eklenen ortak stil çapası */
  style: string;
  /** Konsepte özel negative prompt ekleri (ortak sete eklenir) */
  negative: string;
};

// Ortak koruma seti — modelin fotoğraftaki mekânı "yeniden hayal etmesini"
// kapatır: duvar/eşya ekleme-çıkarma, mekân morfu, insan, yazı vb. yasak.
// (Şablon katmanı studio-templates.ts de bunu temel alır — export bu yüzden.)
export const BASE_NEGATIVE_PROMPT =
  "structural changes, added or removed walls, added or removed furniture, " +
  "added or removed objects, morphing rooms, changing room layout, " +
  "people, faces, text, captions, watermark, logo, distortion, warping, " +
  "flickering, blurry, low quality, " +
  // Kamera fotoğrafta GÖRÜNEN alanın dışına çıkamaz: kapıdan geçip yeni oda
  // uydurmak en sık görülen halüsinasyon — mekân fotoğrafla sınırlı kalmalı.
  "revealing areas not visible in the source photo, invented spaces, " +
  "new rooms, passing through doorways, camera leaving the photographed space";

const CONCEPTS: Record<VideoConceptKey, ConceptDefinition> = {
  drone: {
    label: "Drone Uçuşu",
    aspectRatio: "16:9",
    // Dış çekimde orbit/crane serbest — açık alanda morf riski düşük
    motions: [
      "slow aerial push-in towards the property, gentle descent",
      "smooth lateral drone pan across the landscape",
      "slow rising crane shot revealing the surroundings",
    ],
    style:
      "cinematic drone footage, golden hour sunlight, photorealistic, " +
      "smooth stabilized motion, high dynamic range, " +
      "the terrain and buildings remain exactly as in the source photo",
    negative: "added buildings, added roads, changing terrain, altered landscape",
  },
  interior: {
    label: "Ev İçi Tur",
    aspectRatio: "16:9",
    // İç mekânda yalnızca yavaş pan/push — dönüş ve orbit yasak
    motions: [
      "very slow steady push forward into the room",
      "gentle slow pan from left to right",
      "subtle slow push-in with natural parallax",
    ],
    style:
      "real estate interior video tour, bright natural daylight, " +
      "photorealistic, steady gimbal movement, inviting atmosphere, " +
      "camera movement only, every piece of furniture and every fixture " +
      "stays exactly where it is in the source photo",
    negative:
      "rotating camera, orbiting, fast movement, rearranged furniture, " +
      "new decor, changed lighting fixtures, doors or windows appearing or disappearing",
  },
  social: {
    label: "Sosyal Medya",
    aspectRatio: "9:16",
    // Dikkat çekici ama güvenli: zoom/tilt var, orbit yok
    motions: [
      "slow zoom-in with subtle drift",
      "smooth vertical reveal tilting up slowly",
      "slow push-in with gentle parallax",
    ],
    style:
      "eye-catching vertical social media property showcase, vibrant colors, " +
      "crisp details, photorealistic, smooth cinematic motion, " +
      "scene content identical to the source photo, camera movement only",
    negative: "orbiting camera, spinning, fast cuts, added props, staging changes",
  },
};

export function getConcept(key: string): ConceptDefinition {
  return CONCEPTS[(key as VideoConceptKey) in CONCEPTS ? (key as VideoConceptKey) : "interior"];
}

// ── Oda tanımları — "hangi fotoğraf hangi tanımda" ──
// Kullanıcı iç mekân turunda her fotoğrafa oda çipi atar; oda bağlamı
// prompt'a girer ve o odaya uygun (güvenli) kamera hareketi seçilir.

export type RoomKey =
  | "exterior"
  | "living"
  | "kitchen"
  | "bedroom"
  | "bathroom"
  | "balcony"
  | "garden";

type RoomDefinition = {
  label: string; // TR arayüz etiketi
  en: string; // prompt'a giren İngilizce bağlam
  motion: string; // bu oda tipi için güvenli kamera hareketi
};

export const ROOMS: Record<RoomKey, RoomDefinition> = {
  exterior: {
    label: "Dış Cephe",
    en: "residential building exterior facade",
    motion: "slow steady push-in towards the entrance",
  },
  living: {
    label: "Salon",
    en: "furnished living room",
    motion: "gentle slow pan from left to right",
  },
  kitchen: {
    label: "Mutfak",
    en: "modern kitchen",
    motion: "very slow steady push forward",
  },
  bedroom: {
    label: "Yatak Odası",
    en: "cozy bedroom",
    motion: "subtle slow push-in with natural parallax",
  },
  bathroom: {
    label: "Banyo",
    en: "bathroom",
    motion: "very slow gentle pan",
  },
  balcony: {
    label: "Balkon",
    en: "balcony with its open view",
    motion: "slow push towards the railing revealing the view",
  },
  garden: {
    label: "Bahçe",
    en: "landscaped garden",
    motion: "smooth slow lateral pan across the garden",
  },
};

/** Referans şablon: profesyonel tur dizilimi — "Şablona göre sırala" bunu kullanır. */
export const INTERIOR_TEMPLATE_ORDER: RoomKey[] = [
  "exterior",
  "living",
  "kitchen",
  "bedroom",
  "bathroom",
  "balcony",
  "garden",
];

/**
 * Sahne prompt'u: (varsa) oda bağlamı + odaya uygun kamera hareketi + stil.
 * Oda seçilmemişse konseptin dönüşümlü hareketleri kullanılır.
 */
export function buildScenePrompt(
  conceptKey: string,
  sceneIndex: number,
  roomKey?: string | null,
): string {
  const c = getConcept(conceptKey);
  const room = roomKey ? ROOMS[roomKey as RoomKey] : undefined;
  const motion = room?.motion ?? c.motions[sceneIndex % c.motions.length];
  const context = room ? `${room.en}, ` : "";
  return `${context}${motion}, ${c.style}`;
}

/** Sahne negative prompt'u: ortak koruma seti + konsepte özel ekler. */
export function buildSceneNegativePrompt(conceptKey: string): string {
  const c = getConcept(conceptKey);
  return `${BASE_NEGATIVE_PROMPT}, ${c.negative}`;
}

// ── Negative constraints — yasaklı kelime denetimi ──

/** Metinde geçen yasaklı kelimeleri döndürür (Türkçe küçük/büyük harf duyarsız). */
export function findNegativeTermViolations(
  text: string,
  terms: string[],
): string[] {
  const lower = text.toLocaleLowerCase("tr-TR");
  return terms
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && lower.includes(t.toLocaleLowerCase("tr-TR")));
}

/** Virgülle ayrılmış kullanıcı girdisini normalize eder. */
export function parseNegativeTerms(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[,;\n]/)
        .map((t) => t.trim())
        .filter((t) => t.length > 1),
    ),
  ).slice(0, 30);
}

// ── Cümle bölücü ──
// Nokta/ünlem/soru işaretinden SONRA boşluk gelen yerlerden böler —
// "4.250.000" gibi sayı içi noktalar bölünmez.

export function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
    .slice(0, 12); // segment üst sınırı
}

// ── Seslendirme metni ──
// İlan verisinden deterministik Türkçe tanıtım metni üretir.
// Hedef süre: sahne sayısı × 5 sn; Türkçe seslendirme ~14 karakter/sn.

export type VoiceListingInput = {
  title: string;
  city: string;
  district: string;
  neighborhood?: string | null;
  rooms?: string | null;
  grossArea?: number | null;
  price: string; // biçimlendirilmiş: "4.250.000 TL"
  purpose: string; // SALE | RENT
  features?: string[];
};

export type VoiceoverTone = "calm" | "energetic" | "informative";

export function buildVoiceoverText(
  listing: VoiceListingInput,
  sceneCount: number,
  negativeTerms: string[] = [],
  tone: VoiceoverTone = "calm",
): string {
  const targetChars = Math.max(sceneCount, 2) * 5 * 14;

  const location = [listing.neighborhood, listing.district, listing.city]
    .filter(Boolean)
    .join(", ");
  const action = listing.purpose === "RENT" ? "kiralık" : "satılık";

  // Yasaklı kelime içeren özellikler metne hiç girmez
  const safeFeatures = (listing.features ?? []).filter(
    (f) => findNegativeTermViolations(f, negativeTerms).length === 0,
  );

  const parts: string[] = [];

  if (tone === "energetic") {
    // Kısa, vurucu cümleler — FPV tur ve sosyal medya reklamı
    parts.push(`${location}'da kaçırılmayacak ${action} fırsat!`);
    if (listing.rooms && listing.grossArea) {
      parts.push(`${listing.rooms}, tam ${listing.grossArea} metrekare.`);
    } else if (listing.rooms) {
      parts.push(`${listing.rooms} planlı ferah bir yaşam alanı.`);
    }
    if (safeFeatures.length) {
      parts.push(`Üstelik ${safeFeatures.slice(0, 2).join(" ve ")} özellikli.`);
    }
    parts.push(`Fiyatı sadece ${listing.price}.`);
    parts.push("Hemen arayın, yerinde görün!");
  } else if (tone === "informative") {
    // Bilgilendirici — arsa/tarla: alan, konum ve yatırım vurgusu
    parts.push(`${location} bölgesinde ${action} arazi.`);
    if (listing.grossArea) {
      parts.push(`Toplam ${listing.grossArea} metrekare yüzölçümüne sahip.`);
    }
    if (safeFeatures.length) {
      parts.push(`${safeFeatures.slice(0, 3).join(", ")} özellikleri mevcut.`);
    }
    parts.push(`Konumu ve ulaşım imkânlarıyla yatırım için değerlendirilebilir.`);
    parts.push(`Fiyatı ${listing.price}.`);
    parts.push("Detaylı bilgi ve parsel sorgusu için bize ulaşın.");
  } else {
    // calm — mevcut klasik çıktı
    parts.push(`${location} konumunda ${action} bir fırsat.`);
    if (listing.rooms && listing.grossArea) {
      parts.push(`${listing.rooms} planlı, ${listing.grossArea} metrekare.`);
    } else if (listing.rooms) {
      parts.push(`${listing.rooms} planlı ferah bir yaşam alanı.`);
    }
    if (safeFeatures.length) {
      parts.push(`${safeFeatures.slice(0, 3).join(", ")} gibi öne çıkan özellikleriyle.`);
    }
    parts.push(`Fiyatı ${listing.price}.`);
    parts.push("Detaylı bilgi ve randevu için hemen bize ulaşın.");
  }

  // Yasaklı kelime içeren cümleler düşürülür (ilk/son cümle güvenli kalıplardır)
  const safeParts = parts.filter(
    (p, i) =>
      i === 0 ||
      i === parts.length - 1 ||
      findNegativeTermViolations(p, negativeTerms).length === 0,
  );

  // Hedef süreyi aşmayacak kadar cümle al — ilk ve son cümle her zaman kalır
  let text = safeParts[0];
  for (let i = 1; i < safeParts.length - 1; i++) {
    if ((text + " " + safeParts[i] + " " + safeParts[safeParts.length - 1]).length > targetChars) break;
    text += " " + safeParts[i];
  }
  text += " " + safeParts[safeParts.length - 1];
  return text;
}
