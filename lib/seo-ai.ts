import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { Listing } from "@prisma/client";
import { TYPE_TR } from "./labels";
import { prisma } from "./prisma";

/**
 * Otomatik AI SEO — ilan verilerinden arama motoru dostu başlık, açıklama ve
 * URL slug'ı üretir. OpenAI erişilemezse deterministik şablona düşer;
 * üretim hiçbir zaman kayıt akışını bloklamaz (route'larda after() ile çalışır).
 */

export interface SeoInput {
  title: string;
  purpose: string; // SALE | RENT
  type: string; // APARTMENT | ...
  city: string;
  district: string;
  neighborhood?: string | null;
  rooms?: string | null;
  netArea?: number | null;
  grossArea?: number | null;
  price?: number | string | null;
  buildingAge?: number | null;
  heating?: string | null;
  features?: string[];
  description?: string | null;
}

export interface SeoResult {
  seoTitle: string;
  seoDescription: string;
  slug: string;
}

const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", I: "i", İ: "i",
  ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
};

/** Türkçe karakterleri sadeleştirip URL dostu slug üretir. */
export function slugify(text: string, maxLen = 60): string {
  return text
    .split("")
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
    .replace(/-+$/g, "");
}

/** AI olmadan çalışan yedek üretim (şablon bazlı). */
function fallbackSeo(l: SeoInput): SeoResult {
  const islem = l.purpose === "SALE" ? "Satılık" : "Kiralık";
  const tip = TYPE_TR[l.type as keyof typeof TYPE_TR] ?? "Gayrimenkul";
  const yer = [l.neighborhood, l.district].filter(Boolean).join(" ");
  const oda = l.rooms ? ` ${l.rooms}` : "";
  const m2 = l.netArea ? ` ${l.netArea} m²` : "";
  const seoTitle = `${yer}'de ${islem}${oda} ${tip}${m2}`.trim();
  const parts = [
    `${[l.neighborhood, l.district, l.city].filter(Boolean).join(", ")} bölgesinde ${islem.toLowerCase()} ${tip.toLowerCase()}`,
    l.rooms ?? "",
    l.netArea ? `net ${l.netArea} m²` : "",
    ...(l.features ?? []).slice(0, 4),
  ].filter(Boolean);
  return {
    seoTitle: seoTitle.slice(0, 70),
    seoDescription: (parts.join(" · ") + ".").slice(0, 160),
    slug: slugify(`${islem} ${oda} ${tip} ${yer}`),
  };
}

export async function generateListingSeo(l: SeoInput): Promise<SeoResult> {
  if (!process.env.OPENAI_API_KEY) return fallbackSeo(l);

  const tip = TYPE_TR[l.type as keyof typeof TYPE_TR] ?? l.type;
  const facts = [
    `Başlık: ${l.title}`,
    `İşlem: ${l.purpose === "SALE" ? "Satılık" : "Kiralık"}`,
    `Tip: ${tip}`,
    `Konum: ${[l.neighborhood, l.district, l.city].filter(Boolean).join(", ")}`,
    l.rooms ? `Oda: ${l.rooms}` : null,
    l.netArea ? `Net m²: ${l.netArea}` : null,
    l.grossArea ? `Brüt m²: ${l.grossArea}` : null,
    l.price ? `Fiyat: ${Number(l.price).toLocaleString("tr-TR")} TL` : null,
    l.buildingAge != null ? `Bina yaşı: ${l.buildingAge}` : null,
    l.heating ? `Isıtma: ${l.heating}` : null,
    l.features?.length ? `Özellikler: ${l.features.join(", ")}` : null,
    l.description ? `Açıklama: ${l.description.slice(0, 500)}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: `Sen Türkiye emlak SEO uzmanısın. Verilen ilan bilgilerinden Google aramasına uygun meta veriler üret.

Kurallar:
- seoTitle: 52-65 karakter; konum + işlem + oda + tip sırası; tıklama tuzağı yok
- seoDescription: 145-158 karakter; somut özellik + konum; doğal Türkçe
- slug: küçük harf, tire, Türkçe karaktersiz, max 6 kelime

SADECE JSON:
{
  "seoTitle": "...",
  "seoDescription": "...",
  "slug": "..."
}`,
      prompt: facts,
      temperature: 0.35,
      maxOutputTokens: 300,
    });

    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Partial<SeoResult>;
    if (!parsed.seoTitle || !parsed.seoDescription) return fallbackSeo(l);
    return {
      seoTitle: String(parsed.seoTitle).slice(0, 70),
      seoDescription: String(parsed.seoDescription).slice(0, 300),
      slug: slugify(String(parsed.slug || parsed.seoTitle)),
    };
  } catch (err) {
    console.error("[seo-ai] üretim hatası, şablona düşülüyor:", err);
    return fallbackSeo(l);
  }
}

type SeoListingRow = Pick<
  Listing,
  | "id"
  | "title"
  | "purpose"
  | "type"
  | "city"
  | "district"
  | "neighborhood"
  | "rooms"
  | "netArea"
  | "grossArea"
  | "price"
  | "buildingAge"
  | "heating"
  | "features"
  | "description"
  | "seoTitle"
  | "seoDescription"
  | "slug"
>;

/**
 * İlanın SEO alanlarını tamamlar (route'larda after() ile arka planda çağrılır).
 * Elle girilmiş değerlerin üzerine YAZMAZ — sadece boş alanları doldurur.
 */
export async function ensureListingSeo(listing: SeoListingRow): Promise<void> {
  if (listing.seoTitle && listing.seoDescription && listing.slug) return;

  // Başlık + açıklama elle girilmiş, sadece slug eksik → AI çağrısı gereksiz
  if (listing.seoTitle && listing.seoDescription) {
    await prisma.listing.update({
      where: { id: listing.id },
      data: { slug: slugify(listing.seoTitle) },
    });
    return;
  }

  const seo = await generateListingSeo({
    title: listing.title,
    purpose: listing.purpose,
    type: listing.type,
    city: listing.city,
    district: listing.district,
    neighborhood: listing.neighborhood,
    rooms: listing.rooms,
    netArea: listing.netArea,
    grossArea: listing.grossArea,
    price: Number(listing.price),
    buildingAge: listing.buildingAge,
    heating: listing.heating,
    features: listing.features,
    description: listing.description,
  });

  await prisma.listing.update({
    where: { id: listing.id },
    data: {
      seoTitle: listing.seoTitle || seo.seoTitle,
      seoDescription: listing.seoDescription || seo.seoDescription,
      slug: listing.slug || seo.slug,
    },
  });
}
