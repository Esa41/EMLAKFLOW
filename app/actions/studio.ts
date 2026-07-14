"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forTenant } from "@/lib/tenant";
import { isPro, isPremium } from "@/lib/plans";
import { enhanceImage } from "@/lib/ai-provider-registry";
import { putObject, publicUrl, deleteObject } from "@/lib/r2";
import { processListingImage, variantKeys } from "@/lib/images";

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

  // Fotoğraf gerçekten bu ofisin bu ilanına mı ait?
  const media = await prisma.listingMedia.findUnique({
    where: { id: input.mediaId },
    select: {
      id: true,
      url: true,
      width: true,
      listingId: true,
      listing: { select: { tenantId: true } },
    },
  });
  if (
    !media ||
    media.listingId !== input.listingId ||
    media.listing.tenantId !== session.tenantId
  ) {
    return { ok: false, error: "Fotoğraf bulunamadı." };
  }

  // Krediyi düş — iş başarısız olursa aşağıda iade edilir
  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { aiImageCredits: { decrement: 1 } },
  });

  const job = await prisma.studioJob.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      listingId: input.listingId,
      type: "IMAGE_ENHANCE",
      status: "PROCESSING",
      inputMediaId: media.id,
      inputUrl: media.url,
      creditCost: 1,
    },
  });

  try {
    // Fal.ai Clarity Upscaler — kareyi korur, en-boy oranını bozmaz;
    // yalnızca netlik/ışık/detay yükseltir (SDXL kare basıp detay uyduruyordu)
    const result = await enhanceImage({
      sourceImageUrl: media.url,
      sourceWidth: media.width,
    });

    // Fal çıktısı geçici URL'dir — kalıcı olması için R2'ye kopyala
    const res = await fetch(result.imageUrl);
    if (!res.ok) {
      throw new Error(`AI çıktısı indirilemedi (${res.status}).`);
    }
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
    const outputKey = `studio/${session.tenantId}/${job.id}.${ext}`;
    await putObject(outputKey, Buffer.from(await res.arrayBuffer()), contentType);
    const outputUrl = publicUrl(outputKey);

    await prisma.studioJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", outputUrl, outputKey },
    });

    const updatedTenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { aiImageCredits: true },
    });

    revalidatePath("/dashboard/studio");

    return {
      ok: true,
      jobId: job.id,
      outputUrl,
      remainingCredits: updatedTenant?.aiImageCredits ?? 0,
    };
  } catch (err) {
    // Başarısız iş: krediyi iade et, işi FAILED işaretle
    const message = err instanceof Error ? err.message : "AI iyileştirme başarısız.";
    await prisma.$transaction([
      prisma.tenant.update({
        where: { id: session.tenantId },
        data: { aiImageCredits: { increment: 1 } },
      }),
      prisma.studioJob.update({
        where: { id: job.id },
        data: { status: "FAILED", errorMessage: message.slice(0, 500) },
      }),
    ]);

    revalidatePath("/dashboard/studio");
    return { ok: false, error: `İyileştirme başarısız oldu, krediniz iade edildi. (${message.slice(0, 200)})` };
  }
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

  const job = await prisma.studioJob.findFirst({
    where: { id: input.jobId, tenantId: session.tenantId },
    select: {
      outputUrl: true,
      outputKey: true,
      status: true,
      inputMediaId: true,
      listingId: true,
      appliedToListing: true,
    },
  });
  if (!job || job.status !== "COMPLETED" || job.listingId !== input.listingId) {
    return { ok: false, error: "İşlem bulunamadı veya tamamlanmadı." };
  }
  if (!job.outputUrl || !job.outputKey) {
    return { ok: false, error: "AI çıktısı bulunamadı." };
  }
  if (job.appliedToListing) {
    return { ok: false, error: "Bu çıktı zaten ilana uygulanmış." };
  }
  if (job.inputMediaId !== input.originalMediaId) {
    return { ok: false, error: "Fotoğraf eşleşmedi." };
  }

  // Orijinal fotoğraf — sırası ve R2 anahtarları değişimden önce alınır
  const originalMedia = await prisma.listingMedia.findUnique({
    where: { id: input.originalMediaId },
    select: {
      order: true,
      key: true,
      alt: true,
      listingId: true,
      listing: { select: { tenantId: true } },
    },
  });
  if (
    !originalMedia ||
    originalMedia.listingId !== input.listingId ||
    originalMedia.listing.tenantId !== session.tenantId
  ) {
    return { ok: false, error: "Orijinal fotoğraf bulunamadı." };
  }

  // AI çıktısı için thumb/card varyantlarını üret (vitrin performansı).
  // Best-effort: başarısız olursa UI orijinal URL'ye düşer.
  let variants = null;
  try {
    variants = await processListingImage(job.outputKey);
  } catch {
    variants = null;
  }

  // Değişim tek transaction'da: silme ve ekleme ya birlikte olur ya hiç —
  // hiçbir aşamada ilan fotoğrafsız kalmaz.
  await prisma.$transaction([
    prisma.listingMedia.delete({
      where: { id: input.originalMediaId },
    }),
    prisma.listingMedia.create({
      data: {
        listingId: input.listingId,
        url: job.outputUrl,
        key: job.outputKey,
        kind: "photo",
        order: originalMedia.order,
        thumbUrl: variants?.thumbUrl ?? null,
        cardUrl: variants?.cardUrl ?? null,
        width: variants?.width ?? null,
        height: variants?.height ?? null,
        alt: originalMedia.alt,
      },
    }),
    prisma.studioJob.update({
      where: { id: input.jobId },
      data: { appliedToListing: true },
    }),
  ]);

  // Eski fotoğrafın R2 nesnelerini temizle (orijinal + varyantlar) —
  // yer açmak için; best-effort, hata değişimi geri almaz.
  const oldKeys = [originalMedia.key, ...variantKeys(originalMedia.key)];
  await Promise.allSettled(oldKeys.map((k) => deleteObject(k)));

  revalidatePath("/dashboard/studio");
  revalidatePath(`/portfoy/${input.listingId}`);

  return { ok: true };
}

// ── Video Üretimi ──
// Sahne bazlı video akışı app/actions/studio-video.ts dosyasına taşındı
// (StudioProject + VideoScene + Fal.ai Kling kuyruk mutabakatı).
