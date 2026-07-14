// ── AI Stüdyo Prompt Kütüphanesi ──
// Kullanıcı serbest prompt yazmaz: konsept seçer, sistem her sahne için
// Kling'in iyi anladığı standart İngilizce prompt'u üretir. Böylece
// sahneler tutarlı çıkar ve "prompt karışıklığı" yaşanmaz.

export type VideoConceptKey = "drone" | "interior" | "social";

type ConceptDefinition = {
  label: string;
  aspectRatio: "16:9" | "9:16";
  /** Sahne sırasına göre kamera hareketi çeşitlemesi — art arda aynı
   *  hareket monoton durduğu için sahne index'i ile dönüşümlü seçilir. */
  motions: string[];
  /** Her sahne prompt'unun sonuna eklenen ortak stil çapası */
  style: string;
};

const CONCEPTS: Record<VideoConceptKey, ConceptDefinition> = {
  drone: {
    label: "Drone Uçuşu",
    aspectRatio: "16:9",
    motions: [
      "slow aerial push-in towards the property, gentle descent",
      "smooth lateral drone pan across the landscape",
      "slow rising crane shot revealing the surroundings",
    ],
    style:
      "cinematic drone footage, golden hour sunlight, photorealistic, " +
      "smooth stabilized motion, high dynamic range",
  },
  interior: {
    label: "Ev İçi Tur",
    aspectRatio: "16:9",
    motions: [
      "slow steady walk-through push forward into the room",
      "gentle pan from left to right revealing the space",
      "slow push-in towards the window, natural parallax",
    ],
    style:
      "real estate interior video tour, bright natural daylight, " +
      "photorealistic, steady gimbal movement, inviting atmosphere, " +
      "no people, furniture and room layout unchanged",
  },
  social: {
    label: "Sosyal Medya",
    aspectRatio: "9:16",
    motions: [
      "dynamic slow zoom-in with subtle drift",
      "smooth vertical reveal tilting up",
      "gentle orbit motion around the focal point",
    ],
    style:
      "eye-catching vertical social media property showcase, vibrant colors, " +
      "crisp details, photorealistic, smooth cinematic motion, no text overlays",
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
