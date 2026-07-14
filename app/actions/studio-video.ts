"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPro, isPremium } from "@/lib/plans";
import {
  generateVideo,
  getVideoStatus,
  getVideoResult,
  mergeVideoWithAudio,
  getMergeResult,
  generateVoice,
  FFMPEG_COMPOSE_MODEL,
} from "@/lib/ai-provider-registry";
import { putObject, publicUrl } from "@/lib/r2";
import {
  buildScenePrompt,
  buildSceneNegativePrompt,
  buildVoiceoverText,
  getConcept,
} from "@/lib/studio-prompts";

// Proje başına sahne üst sınırı — hem maliyet hem action süresi güvencesi
const MAX_SCENES = 8;

// ── UI'ya dönen görünümler ──

export type StudioSceneView = {
  id: string;
  order: number;
  status: string; // PENDING | PROCESSING | COMPLETED | FAILED
  sourceImageUrl: string;
  sourceThumbUrl: string | null;
  outputUrl: string | null;
  errorMessage: string | null;
  durationSec: number;
};

export type StudioProjectView = {
  id: string;
  title: string;
  status: string; // DRAFT | RENDERING | COMPLETED | FAILED
  aspectRatio: string;
  voiceText: string | null;
  voiceUrl: string | null;
  finalVideoUrl: string | null;
  errorMessage: string | null;
  merging: boolean; // aktif VIDEO_MERGE işi sürüyor mu
  scenes: StudioSceneView[];
};

type ProjectResult =
  | { ok: true; project: StudioProjectView; remainingCredits?: number }
  | { ok: false; error: string };

// ── Yardımcılar ──

