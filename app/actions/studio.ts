"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forTenant } from "@/lib/tenant";
import { isPro, isPremium } from "@/lib/plans";

// ── Plan bazlı aylık kredi limitleri ──
const PLAN_CREDITS = {
  pro:     { image: 300, video: 10 },
  premium: { image: 1000, video: 30 },
  free:    { image: 0, video: 0 },
} as const;

/** Aylık kredi reset kontrolü — gerekirse kredileri sıfırlar ve yeni hakları yazar. */
async function ensureMonthlyReset(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true, aiCreditsResetAt: true, aiImageCredits: true, aiVideoCredits: true },
  });
  if (!tenant) return;

  const now = new Date();
  const resetAt = tenant.aiCreditsResetAt;
  const resetMonth = resetAt.getMonth();
  const resetYear = resetAt.getFullYear();

  // Ay değişmişse reset yap
  if (now.getMonth() !== resetMonth || now.getFullYear() !== resetYear) {
    const planKey = isPremium(tenant.plan) ? "premium" : isPro(tenant.plan) ? "pro" : "free";
    const limits = PLAN_CREDITS[planKey];

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        aiImageCredits: limits.image,
        aiVideoCredits: limits.video,
        aiCreditsResetAt: now,
      },
    });
  }
}

// ── Veri çekme ──

export type StudioListing = {
  id: string;
  refCode: string;
  title: string;
  city: string;
  district: string;
  type: string;
  media: {
    id: string;
    url: string;
    key: string;
    thumbUrl: string | null;
    cardUrl: string | null;
    kind: string;
    order: number;
  }[];
};

export type StudioCredits = {
  imageCredits: number;
  videoCredits: number;
  plan: string;
};

export type StudioJobItem = {
  id: string;
  type: string;
  status: string;
  inputUrl: string | null;
  outputUrl: string | null;
  videoConceptKey: string | null;
  creditCost: number;
  appliedToListing: boolean;
  createdAt: string;
  listing: { refCode: string; title: string } | null;
};

export async function getStudioCredits(): Promise<StudioCredits | null> {
  const session = await getSession();
  if (!session) return null;

  await ensureMonthlyReset(session.tenantId);

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { aiImageCredits: true, aiVideoCredits: true, plan: true },
  });
  if (!tenant) return null;

  return {
    imageCredits: tenant.aiImageCredits,
    videoCredits: tenant.aiVideoCredits,
    plan: tenant.plan,
  };
}

export async function getStudioListings(): Promise<StudioListing[]> {
  const session = await getSession();
  if (!session) return [];

  const db = forTenant(session.tenantId);
  const listings = await db.listing.findMany({
    where: { status: { in: ["ACTIVE", "DRAFT"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      refCode: true,
      title: true,
      city: true,
      district: true,
      type: true,
      media: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          url: true,
          key: true,
          thumbUrl: true,
          cardUrl: true,
          kind: true,
          order: true,
        },
      },
    },
  });

  return listings;
}

export async function getStudioHistory(listingId?: string): Promise<StudioJobItem[]> {
  const session = await getSession();
  if (!session) return [];

  const db = forTenant(session.tenantId);
  const jobs = await db.studioJob.findMany({
    where: listingId ? { listingId } : {},
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      type: true,
      status: true,
      inputUrl: true,
      outputUrl: true,
      videoConceptKey: true,
      creditCost: true,
      appliedToListing: true,
      createdAt: true,
      listing: { select: { refCode: true, title: true } },
    },
  });

  return jobs.map((j) => ({
    ...j,
    createdAt: j.createdAt.toISOString(),
  }));
}

// ── Fotoğraf İyileştirme ──

type EnhanceResult =
  | { ok: true; jobId: string; outputUrl: string; remainingCredits: number }
  | { ok: false; error: string };

