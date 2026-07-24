"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPremium, isStudioUnlimited } from "@/lib/plans";
import {
  generateVoiceSegment,
  generateAvatarVideo,
} from "@/lib/ai-provider-registry";
import { putObject, publicUrl } from "@/lib/r2";
import {
  AVATAR_CLIP_PROMPT,
  AVATAR_CREDIT_COST,
  PRESENTER_MAX_CLIP_SEC,
  getAvatarPersona,
} from "@/lib/studio-avatar";
import { findNegativeTermViolations } from "@/lib/studio-prompts";

// ── Vitrin Sunucusu — konuşan klip üretim akışı ──
// 1) setAvatarPersona: proje için sunucu seçimi
// 2) generateAvatarClip: senaryo → tek parça ElevenLabs sesi → Fal avatar
//    kuyruğu (asenkron). Sonuç lib/studio-reconcile.ts avatar dalında R2'ye
//    alınır; kurguya mergeProject PiP olarak bindirir.

const PRESENTER_MAX_CHARS = PRESENTER_MAX_CLIP_SEC * 14; // ~30 sn Türkçe

export type AvatarClipState = {
  personaKey: string | null;
  status: string | null; // null | PROCESSING | COMPLETED | FAILED
  script: string | null;
  videoUrl: string | null;
  error: string | null;
};

type AvatarResult =
  | { ok: true; state: AvatarClipState }
  | { ok: false; error: string };

async function toState(projectId: string): Promise<AvatarClipState> {
  const p = await prisma.studioProject.findUnique({
    where: { id: projectId },
    select: {
      avatarPersonaKey: true,
      avatarStatus: true,
      avatarScript: true,
      avatarVideoUrl: true,
      avatarJobId: true,
    },
  });
  let error: string | null = null;
  if (p?.avatarStatus === "FAILED" && p.avatarJobId) {
    const job = await prisma.studioJob.findUnique({
      where: { id: p.avatarJobId },
      select: { errorMessage: true },
    });
    error = job?.errorMessage ?? null;
  }
  return {
    personaKey: p?.avatarPersonaKey ?? null,
    status: p?.avatarStatus ?? null,
    script: p?.avatarScript ?? null,
    videoUrl: p?.avatarVideoUrl ?? null,
    error,
  };
}

// ── 1) Persona seçimi ──

export async function setAvatarPersona(input: {
  projectId: string;
  personaKey: string;
}): Promise<AvatarResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Oturum bulunamadı." };

  const persona = getAvatarPersona(input.personaKey);
  if (!persona) return { ok: false, error: "Geçersiz sunucu seçimi." };
  if (!persona.available && !isStudioUnlimited()) {
    return { ok: false, error: `${persona.label} çok yakında — hazırlıkları sürüyor.` };
  }

  const project = await prisma.studioProject.findFirst({
    where: { id: input.projectId, tenantId: session.tenantId },
    select: { id: true, avatarStatus: true },
  });
  if (!project) return { ok: false, error: "Proje bulunamadı." };
  if (project.avatarStatus === "PROCESSING") {
    return { ok: false, error: "Sunucu klibi üretilirken persona değiştirilemez." };
  }

  await prisma.studioProject.update({
    where: { id: project.id },
    data: { avatarPersonaKey: persona.key },
  });
  return { ok: true, state: await toState(project.id) };
}

// ── 2) Konuşan klip üretimi ──

