// ── AI Stüdyo: Fal.ai Mutabakat Katmanı (session-free) ──
// İşlemdeki sahne/birleştirme işlerini Fal kuyruğuyla mutabakata alır:
// tamamlanmışsa çıktıyı R2'ye kopyalar, başarısızsa krediyi iade eder.
//
// İki yerden çağrılır:
//   1) getStudioProject (kullanıcı UI polling'i) — anlık geri bildirim
//   2) /api/cron/studio-reconcile (arka plan backstop) — kullanıcı sekmeyi
//      kapatsa bile videonun tamamlanmasını garanti eder
//
// Tüm durum geçişleri "claim" (koşullu updateMany) ile yapılır: aynı sahneyi
// iki süreç (polling + cron, ya da iki sekme) aynı anda mutabakata alırsa
// yalnızca ilki geçişi kazanır — böylece çift kredi iadesi / çift tamamlama
// imkânsızlaşır. R2 kopyalama idempotent'tir (aynı anahtar üzerine yazar).

import { prisma } from "@/lib/prisma";
import {
  getVideoStatus,
  getVideoResult,
  getMergeResult,
  FFMPEG_COMPOSE_MODEL,
} from "@/lib/ai-provider-registry";
import { getShotstackRender } from "@/lib/shotstack";
import { putObject, publicUrl } from "@/lib/r2";
import type { AiProvider } from "@prisma/client";