export async function enhancePhoto(input: {
  listingId: string;
  mediaId: string;
  mediaUrl: string;
}): Promise<EnhanceResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Oturum bulunamadı." };

  await ensureMonthlyReset(session.tenantId);

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { aiImageCredits: true, plan: true },
  });
  if (!tenant) return { ok: false, error: "Ofis bulunamadı." };

  if (!isPro(tenant.plan)) {
    return { ok: false, error: "AI Stüdyo Pro veya Premium plan gerektirir." };
  }

  if (tenant.aiImageCredits < 1) {
    return { ok: false, error: "Fotoğraf iyileştirme krediniz kalmadı. Aylık yenilenme bekleniyor." };
  }

  // Krediyi düş
  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { aiImageCredits: { decrement: 1 } },
  });

  // StudioJob kaydı oluştur
  const job = await prisma.studioJob.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      listingId: input.listingId,
      type: "IMAGE_ENHANCE",
      status: "COMPLETED", // Stub: hemen tamamlandı olarak işaretle
      inputMediaId: input.mediaId,
      inputUrl: input.mediaUrl,
      outputUrl: input.mediaUrl, // Stub: aynı URL'yi döndür (gerçek AI entegrasyonunda değişecek)
      creditCost: 1,
    },
  });

  const updatedTenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { aiImageCredits: true },
  });

  revalidatePath("/dashboard/studio");

  return {
    ok: true,
    jobId: job.id,
    outputUrl: job.outputUrl!,
    remainingCredits: updatedTenant?.aiImageCredits ?? 0,
  };
}

// ── İlana Uygulama ──

type ApplyResult =
  | { ok: true }
  | { ok: false; error: string };

export async function applyEnhancedPhoto(input: {
  jobId: string;
  listingId: string;
  originalMediaId: string;
}): Promise<ApplyResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Oturum bulunamadı." };

  const db = forTenant(session.tenantId);

  const job = await db.studioJob.findUnique({
    where: { id: input.jobId },
    select: { outputUrl: true, outputKey: true, status: true },
  });
  if (!job || job.status !== "COMPLETED") {
    return { ok: false, error: "İşlem bulunamadı veya tamamlanmadı." };
  }
  if (!job.outputUrl) {
    return { ok: false, error: "AI çıktısı bulunamadı." };
  }

  // Orijinal fotoğrafın sırasını al
  const originalMedia = await prisma.listingMedia.findUnique({
    where: { id: input.originalMediaId },
    select: { order: true, key: true },
  });
  const order = originalMedia?.order ?? 0;

  // İşlemi transaction ile yap
  // 1. Orijinal medyayı sil
  await prisma.listingMedia.delete({
    where: { id: input.originalMediaId },
  });

  // 2. AI çıktısını yeni medya olarak ekle (aynı sırada)
  await prisma.listingMedia.create({
    data: {
      listingId: input.listingId,
      url: job.outputUrl,
      key: job.outputKey ?? `studio/${input.jobId}`,
      kind: "photo",
      order,
    },
  });

  // 3. Job'u güncelle
  await db.studioJob.update({
    where: { id: input.jobId },
    data: { appliedToListing: true },
  });

  revalidatePath("/dashboard/studio");
  revalidatePath(`/portfoy/${input.listingId}`);

  return { ok: true };
}

// ── Video Üretimi ──

type VideoResult =
  | { ok: true; jobId: string; remainingCredits: number }
  | { ok: false; error: string };

export async function requestVideoGeneration(input: {
  listingId: string;
  conceptKey: string; // "drone" | "interior" | "social"
  selectedMediaIds: string[];
}): Promise<VideoResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Oturum bulunamadı." };

  await ensureMonthlyReset(session.tenantId);

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { aiVideoCredits: true, plan: true },
  });
  if (!tenant) return { ok: false, error: "Ofis bulunamadı." };

  if (!isPro(tenant.plan)) {
    return { ok: false, error: "AI Stüdyo Pro veya Premium plan gerektirir." };
  }

  if (tenant.aiVideoCredits < 1) {
    return { ok: false, error: "Video üretim krediniz kalmadı. Aylık yenilenme bekleniyor." };
  }

  if (!input.selectedMediaIds.length) {
    return { ok: false, error: "En az bir fotoğraf seçmelisiniz." };
  }

  // Krediyi düş
  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { aiVideoCredits: { decrement: 1 } },
  });

  // StudioJob kaydı oluştur — PENDING durumunda (Python backend işleyecek)
  const job = await prisma.studioJob.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      listingId: input.listingId,
      type: "VIDEO_GENERATE",
      status: "PENDING",
      videoConceptKey: input.conceptKey,
      selectedMediaIds: input.selectedMediaIds,
      creditCost: 1,
    },
  });

  const updatedTenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { aiVideoCredits: true },
  });

  // TODO: Burada Python video API'sine QStash/webhook ile task gönderilecek
  // await qstash.publishJSON({ url: VIDEO_API_ENDPOINT, body: { jobId: job.id, ... } })

  revalidatePath("/dashboard/studio");

  return {
    ok: true,
    jobId: job.id,
    remainingCredits: updatedTenant?.aiVideoCredits ?? 0,
  };
}