export async function generateAvatarClip(input: {
  projectId: string;
  /** Verilmezse proje avatarScript > voiceText sırasıyla kullanılır */
  script?: string;
}): Promise<AvatarResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Oturum bulunamadı." };

  const project = await prisma.studioProject.findFirst({
    where: { id: input.projectId, tenantId: session.tenantId },
    select: {
      id: true,
      listingId: true,
      templateKey: true,
      avatarPersonaKey: true,
      avatarStatus: true,
      avatarScript: true,
      voiceText: true,
      negativeTerms: true,
      scenes: { select: { durationSec: true } },
    },
  });
  if (!project) return { ok: false, error: "Proje bulunamadı." };
  if (project.templateKey !== "presenter_reels") {
    return { ok: false, error: "Sunucu klibi yalnızca Vitrin Sunucusu şablonunda üretilir." };
  }
  if (project.avatarStatus === "PROCESSING") {
    return { ok: false, error: "Sunucu klibi zaten üretiliyor." };
  }

  const persona = getAvatarPersona(project.avatarPersonaKey);
  if (!persona) return { ok: false, error: "Önce bir sunucu seçin." };

  const unlimited = isStudioUnlimited();
  if (!persona.available && !unlimited) {
    return { ok: false, error: `${persona.label} çok yakında — hazırlıkları sürüyor.` };
  }

  // Plan + kredi kapısı — Vitrin Sunucusu Premium/Kurumsal özelliğidir
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { plan: true, aiVideoCredits: true },
  });
  if (!tenant) return { ok: false, error: "Ofis bulunamadı." };
  if (!isPremium(tenant.plan) && !unlimited) {
    return { ok: false, error: "Vitrin Sunucusu, Premium ve Kurumsal planlara özeldir." };
  }
  const cost = unlimited ? 0 : AVATAR_CREDIT_COST;
  if (tenant.aiVideoCredits < cost) {
    return {
      ok: false,
      error: `Sunucu klibi ${cost} kredi gerektirir, kalan krediniz ${tenant.aiVideoCredits}.`,
    };
  }

  // Senaryo: kullanıcı düzenlemesi > önceki senaryo > proje tanıtım metni
  const script = (input.script ?? project.avatarScript ?? project.voiceText ?? "").trim();
  if (!script) return { ok: false, error: "Sunucu metni boş olamaz." };
  if (script.length > PRESENTER_MAX_CHARS) {
    return {
      ok: false,
      error: `Sunucu metni en fazla ${PRESENTER_MAX_CHARS} karakter olabilir (~${PRESENTER_MAX_CLIP_SEC} sn) — şu an ${script.length}.`,
    };
  }
  const violations = findNegativeTermViolations(script, project.negativeTerms);
  if (violations.length) {
    return { ok: false, error: `Metinde yasaklı kelime var: ${violations.join(", ")}.` };
  }

  // 1) Tek parça seslendirme — kelime zamanlamaları altyazı için saklanır.
  //    Persona sesi env'den (yoksa varsayılan ELEVENLABS_VOICE_ID akışı).
  let audioUrl: string;
  let audioKey: string;
  let durationMs: number;
  let wordTimings: unknown;
  try {
    const voiceId = process.env[persona.voiceEnvVar]?.trim();
    const voice = await generateVoiceSegment(script, {
      provider: "ELEVENLABS",
      ...(voiceId ? { voiceId } : {}),
    });
    audioKey = `studio/${session.tenantId}/avatar/${project.id}-audio-${Date.now()}.mp3`;
    await putObject(audioKey, voice.buffer, voice.mimeType);
    audioUrl = publicUrl(audioKey);
    durationMs = voice.durationMs;
    wordTimings = voice.wordTimings;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Seslendirme başarısız.";
    return { ok: false, error: message.slice(0, 300) };
  }

  // Konuşma, sahnelerin toplam süresine sığmalı — sığmazsa kullanıcıya
  // net yönlendirme (kredi henüz düşülmedi, güvenli çıkış)
  const scenesSec = project.scenes.reduce((s, x) => s + x.durationSec, 0);
  if (scenesSec > 0 && durationMs / 1000 > scenesSec + 1) {
    return {
      ok: false,
      error: `Konuşma ${Math.round(durationMs / 1000)} sn sürüyor ama video ${scenesSec} sn — metni kısaltın veya sahne/süre ekleyin.`,
    };
  }

  // 2) Krediyi düş — Fal submit başarısız olursa aynen iade edilir
  if (cost > 0) {
    await prisma.tenant.update({
      where: { id: session.tenantId },
      data: { aiVideoCredits: { decrement: cost } },
    });
  }

  try {
    const { requestId, model } = await generateAvatarVideo(project.id, {
      personaImageUrl: publicUrl(persona.portraitR2Key),
      audioUrl,
      prompt: AVATAR_CLIP_PROMPT,
    });

    const job = await prisma.studioJob.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        listingId: project.listingId,
        projectId: project.id,
        type: "AVATAR_GENERATE",
        status: "PROCESSING",
        provider: "FAL_KLING", // aynı FAL_KEY — reconcile bu anahtarla sorgular
        externalRequestId: requestId,
        externalModel: model,
        inputUrl: publicUrl(persona.portraitR2Key),
        creditCost: cost,
      },
    });

    await prisma.studioProject.update({
      where: { id: project.id },
      data: {
        avatarStatus: "PROCESSING",
        avatarScript: script,
        avatarAudioUrl: audioUrl,
        avatarAudioKey: audioKey,
        avatarDurationMs: durationMs,
        avatarWordTimings: wordTimings as object,
        avatarVideoUrl: null,
        avatarVideoKey: null,
        avatarJobId: job.id,
      },
    });

    return { ok: true, state: await toState(project.id) };
  } catch (err) {
    // Fal submit başarısız — kredi iadesi
    if (cost > 0) {
      await prisma.tenant.update({
        where: { id: session.tenantId },
        data: { aiVideoCredits: { increment: cost } },
      });
    }
    const message = err instanceof Error ? err.message : "Sunucu klibi başlatılamadı.";
    return { ok: false, error: message.slice(0, 300) };
  }
}