/** Geçici Fal çıktı URL'sini kalıcı R2 nesnesine kopyalar. */
async function copyUrlToR2(url: string, key: string, fallbackType: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Çıktı indirilemedi (${res.status}).`);
  const contentType = res.headers.get("content-type") ?? fallbackType;
  await putObject(key, Buffer.from(await res.arrayBuffer()), contentType);
  return publicUrl(key);
}

type PendingScene = {
  id: string;
  jobId: string | null;
  requestId: string | null;
  /** İşin düşülen kredisi — başarısızlıkta aynen iade edilir (10 sn = 2) */
  creditCost: number;
  /** Submit anında çözülen TAM model yolu — Kling ve Seedance farklı uçlar;
   *  null = eski işler (env/varsayılan Kling'e düşer). */
  model: string | null;
};

/** Tamamlanan sahneyi R2'ye alıp COMPLETED'a çeker (claim korumalı). */
async function completeScene(scene: PendingScene, tenantId: string) {
  const { videoUrl } = await getVideoResult(scene.requestId!, {
    provider: "FAL_KLING", // FAL_KEY paylaşılır
    ...(scene.model ? { model: scene.model } : {}),
  });
  const key = `studio/${tenantId}/scenes/${scene.id}.mp4`;
  const outputUrl = await copyUrlToR2(videoUrl, key, "video/mp4");

  // Claim: yalnızca hâlâ PROCESSING olan sahneyi tamamla
  const claimed = await prisma.videoScene.updateMany({
    where: { id: scene.id, status: "PROCESSING" },
    data: { status: "COMPLETED", outputUrl, outputKey: key, errorMessage: null },
  });
  if (claimed.count > 0 && scene.jobId) {
    await prisma.studioJob.update({
      where: { id: scene.jobId },
      data: { status: "COMPLETED", outputUrl, outputKey: key },
    });
  }
}

/** Sahneyi FAILED işaretler ve krediyi iade eder — iade en fazla bir kez. */
async function failScene(scene: PendingScene, tenantId: string, message: string) {
  const msg = message.slice(0, 500);
  const claimed = await prisma.videoScene.updateMany({
    where: { id: scene.id, status: "PROCESSING" },
    data: { status: "FAILED", errorMessage: msg },
  });
  if (claimed.count === 0) return; // başka bir süreç zaten işledi → iade etme

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: tenantId },
      data: { aiVideoCredits: { increment: scene.creditCost } },
    });
    if (scene.jobId) {
      await tx.studioJob.update({
        where: { id: scene.jobId },
        data: { status: "FAILED", errorMessage: msg },
      });
    }
  });
}

/**
 * Tek bir projenin işlemdeki sahnelerini ve birleştirme işini Fal ile
 * mutabakata alır. Oturum/tenant doğrulaması ÇAĞIRANIN sorumluluğundadır —
 * bu fonksiyon projeId'yi doğrudan işler (cron için session yok).
 */
export async function reconcileProject(projectId: string): Promise<void> {
  const project = await prisma.studioProject.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      tenantId: true,
      scenes: {
        where: { status: "PROCESSING" },
        select: {
          id: true,
          jobId: true,
          job: {
            select: {
              externalRequestId: true,
              creditCost: true,
              externalModel: true,
            },
          },
        },
      },
      jobs: {
        where: { type: "VIDEO_MERGE", status: "PROCESSING" },
        select: { id: true, externalRequestId: true, provider: true },
      },
    },
  });
  if (!project) return;

  // ── İşlemdeki sahneler ──
  for (const s of project.scenes) {
    const requestId = s.job?.externalRequestId ?? null;
    if (!requestId) continue;
    const scene: PendingScene = {
      id: s.id,
      jobId: s.jobId,
      requestId,
      creditCost: s.job?.creditCost ?? 1,
      model: s.job?.externalModel ?? null,
    };

    try {
      const { status } = await getVideoStatus(requestId, {
        provider: "FAL_KLING", // FAL_KEY paylaşılır
        ...(scene.model ? { model: scene.model } : {}),
      });
      if (status !== "COMPLETED") continue;
      await completeScene(scene, project.tenantId);
    } catch (err) {
      await failScene(
        scene,
        project.tenantId,
        err instanceof Error ? err.message : "Render başarısız.",
      );
    }
  }

  // ── Birleştirme işi ──
  const mergeJob = project.jobs[0];
  if (mergeJob?.externalRequestId) {
    await reconcileMergeJob(
      {
        id: mergeJob.id,
        provider: mergeJob.provider,
        externalRequestId: mergeJob.externalRequestId,
      },
      { id: project.id, tenantId: project.tenantId },
    );
  }
}

/** Nihai videoyu R2'ye alıp iş + projeyi COMPLETED'a çeker (claim korumalı). */
async function completeMergeJob(
  jobId: string,
  project: { id: string; tenantId: string },
  outputUrl: string,
) {
  const key = `studio/${project.tenantId}/final/${project.id}.mp4`;
  const finalVideoUrl = await copyUrlToR2(outputUrl, key, "video/mp4");

  // Claim: yalnızca hâlâ PROCESSING olan birleştirme işini tamamla
  const claimed = await prisma.studioJob.updateMany({
    where: { id: jobId, status: "PROCESSING" },
    data: { status: "COMPLETED", outputUrl: finalVideoUrl, outputKey: key },
  });
  if (claimed.count > 0) {
    await prisma.studioProject.update({
      where: { id: project.id },
      data: {
        status: "COMPLETED",
        finalVideoUrl,
        finalVideoKey: key,
        errorMessage: null,
      },
    });
  }
}

/** Birleştirme işini FAILED işaretler (claim korumalı — iade yok, merge bedava). */
async function failMergeJob(
  jobId: string,
  project: { id: string; tenantId: string },
  message: string,
) {
  const msg = message.slice(0, 500);
  const claimed = await prisma.studioJob.updateMany({
    where: { id: jobId, status: "PROCESSING" },
    data: { status: "FAILED", errorMessage: msg },
  });
  if (claimed.count > 0) {
    await prisma.studioProject.update({
      where: { id: project.id },
      data: { errorMessage: msg },
    });
  }
}

/**
 * Birleştirme işini sağlayıcısıyla mutabakata alır. Hem polling
 * (reconcileProject) hem Shotstack webhook'u buraya düşer — claim
 * mantığı çift teslimatı zararsız kılar.
 *   provider SHOTSTACK → Shotstack render durumu
 *   provider null      → legacy Fal ffmpeg compose (deploy anındaki
 *                        uçuştaki eski işler için; sonradan kaldırılabilir)
 */
export async function reconcileMergeJob(
  job: { id: string; provider: AiProvider | null; externalRequestId: string },
  project: { id: string; tenantId: string },
): Promise<void> {
  try {
    if (job.provider === "SHOTSTACK") {
      const { status, url, error } = await getShotstackRender(job.externalRequestId);
      if (status === "done" && url) {
        await completeMergeJob(job.id, project, url);
      } else if (status === "failed") {
        await failMergeJob(job.id, project, error || "Kurgu render'ı başarısız.");
      }
      // queued/fetching/rendering/saving → bekle
      return;
    }

    // Legacy Fal compose yolu
    const { status } = await getVideoStatus(job.externalRequestId, {
      provider: "FAL_KLING",
      model: FFMPEG_COMPOSE_MODEL,
    });
    if (status === "COMPLETED") {
      const { videoUrl } = await getMergeResult(job.externalRequestId);
      await completeMergeJob(job.id, project, videoUrl);
    }
  } catch (err) {
    await failMergeJob(
      job.id,
      project,
      err instanceof Error ? err.message : "Birleştirme başarısız.",
    );
  }
}
