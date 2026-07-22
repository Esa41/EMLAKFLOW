import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { ContentFormat } from "@prisma/client";
import { buildSystemPrompt } from "./prompts";

export type GeneratedAsset = {
  headline: string;
  caption: string;
  cta: string;
  emojiStrategy: string;
  hashtags: string[];
  seoKeywords: string[];
  imagePrompt: {
    midjourney: string;
    flux: string;
    imagen: string;
    gptImage: string;
    ideogram: string;
  };
  videoPrompt: string;
  thumbnailIdea: string;
  carouselSlides: Array<{ order: number; text: string; visual: string }>;
  storySequence: Array<{ order: number; text: string; durationSec: number }>;
  postingRecommendation: {
    platforms: string[];
    bestTimesLocal: string[];
    reason: string;
  };
};

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function parseGenerated(text: string): GeneratedAsset {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const raw = JSON.parse(cleaned) as Record<string, unknown>;
  const ip = (raw.imagePrompt ?? {}) as Record<string, unknown>;
  const pr = (raw.postingRecommendation ?? {}) as Record<string, unknown>;

  return {
    headline: String(raw.headline ?? ""),
    caption: String(raw.caption ?? ""),
    cta: String(raw.cta ?? ""),
    emojiStrategy: String(raw.emojiStrategy ?? ""),
    hashtags: asStringArray(raw.hashtags),
    seoKeywords: asStringArray(raw.seoKeywords),
    imagePrompt: {
      midjourney: String(ip.midjourney ?? ""),
      flux: String(ip.flux ?? ""),
      imagen: String(ip.imagen ?? ""),
      gptImage: String(ip.gptImage ?? ""),
      ideogram: String(ip.ideogram ?? ""),
    },
    videoPrompt: String(raw.videoPrompt ?? ""),
    thumbnailIdea: String(raw.thumbnailIdea ?? ""),
    carouselSlides: Array.isArray(raw.carouselSlides)
      ? (raw.carouselSlides as GeneratedAsset["carouselSlides"])
      : [],
    storySequence: Array.isArray(raw.storySequence)
      ? (raw.storySequence as GeneratedAsset["storySequence"])
      : [],
    postingRecommendation: {
      platforms: asStringArray(pr.platforms),
      bestTimesLocal: asStringArray(pr.bestTimesLocal),
      reason: String(pr.reason ?? ""),
    },
  };
}

export async function generateListingContent(input: {
  listing: {
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
  format: ContentFormat | string;
  tone: string;
  brandVoice?: string | null;
  emojiPolicy?: string | null;
  forbidden?: string[];
}): Promise<GeneratedAsset> {
  const system = buildSystemPrompt({
    brandVoice: input.brandVoice,
    tone: input.tone,
    format: String(input.format),
    city: input.listing.city,
    emojiPolicy: input.emojiPolicy,
    forbidden: input.forbidden,
  });

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system,
    prompt: JSON.stringify({
      title: input.listing.title,
      purpose: input.listing.purpose,
      type: input.listing.type,
      price: input.listing.price,
      currency: input.listing.currency,
      city: input.listing.city,
      district: input.listing.district,
      neighborhood: input.listing.neighborhood,
      rooms: input.listing.rooms,
      netArea: input.listing.netArea,
      grossArea: input.listing.grossArea,
      description: input.listing.description,
      features: input.listing.features ?? [],
    }),
    temperature: 0.7,
  });

  try {
    return parseGenerated(text);
  } catch {
    throw new Error("AI yanıtı JSON olarak ayrıştırılamadı. Tekrar deneyin.");
  }
}
