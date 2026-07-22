"use server";

import { revalidatePath } from "next/cache";
import type { ContentFormat, SocialPlatform } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forTenant } from "@/lib/tenant";
import { generateListingContent } from "@/lib/social-os/generate";

const FORMATS = new Set([
  "FEED_POST",
  "CAROUSEL",
  "STORY",
  "REEL",
  "LINKEDIN_POST",
  "GBP_POST",
  "TIKTOK",
  "SHORT",
]);

export async function upsertBrandKit(input: {
  voice?: string;
  mission?: string;
  vision?: string;
  photographyStyle?: string;
  emojiPolicy?: string;
  tonePresets?: string[];
  values?: string[];
  forbiddenPhrases?: string[];
  quietHoursStart?: number | null;
  quietHoursEnd?: number | null;
  timezone?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Oturum gerekli");
  const data = {
    voice: input.voice?.trim() || null,
    mission: input.mission?.trim() || null,
    vision: input.vision?.trim() || null,
    photographyStyle: input.photographyStyle?.trim() || null,
    emojiPolicy: input.emojiPolicy?.trim() || "moderate",
    tonePresets: input.tonePresets ?? [],
    values: input.values ?? [],
    forbiddenPhrases: input.forbiddenPhrases ?? [],
    quietHoursStart: input.quietHoursStart ?? null,
    quietHoursEnd: input.quietHoursEnd ?? null,
    timezone: input.timezone?.trim() || "Europe/Istanbul",
  };

  await prisma.brandKit.upsert({
    where: { tenantId: session.tenantId },
    create: { tenantId: session.tenantId, ...data },
    update: data,
  });

  revalidatePath("/sosyal/marka");
  revalidatePath("/sosyal");
  return { ok: true as const };
}

export async function generateSocialAsset(input: {
  listingId: string;
  format: string;
  tone: string;
  /** Stüdyo videosu / seçili medya — yoksa ilan fotoğrafları */
  mediaUrls?: string[];
  studioProjectId?: string | null;
  studioJobId?: string | null;
}) {
  const session = await getSession();
  if (!session) throw new Error("Oturum gerekli");
  if (!FORMATS.has(input.format)) throw new Error("Geçersiz format");

  const db = forTenant(session.tenantId);
  const listing = await db.listing.findFirst({
    where: { id: input.listingId },
    select: {
      id: true,
      title: true,
      purpose: true,
      type: true,
      price: true,
      currency: true,
      city: true,
      district: true,
      neighborhood: true,
      rooms: true,
      netArea: true,
      grossArea: true,
      description: true,
      features: true,
      media: { take: 6, orderBy: { order: "asc" }, select: { url: true } },
    },
  });
  if (!listing) throw new Error("İlan bulunamadı");

  const brand = await db.brandKit.findUnique({
    where: { tenantId: session.tenantId },
  });

  const generated = await generateListingContent({
    listing: {
      ...listing,
      price: listing.price.toString(),
    },
    format: input.format,
    tone: input.tone,
    brandVoice: brand?.voice,
    emojiPolicy: brand?.emojiPolicy,
    forbidden: brand?.forbiddenPhrases ?? [],
  });

  const mediaUrls =
    input.mediaUrls && input.mediaUrls.length > 0
      ? input.mediaUrls
      : listing.media.map((m) => m.url);

  const asset = await db.contentAsset.create({
    data: {
      tenantId: session.tenantId,
      listingId: listing.id,
      format: input.format as ContentFormat,
      status: "DRAFT",
      title: generated.headline || listing.title,
      headline: generated.headline,
      caption: generated.caption,
      cta: generated.cta,
      emojiStrategy: generated.emojiStrategy,
      hashtags: generated.hashtags,
      seoKeywords: generated.seoKeywords,
      imagePrompt: generated.imagePrompt,
      videoPrompt: generated.videoPrompt,
      thumbnailIdea: generated.thumbnailIdea,
      carouselSlides: generated.carouselSlides,
      storySequence: generated.storySequence,
      postingRec: generated.postingRecommendation,
      mediaUrls,
      tone: input.tone,
      createdById: session.userId,
      studioProjectId: input.studioProjectId ?? null,
      studioJobId: input.studioJobId ?? null,
    },
  });

  revalidatePath("/sosyal");
  revalidatePath("/sosyal/planlayici");
  revalidatePath("/sosyal/takvim");
  revalidatePath("/sosyal/medya");
  return { ok: true as const, assetId: asset.id };
}

/** Stüdyo videosunu Sosyal OS’a aktar — REEL caption üretir, medyayı bağlar. */
export async function sendStudioToSocial(input: {
  studioProjectId?: string;
  studioJobId?: string;
  tone?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Oturum gerekli");
  const db = forTenant(session.tenantId);

  let listingId: string;
  let videoUrl: string;
  let studioProjectId: string | null = null;
  let studioJobId: string | null = null;

  if (input.studioProjectId) {
    const project = await db.studioProject.findFirst({
      where: { id: input.studioProjectId },
      select: { id: true, listingId: true, finalVideoUrl: true },
    });
    if (!project?.finalVideoUrl) throw new Error("Video henüz hazır değil");
    listingId = project.listingId;
    videoUrl = project.finalVideoUrl;
    studioProjectId = project.id;
  } else if (input.studioJobId) {
    const job = await db.studioJob.findFirst({
      where: { id: input.studioJobId, status: "COMPLETED" },
      select: { id: true, listingId: true, outputUrl: true },
    });
    if (!job?.outputUrl) throw new Error("Video bulunamadı");
    listingId = job.listingId;
    videoUrl = job.outputUrl;
    studioJobId = job.id;
  } else {
    throw new Error("Proje veya iş gerekli");
  }

  return generateSocialAsset({
    listingId,
    format: "REEL",
    tone: input.tone ?? "premium",
    mediaUrls: [videoUrl],
    studioProjectId,
    studioJobId,
  });
}

export async function scheduleAsset(input: {
  assetId: string;
  platform: SocialPlatform;
  scheduledAt: string; // ISO
}) {
  const session = await getSession();
  if (!session) throw new Error("Oturum gerekli");
  const db = forTenant(session.tenantId);

  const asset = await db.contentAsset.findFirst({
    where: { id: input.assetId },
  });
  if (!asset) throw new Error("İçerik bulunamadı");

  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) throw new Error("Geçersiz tarih");

  const item = await db.calendarItem.create({
    data: {
      tenantId: session.tenantId,
      assetId: asset.id,
      platform: input.platform,
      status: "QUEUED",
      scheduledAt,
    },
  });

  await db.contentAsset.update({
    where: { id: asset.id },
    data: { status: "SCHEDULED" },
  });

  revalidatePath("/sosyal/takvim");
  revalidatePath("/sosyal");
  return { ok: true as const, id: item.id };
}

export async function updateAssetCaption(input: {
  assetId: string;
  caption: string;
  headline?: string;
  cta?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Oturum gerekli");
  const db = forTenant(session.tenantId);

  await db.contentAsset.updateMany({
    where: { id: input.assetId },
    data: {
      caption: input.caption,
      headline: input.headline,
      cta: input.cta,
    },
  });

  revalidatePath("/sosyal/planlayici");
  return { ok: true as const };
}
