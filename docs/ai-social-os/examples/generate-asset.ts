/**
 * Example server action — generate a ContentAsset from a Listing.
 * Target path when implementing: app/actions/social-generate.ts
 *
 * Uses existing patterns: getSession, forTenant, AI SDK, plans credits.
 */

import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { buildGenerationSystemPrompt } from "../prompt-library";

// REFERENCE ONLY — do not import from docs/ in production.
// Prefer JSON parse like lib/seo-ai.ts if zod is not a dependency.

const AssetSchema = z.object({
  headline: z.string(),
  caption: z.string(),
  cta: z.string(),
  emojiStrategy: z.string(),
  hashtags: z.array(z.string()),
  seoKeywords: z.array(z.string()),
  imagePrompt: z.object({
    midjourney: z.string(),
    flux: z.string(),
    imagen: z.string(),
    gptImage: z.string(),
    ideogram: z.string(),
  }),
  videoPrompt: z.string(),
  thumbnailIdea: z.string(),
  carouselSlides: z.array(
    z.object({
      order: z.number(),
      text: z.string(),
      visual: z.string(),
    }),
  ),
  storySequence: z.array(
    z.object({
      order: z.number(),
      text: z.string(),
      durationSec: z.number(),
    }),
  ),
  postingRecommendation: z.object({
    platforms: z.array(z.string()),
    bestTimesLocal: z.array(z.string()),
    reason: z.string(),
  }),
});

export async function generateListingAsset(input: {
  listingId: string;
  format: "FEED_POST" | "CAROUSEL" | "REEL" | "STORY";
  tone: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const db = forTenant(session.tenantId);
  const listing = await db.listing.findFirst({
    where: { id: input.listingId },
    include: { media: { take: 8, orderBy: { createdAt: "asc" } } },
  });
  if (!listing) throw new Error("Listing not found");

  // TODO: debit social caption credit (mirror studio credit gates)

  const system = buildGenerationSystemPrompt({
    tone: input.tone,
    format: input.format,
    city: listing.city,
    language: "tr",
  });

  const { object } = await generateObject({
    model: openai("gpt-4.1-mini"),
    schema: AssetSchema,
    system,
    prompt: JSON.stringify({
      title: listing.title,
      purpose: listing.purpose,
      type: listing.type,
      price: listing.price.toString(),
      city: listing.city,
      district: listing.district,
      rooms: listing.rooms,
      netArea: listing.netArea,
      description: listing.description,
      mediaCount: listing.media.length,
    }),
  });

  // Persist when ContentAsset model is merged:
  // return db.contentAsset.create({ data: { ...object, tenantId, listingId, format, tone } })
  return object;
}