async function copyUrlToR2(url: string, key: string, fallbackType: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Çıktı indirilemedi (${res.status}).`);
  const contentType = res.headers.get("content-type") ?? fallbackType;
  await putObject(key, Buffer.from(await res.arrayBuffer()), contentType);
  return publicUrl(key);
}

function formatPrice(price: unknown, currency: string): string {
  const n = Number(price);
  const formatted = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n);
  return `${formatted} ${currency === "TRY" ? "TL" : currency}`;
}

async function toProjectView(projectId: string): Promise<StudioProjectView | null> {
  const p = await prisma.studioProject.findUnique({
    where: { id: projectId },
    include: {
      scenes: {
        orderBy: { order: "asc" },
        include: { sourceImage: { select: { thumbUrl: true } } },
      },
      jobs: {
        where: { type: "VIDEO_MERGE", status: { in: ["PENDING", "PROCESSING"] } },
        select: { id: true },
      },
    },
  });
  if (!p) return null;

  return {
    id: p.id,
    title: p.title,
    status: p.status,
    aspectRatio: p.aspectRatio,
    voiceText: p.voiceText,
    voiceUrl: p.voiceUrl,
    finalVideoUrl: p.finalVideoUrl,
    errorMessage: p.errorMessage,
    merging: p.jobs.length > 0,
    scenes: p.scenes.map((s) => ({
      id: s.id,
      order: s.order,
      status: s.status,
      sourceImageUrl: s.sourceImageUrl,
      sourceThumbUrl: s.sourceImage?.thumbUrl ?? null,
      outputUrl: s.outputUrl,
      errorMessage: s.errorMessage,
      durationSec: s.durationSec,
    })),
  };
}

/** Sahne için Fal Kling işi başlatır; job'a requestId yazar. */
async function submitScene(
  scene: { id: string; prompt: string; sourceImageUrl: string; durationSec: number; jobId: string | null },
  aspectRatio: string,
  negativePrompt: string,
) {
  const { requestId } = await generateVideo(scene.id, scene.prompt, {
    provider: "FAL_KLING",
    sourceImageUrl: scene.sourceImageUrl,
    durationSec: scene.durationSec === 10 ? 10 : 5,
    aspectRatio: aspectRatio as "16:9" | "9:16",
    negativePrompt,
  });
  if (scene.jobId) {
    await prisma.studioJob.update({
      where: { id: scene.jobId },
      data: { externalRequestId: requestId, status: "PROCESSING" },
    });
  }
}

// ── 1) Proje oluşturma — seçilen her fotoğraf bir sahne olur ──

export async function createStudioProject(input: {
  listingId: string;
  conceptKey: string;
  selectedMediaIds: string[];
}): Promise<ProjectResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Oturum bulunamadı." };

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { aiVideoCredits: true, plan: true },
  });
  if (!tenant) return { ok: false, error: "Ofis bulunamadı." };
  if (!isPro(tenant.plan) && !isPremium(tenant.plan)) {
    return { ok: false, error: "AI Stüdyo Pro veya Premium plan gerektirir." };
  }

  const mediaIds = input.selectedMediaIds.slice(0, MAX_SCENES);
  if (!mediaIds.length) {
    return { ok: false, error: "En az bir fotoğraf seçmelisiniz." };
  }

  const cost = mediaIds.length; // sahne başına 1 video kredisi
  if (tenant.aiVideoCredits < cost) {
    return {
      ok: false,
      error: `Bu video ${cost} kredi gerektirir, kalan krediniz ${tenant.aiVideoCredits}.`,
    };
  }

  // Fotoğraflar gerçekten bu ofisin bu ilanına mı ait?
  const listing = await prisma.listing.findFirst({
    where: { id: input.listingId, tenantId: session.tenantId },
    select: {
      id: true,
      refCode: true,
      title: true,
      city: true,
      district: true,
      neighborhood: true,
      rooms: true,
      grossArea: true,
      price: true,
      currency: true,
      purpose: true,
      features: true,
      media: {
        where: { id: { in: mediaIds }, kind: "photo" },
        select: { id: true, url: true },
      },
    },
  });
  if (!listing || listing.media.length !== mediaIds.length) {
    return { ok: false, error: "Seçilen fotoğraflar doğrulanamadı." };
  }
  const mediaById = new Map(listing.media.map((m) => [m.id, m]));

  const concept = getConcept(input.conceptKey);
  const voiceText = buildVoiceoverText(
    {
      title: listing.title,
      city: listing.city,
      district: listing.district,
      neighborhood: listing.neighborhood,
      rooms: listing.rooms,
      grossArea: listing.grossArea,
      price: formatPrice(listing.price, listing.currency),
      purpose: listing.purpose,
      features: listing.features,
    },
    mediaIds.length,
  );

  // Krediyi düş — sahne bazında başarısızlıkta tek tek iade edilir
  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { aiVideoCredits: { decrement: cost } },
  });

  const project = await prisma.studioProject.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      listingId: listing.id,
      title: `${concept.label} — ${listing.refCode}`,
      status: "RENDERING",
      conceptKey: input.conceptKey,
      aspectRatio: concept.aspectRatio,
      voiceText,
      voiceProvider: "ELEVENLABS",
    },
  });

  // Sahneleri sırayla oluştur ve Fal kuyruğuna gönder
  for (let i = 0; i < mediaIds.length; i++) {
    const media = mediaById.get(mediaIds[i])!;
    const prompt = buildScenePrompt(input.conceptKey, i);

    const job = await prisma.studioJob.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        listingId: listing.id,
        projectId: project.id,
        type: "VIDEO_GENERATE",
        status: "PROCESSING",
        inputMediaId: media.id,
        inputUrl: media.url,
        videoConceptKey: input.conceptKey,
        creditCost: 1,
      },
    });

    const scene = await prisma.videoScene.create({
      data: {
        projectId: project.id,
        order: i,
        sourceImageId: media.id,
        sourceImageUrl: media.url,
        prompt,
        provider: "FAL_KLING",
        durationSec: 5,
        status: "PROCESSING",
        jobId: job.id,
      },
    });

    try {
      await submitScene(
        { id: scene.id, prompt, sourceImageUrl: media.url, durationSec: 5, jobId: job.id },
        concept.aspectRatio,
        buildSceneNegativePrompt(input.conceptKey),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Render başlatılamadı.";
      await prisma.$transaction([
        prisma.videoScene.update({
          where: { id: scene.id },
          data: { status: "FAILED", errorMessage: message.slice(0, 500) },
        }),
        prisma.studioJob.update({
          where: { id: job.id },
          data: { status: "FAILED", errorMessage: message.slice(0, 500) },
        }),
        prisma.tenant.update({
          where: { id: session.tenantId },
          data: { aiVideoCredits: { increment: 1 } },
        }),
      ]);
    }
  }

  const updated = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { aiVideoCredits: true },
  });
  revalidatePath("/dashboard/studio");

  const view = await toProjectView(project.id);
  return view
    ? { ok: true, project: view, remainingCredits: updated?.aiVideoCredits ?? 0 }
    : { ok: false, error: "Proje oluşturulamadı." };
}

// ── 2) Durum sorgulama + Fal ile mutabakat (UI polling buraya gelir) ──

export async function getStudioProject(projectId: string): Promise<ProjectResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Oturum bulunamadı." };

  const project = await prisma.studioProject.findFirst({
    where: { id: projectId, tenantId: session.tenantId },
    include: {
      scenes: {
        where: { status: "PROCESSING" },
        include: { job: { select: { id: true, externalRequestId: true } } },
      },
      jobs: {
        where: { type: "VIDEO_MERGE", status: "PROCESSING" },
        select: { id: true, externalRequestId: true },
      },
    },
  });
  if (!project) return { ok: false, error: "Proje bulunamadı." };

  // İşlemdeki sahneleri Fal ile mutabakata al
  for (const scene of project.scenes) {
    const requestId = scene.job?.externalRequestId;
    if (!requestId) continue;

    try {
      const { status } = await getVideoStatus(requestId, { provider: "FAL_KLING" });
      if (status !== "COMPLETED") continue;

      const { videoUrl } = await getVideoResult(requestId, { provider: "FAL_KLING" });
      const key = `studio/${session.tenantId}/scenes/${scene.id}.mp4`;
      const outputUrl = await copyUrlToR2(videoUrl, key, "video/mp4");

      await prisma.$transaction([
        prisma.videoScene.update({
          where: { id: scene.id },
          data: { status: "COMPLETED", outputUrl, outputKey: key, errorMessage: null },
        }),
        prisma.studioJob.update({
          where: { id: scene.job!.id },
          data: { status: "COMPLETED", outputUrl, outputKey: key },
        }),
      ]);
    } catch (err) {
      // Sonuç alınamadı = render başarısız → sahneyi FAILED yap, krediyi iade et
      const message = err instanceof Error ? err.message : "Render başarısız.";
      await prisma.$transaction([
        prisma.videoScene.update({
          where: { id: scene.id },
          data: { status: "FAILED", errorMessage: message.slice(0, 500) },
        }),
        prisma.studioJob.update({
          where: { id: scene.job!.id },
          data: { status: "FAILED", errorMessage: message.slice(0, 500) },
        }),
        prisma.tenant.update({
          where: { id: session.tenantId },
          data: { aiVideoCredits: { increment: 1 } },
        }),
      ]);
    }
  }

  // Birleştirme işini mutabakata al
  const mergeJob = project.jobs[0];
  if (mergeJob?.externalRequestId) {
    try {
      const { status } = await getVideoStatus(mergeJob.externalRequestId, {
        provider: "FAL_KLING",
        model: FFMPEG_COMPOSE_MODEL,
      });
      if (status === "COMPLETED") {
        const { videoUrl } = await getMergeResult(mergeJob.externalRequestId);
        const key = `studio/${session.tenantId}/final/${project.id}.mp4`;
        const finalVideoUrl = await copyUrlToR2(videoUrl, key, "video/mp4");

        await prisma.$transaction([
          prisma.studioProject.update({
            where: { id: project.id },
            data: { status: "COMPLETED", finalVideoUrl, finalVideoKey: key, errorMessage: null },
          }),
          prisma.studioJob.update({
            where: { id: mergeJob.id },
            data: { status: "COMPLETED", outputUrl: finalVideoUrl, outputKey: key },
          }),
        ]);
        revalidatePath("/dashboard/studio");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Birleştirme başarısız.";
      await prisma.$transaction([
        prisma.studioProject.update({
          where: { id: project.id },
          data: { errorMessage: message.slice(0, 500) },
        }),
        prisma.studioJob.update({
          where: { id: mergeJob.id },
          data: { status: "FAILED", errorMessage: message.slice(0, 500) },
        }),
      ]);
    }
  }

  const view = await toProjectView(projectId);
  return view ? { ok: true, project: view } : { ok: false, error: "Proje bulunamadı." };
}

/** İlanın en son projesi — sekme açılınca devam eden işi göstermek için. */
export async function getLatestStudioProject(
  listingId: string,
): Promise<StudioProjectView | null> {
  const session = await getSession();
  if (!session) return null;

  const project = await prisma.studioProject.findFirst({
    where: { listingId, tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!project) return null;

  return toProjectView(project.id);
}

// ── 3) Tek sahneyi yeniden üretme ──

export async function regenerateScene(sceneId: string): Promise<ProjectResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Oturum bulunamadı." };

  const scene = await prisma.videoScene.findFirst({
    where: { id: sceneId, project: { tenantId: session.tenantId } },
    include: {
      project: {
        select: { id: true, listingId: true, aspectRatio: true, conceptKey: true },
      },
    },
  });
  if (!scene) return { ok: false, error: "Sahne bulunamadı." };
  if (scene.status === "PROCESSING") {
    return { ok: false, error: "Bu sahne zaten işleniyor." };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { aiVideoCredits: true },
  });
  if (!tenant || tenant.aiVideoCredits < 1) {
    return { ok: false, error: "Video krediniz kalmadı." };
  }

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { aiVideoCredits: { decrement: 1 } },
  });

  const job = await prisma.studioJob.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      listingId: scene.project.listingId,
      projectId: scene.project.id,
      type: "VIDEO_GENERATE",
      status: "PROCESSING",
      inputMediaId: scene.sourceImageId,
      inputUrl: scene.sourceImageUrl,
      creditCost: 1,
    },
  });

  // Aktif iş göstergesini yeni işe çevir, eski çıktıyı temizle
  await prisma.videoScene.update({
    where: { id: scene.id },
    data: { jobId: job.id, status: "PROCESSING", outputUrl: null, outputKey: null, errorMessage: null },
  });

  try {
    await submitScene(
      {
        id: scene.id,
        prompt: scene.prompt,
        sourceImageUrl: scene.sourceImageUrl,
        durationSec: scene.durationSec,
        jobId: job.id,
      },
      scene.project.aspectRatio,
      buildSceneNegativePrompt(scene.project.conceptKey ?? "interior"),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Render başlatılamadı.";
    await prisma.$transaction([
      prisma.videoScene.update({
        where: { id: scene.id },
        data: { status: "FAILED", errorMessage: message.slice(0, 500) },
      }),
      prisma.studioJob.update({
        where: { id: job.id },
        data: { status: "FAILED", errorMessage: message.slice(0, 500) },
      }),
      prisma.tenant.update({
        where: { id: session.tenantId },
        data: { aiVideoCredits: { increment: 1 } },
      }),
    ]);
  }

  const view = await toProjectView(scene.project.id);
  return view ? { ok: true, project: view } : { ok: false, error: "Proje bulunamadı." };
}

// ── 4) Seslendirme + birleştirme ──

export async function mergeProject(input: {
  projectId: string;
  voiceText?: string; // kullanıcı düzenlediyse güncel metin; boş string = sessiz video
}): Promise<ProjectResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Oturum bulunamadı." };

  const project = await prisma.studioProject.findFirst({
    where: { id: input.projectId, tenantId: session.tenantId },
    include: {
      scenes: { orderBy: { order: "asc" } },
      jobs: {
        where: { type: "VIDEO_MERGE", status: { in: ["PENDING", "PROCESSING"] } },
        select: { id: true },
      },
    },
  });
  if (!project) return { ok: false, error: "Proje bulunamadı." };
  if (project.jobs.length > 0) {
    return { ok: false, error: "Birleştirme zaten sürüyor." };
  }

  const completed = project.scenes.filter((s) => s.status === "COMPLETED");
  if (!completed.length || completed.length !== project.scenes.length) {
    return { ok: false, error: "Tüm sahneler tamamlanmadan birleştirme yapılamaz." };
  }

  const voiceText = input.voiceText !== undefined ? input.voiceText.trim() : (project.voiceText ?? "");

  try {
    // Seslendirme (metin boşsa sessiz video)
    let voiceUrl: string | null = null;
    if (voiceText) {
      const voice = await generateVoice(voiceText, { provider: "ELEVENLABS" });
      const voiceKey = `studio/${session.tenantId}/voice/${project.id}.mp3`;
      await putObject(voiceKey, voice.buffer, voice.mimeType);
      voiceUrl = publicUrl(voiceKey);
      await prisma.studioProject.update({
        where: { id: project.id },
        data: { voiceText, voiceUrl, voiceKey },
      });
    } else {
      await prisma.studioProject.update({
        where: { id: project.id },
        data: { voiceText: null, voiceUrl: null, voiceKey: null },
      });
    }

    // Birleştirme işini kuyruğa gönder
    const { requestId } = await mergeVideoWithAudio(
      completed.map((s) => ({ videoUrl: s.outputUrl!, durationSec: s.durationSec })),
      voiceUrl,
    );

    await prisma.studioJob.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        listingId: project.listingId,
        projectId: project.id,
        type: "VIDEO_MERGE",
        status: "PROCESSING",
        externalRequestId: requestId,
        creditCost: 0, // birleştirme kredi düşmez
      },
    });

    await prisma.studioProject.update({
      where: { id: project.id },
      data: { status: "RENDERING", errorMessage: null },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Birleştirme başlatılamadı.";
    await prisma.studioProject.update({
      where: { id: project.id },
      data: { errorMessage: message.slice(0, 500) },
    });
    return { ok: false, error: message.slice(0, 300) };
  }

  const view = await toProjectView(project.id);
  return view ? { ok: true, project: view } : { ok: false, error: "Proje bulunamadı." };
}
