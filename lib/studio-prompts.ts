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
const BASE_NEGATIVE_PROMPT =
  "structural changes, added or removed walls, added or removed furniture, " +
  "added or removed objects, morphing rooms, changing room layout, " +
  "people, faces, text, captions, watermark, logo, distortion, warping, " +
  "flickering, blurry, low quality";

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

/** Sahne prompt'u: konsept stili + sırayla dönüşümlü kamera hareketi. */
export function buildScenePrompt(conceptKey: string, sceneIndex: number): string {
  const c = getConcept(conceptKey);
  const motion = c.motions[sceneIndex % c.motions.length];
  return `${motion}, ${c.style}`;
}

/** Sahne negative prompt'u: ortak koruma seti + konsepte özel ekler. */
export function buildSceneNegativePrompt(conceptKey: string): string {
  const c = getConcept(conceptKey);
  return `${BASE_NEGATIVE_PROMPT}, ${c.negative}`;
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

export function buildVoiceoverText(
  listing: VoiceListingInput,
  sceneCount: number,
): string {
  const targetChars = Math.max(sceneCount, 2) * 5 * 14;

  const location = [listing.neighborhood, listing.district, listing.city]
    .filter(Boolean)
    .join(", ");
  const action = listing.purpose === "RENT" ? "kiralık" : "satılık";

  const parts: string[] = [
    `${location} konumunda ${action} bir fırsat.`,
  ];
  if (listing.rooms && listing.grossArea) {
    parts.push(`${listing.rooms} planlı, ${listing.grossArea} metrekare.`);
  } else if (listing.rooms) {
    parts.push(`${listing.rooms} planlı ferah bir yaşam alanı.`);
  }
  if (listing.features?.length) {
    parts.push(`${listing.features.slice(0, 3).join(", ")} gibi öne çıkan özellikleriyle.`);
  }
  parts.push(`Fiyatı ${listing.price}.`);
  parts.push("Detaylı bilgi ve randevu için hemen bize ulaşın.");

  // Hedef süreyi aşmayacak kadar cümle al — ilk ve son cümle her zaman kalır
  let text = parts[0];
  for (let i = 1; i < parts.length - 1; i++) {
    if ((text + " " + parts[i] + " " + parts[parts.length - 1]).length > targetChars) break;
    text += " " + parts[i];
  }
  text += " " + parts[parts.length - 1];
  return text;
}
