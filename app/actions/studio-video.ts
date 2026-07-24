"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPro, isPremium, isStudioUnlimited } from "@/lib/plans";
import {
  generateVideo,
  generateVoice,
  generateReferenceVideo,
  mergeCostUsd,
} from "@/lib/ai-provider-registry";
import { putObject, publicUrl, presignDownload } from "@/lib/r2";
import { reconcileProject } from "@/lib/studio-reconcile";
import {
  buildSceneNegativePrompt,
  buildVoiceoverText,
} from "@/lib/studio-prompts";
import {
  resolveTemplate,
  transitionForBoundary,
  buildTemplateScenePrompt,
  buildTemplateNegativePrompt,
  sceneDefaults,
  buildTemplateTourPrompt,
  REFERENCE_DURATION_SEC,
  REFERENCE_CREDIT_COST,
  SCENE_CREDIT_COST,
  SCENE_CREDIT_COST_10S,
  isTemplateKey,
  TEMPLATES,
  TRANSITION_LABELS,
  type ResolvedOverlay,
  type TemplateDef,
  type TransitionKey,
} from "@/lib/studio-templates";
import { MUSIC_TRACKS, isMusicKey, type MusicKey } from "@/lib/studio-music";
import { buildPresenterScript, DEFAULT_AVATAR_PERSONA } from "@/lib/studio-avatar";
import {
  submitShotstackRender,
  buildTimelineFromProject,
  buildCaptionChunks,
  type TimelineBranding,
} from "@/lib/shotstack";
import type { WordTiming } from "@/lib/ai-provider-registry";
import { getBaseUrl } from "@/lib/url";

// Proje başına sahne üst sınırı — hem maliyet hem action süresi güvencesi
const MAX_SCENES = 8;

// ── Maliyet/kötüye kullanım koruması (tenant başına) ──
// Aylık kredi zaten toplam harcamayı sınırlar; bunlar ani yük ve kaçak
// döngü koruması: aynı anda çok sayıda Fal işi ya da günlük patlama.
const MAX_CONCURRENT_VIDEO_JOBS = 12; // aynı anda işlemdeki sahne render'ı
const DAILY_VIDEO_JOB_CAP = 40; // 24 saatte açılabilecek video işi

/** UTC gün başlangıcı — günlük tavan penceresi. */
function startOfUtcDay(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Yeni `additional` sahne render'ı açmadan önce tenant kotasını denetler.
 * Kota aşılıyorsa kullanıcıya gösterilecek hata mesajı, aksi halde null döner.
 */
async function checkVideoQuota(
  tenantId: string,
  additional: number,
): Promise<string | null> {
  const [inFlight, today] = await Promise.all([
    prisma.studioJob.count({
      where: { tenantId, type: "VIDEO_GENERATE", status: "PROCESSING" },
    }),
    prisma.studioJob.count({
      where: {
        tenantId,
        type: "VIDEO_GENERATE",
        createdAt: { gte: startOfUtcDay() },
      },
    }),
  ]);
  if (inFlight + additional > MAX_CONCURRENT_VIDEO_JOBS) {
    return `Aynı anda en fazla ${MAX_CONCURRENT_VIDEO_JOBS} sahne işlenebilir — süren üretimlerin bitmesini bekleyin.`;
  }
  if (today + additional > DAILY_VIDEO_JOB_CAP) {
    return `Günlük video üretim sınırına ulaşıldı (${DAILY_VIDEO_JOB_CAP}/gün). Yarın tekrar deneyebilirsiniz.`;
  }
  return null;
}

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
  roomKey: string | null;
  transitionKey: string | null;
  approved: boolean;
};

export type ProjectVoiceSegmentView = {
  id: string;
  order: number;
  text: string;
  status: string;
  audioUrl: string | null;
  durationMs: number | null;
  errorMessage: string | null;
};

export type StudioProjectView = {
  id: string;
  title: string;
  status: string; // DRAFT | RENDERING | COMPLETED | FAILED
  conceptKey: string | null;
  templateKey: string | null;
  musicKey: string | null;
  overlayData: ResolvedOverlay[] | null;
  aspectRatio: string;
  voiceText: string | null;
  voiceUrl: string | null;
  negativeTerms: string[];
  finalVideoUrl: string | null;
  errorMessage: string | null;
  merging: boolean; // aktif VIDEO_MERGE işi sürüyor mu
  scenes: StudioSceneView[];
  voiceSegments: ProjectVoiceSegmentView[];
  // ── Vitrin Sunucusu (presenter_reels) ──
  avatarPersonaKey: string | null;
  avatarStatus: string | null; // null | PROCESSING | COMPLETED | FAILED
  avatarScript: string | null;
  avatarVideoUrl: string | null;
};

type ProjectResult =
  | { ok: true; project: StudioProjectView; remainingCredits?: number }
  | { ok: false; error: string };

// ── Yardımcılar ──

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
      voiceSegments: { orderBy: { order: "asc" } },
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
    conceptKey: p.conceptKey,
    templateKey: p.templateKey,
    musicKey: p.musicKey,
    overlayData: (p.overlayData as ResolvedOverlay[] | null) ?? null,
    aspectRatio: p.aspectRatio,
    voiceText: p.voiceText,
    voiceUrl: p.voiceUrl,
    negativeTerms: p.negativeTerms,
    finalVideoUrl: p.finalVideoUrl,
    errorMessage: p.errorMessage,
    merging: p.jobs.length > 0,
    avatarPersonaKey: p.avatarPersonaKey,
    avatarStatus: p.avatarStatus,
    avatarScript: p.avatarScript,
    avatarVideoUrl: p.avatarVideoUrl,
    scenes: p.scenes.map((s) => ({
      id: s.id,
      order: s.order,
      status: s.status,
      sourceImageUrl: s.sourceImageUrl,
      sourceThumbUrl: s.sourceImage?.thumbUrl ?? null,
      outputUrl: s.outputUrl,
      errorMessage: s.errorMessage,
      durationSec: s.durationSec,
      roomKey: s.roomKey,
      transitionKey: s.transitionKey,
      approved: s.approved,
    })),
    voiceSegments: p.voiceSegments.map((v) => ({
      id: v.id,
      order: v.order,
      text: v.text,
      status: v.status,
      audioUrl: v.audioUrl,
      durationMs: v.durationMs,
      errorMessage: v.errorMessage,
    })),
  };
}

/** Sahne için Fal Kling işi başlatır; job'a requestId yazar. */
async function submitScene(
  scene: { id: string; prompt: string; sourceImageUrl: string; durationSec: number; jobId: string | null },
  aspectRatio: string,
  negativePrompt: string,
) {
  const { requestId, model } = await generateVideo(scene.id, scene.prompt, {
    provider: "FAL_KLING",
    sourceImageUrl: scene.sourceImageUrl,
    durationSec: scene.durationSec === 10 ? 10 : 5,
    aspectRatio: aspectRatio as "16:9" | "9:16",
    negativePrompt,
  });
  if (scene.jobId) {
    await prisma.studioJob.update({
      where: { id: scene.jobId },
      // externalModel: reconcile AYNI model yolunu kullanmalı (env ile model
      // değişse bile uçuştaki iş strand olmasın)
      data: { externalRequestId: requestId, externalModel: model, status: "PROCESSING" },
    });
  }
}

// ── Overlay çözümleme — şablon slotları ilan verisiyle doldurulur ──
// Kullanıcı bu metinleri birleştirmeden önce düzenleyebilir (overlayData).

function resolveOverlayData(
  template: TemplateDef,
  listing: {
    price: unknown;
    currency: string;
    grossArea: number | null;
    netArea: number | null;
    rooms: string | null;
    city: string;
    district: string;
    neighborhood: string | null;
    features: string[];
    deedStatus: string | null;
  },
): ResolvedOverlay[] {
  const location = [listing.neighborhood, listing.district, listing.city]
    .filter(Boolean)
    .join(", ");
  // Ada/parsel: özelliklerde ya da tapu durumunda geçiyorsa yakala
  const haystack = [...listing.features, listing.deedStatus ?? ""].join(" ");
  const ada = haystack.match(/ada\s*[:.]?\s*(\d+)/i)?.[1];
  const parsel = haystack.match(/parsel\s*[:.]?\s*(\d+)/i)?.[1];
  const adaParsel =
    ada && parsel ? `Ada ${ada} / Parsel ${parsel}` : ada ? `Ada ${ada}` : "";
  const area = listing.grossArea ?? listing.netArea;

  return template.overlaySlots.map((slot) => {
    let text = "";
    switch (slot.source) {
      case "price":
        text = formatPrice(listing.price, listing.currency);
        break;
      case "grossArea":
        text = area ? `${new Intl.NumberFormat("tr-TR").format(area)} m²` : "";
        break;
      case "location":
        text = location;
        break;
      case "rooms":
        text = listing.rooms ?? "";
        break;
      case "adaParsel":
        text = adaParsel;
        break;
      case "custom":
        text = slot.defaultText ?? "";
        break;
    }
    return {
      key: slot.key,
      label: slot.label,
      text,
      enabled: text.trim().length > 0,
      placement: slot.placement,
      startSec: slot.startSec,
      lengthSec: slot.lengthSec,
      styleKey: slot.styleKey,
    };
  });
}

// ── 1) Proje oluşturma — seçilen her fotoğraf bir sahne olur ──

export async function createStudioProject(input: {
  listingId: string;
  /** Hazır şablon — sahne reçetesi, geçişler, overlay ve müziği belirler */
  templateKey: string;
  /** Sıralı seçim — roomKey iç mekân turunda "hangi fotoğraf hangi oda" bilgisi.
   *  durationSec: 5 (20 kredi) | 10 (40 kredi — Kling tarafında ~2x maliyet) */
  selectedMedia: { id: string; roomKey?: string | null; durationSec?: number }[];
  /** Şablon varsayılanını ezmek için; "none" = müziksiz */
  musicKey?: string;
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

  if (!isTemplateKey(input.templateKey)) {
    return { ok: false, error: "Geçersiz şablon." };
  }
  const template = TEMPLATES[input.templateKey];
  // UI kilidi yetmez: doğrudan action çağrısına karşı server tarafı kapı
  if (template.available === false) {
    return { ok: false, error: "Bu şablon çok yakında — hazırlıkları sürüyor." };
  }
  if (input.musicKey && !isMusicKey(input.musicKey)) {
    return { ok: false, error: "Geçersiz müzik seçimi." };
  }

  const selected = input.selectedMedia.slice(0, MAX_SCENES);
  const mediaIds = selected.map((s) => s.id);
  if (!mediaIds.length) {
    return { ok: false, error: "En az bir fotoğraf seçmelisiniz." };
  }

  // reference: TÜM fotoğraflar tek Seedance çağrısına referans → tek video,
  //            sabit bedel (sahne yok, birleştirme yok)
  // per_scene: her fotoğraf ayrı Kling klibi; 5 sn = 20, 10 sn = 40 kredi
  const isReference = template.generationMode === "reference";
  const sceneDurations = selected.map((s, i) =>
    s.durationSec === 10
      ? 10
      : s.durationSec === 5
        ? 5
        : sceneDefaults(template, i).durationSec,
  );
  // Test modunda tüm bedeller 0 → kredi düşülmez; iş kayıtlarının creditCost'u
  // da 0 olduğu için başarısızlıktaki iade (increment: creditCost) no-op olur.
  const unlimited = isStudioUnlimited();
  const sceneCosts: number[] = sceneDurations.map((d) =>
    unlimited ? 0 : d === 10 ? SCENE_CREDIT_COST_10S : SCENE_CREDIT_COST,
  );
  const cost = unlimited
    ? 0
    : isReference
      ? REFERENCE_CREDIT_COST
      : sceneCosts.reduce((a, b) => a + b, 0);
  if (!unlimited && tenant.aiVideoCredits < cost) {
    return {
      ok: false,
      error: `Bu video ${cost} kredi gerektirir, kalan krediniz ${tenant.aiVideoCredits}.`,
    };
  }

  // Maliyet/kötüye kullanım tavanı — eşzamanlılık + günlük limit (iş sayısı)
  const quotaError = await checkVideoQuota(session.tenantId, selected.length);
  if (quotaError) return { ok: false, error: quotaError };

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
      netArea: true,
      deedStatus: true,
      price: true,
      currency: true,
      purpose: true,
      features: true,
      media: {
        where: { id: { in: mediaIds }, kind: "photo" },
        // key: reference modunda Seedance'e imzalı URL vermek için gerekir
        select: { id: true, url: true, key: true },
      },
    },
  });
  if (!listing || listing.media.length !== mediaIds.length) {
    return { ok: false, error: "Seçilen fotoğraflar doğrulanamadı." };
  }
  const mediaById = new Map(listing.media.map((m) => [m.id, m]));

  const voiceListing = {
    title: listing.title,
    city: listing.city,
    district: listing.district,
    neighborhood: listing.neighborhood,
    rooms: listing.rooms,
    grossArea: listing.grossArea,
    price: formatPrice(listing.price, listing.currency),
    purpose: listing.purpose,
    features: listing.features,
  };
  // Vitrin Sunucusu: birinci ağızdan sunucu senaryosu (≤30 sn) — diğer
  // şablonlarda ton bazlı klasik tanıtım metni.
  const voiceText =
    template.key === "presenter_reels"
      ? buildPresenterScript(voiceListing)
      : buildVoiceoverText(voiceListing, mediaIds.length, [], template.voiceTone);

  // Krediyi düş — sahne bazında başarısızlıkta tek tek iade edilir
  // (test modunda cost=0 → düşülmez)
  if (cost > 0) {
    await prisma.tenant.update({
      where: { id: session.tenantId },
      data: { aiVideoCredits: { decrement: cost } },
    });
  }

  const project = await prisma.studioProject.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      listingId: listing.id,
      title: `${template.label} — ${listing.refCode}`,
      status: "RENDERING",
      templateKey: template.key,
      conceptKey: template.legacyConceptKey, // geri uyum: regenerate + geçmiş
      musicKey: input.musicKey ?? null,
      overlayData: resolveOverlayData(template, listing),
      aspectRatio: template.aspectRatio,
      voiceText,
      voiceProvider: "ELEVENLABS",
      // Vitrin Sunucusu: varsayılan persona baştan seçili gelir
      ...(template.key === "presenter_reels"
        ? { avatarPersonaKey: DEFAULT_AVATAR_PERSONA }
        : {}),
    },
  });

  // ── reference modu: TEK Seedance çağrısı → TEK bütünlüklü tur videosu ──
  // Tek sahne kaydı açılır: onay kapısı, ekran yazıları, altyazı, müzik ve
  // kapanış kartı mevcut birleştirme yolundan aynen geçer.
  if (isReference) {
    const ordered = selected.map((s) => mediaById.get(s.id)!);
    const prompt = buildTemplateTourPrompt(
      template,
      selected.map((s) => ({ roomKey: s.roomKey ?? null })),
    );

    const job = await prisma.studioJob.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        listingId: listing.id,
        projectId: project.id,
        type: "VIDEO_GENERATE",
        status: "PROCESSING",
        inputMediaId: ordered[0].id,
        inputUrl: ordered[0].url,
        videoConceptKey: template.legacyConceptKey,
        provider: "FAL_SEEDANCE",
        creditCost: cost,
      },
    });

    const scene = await prisma.videoScene.create({
      data: {
        projectId: project.id,
        order: 0,
        sourceImageId: ordered[0].id,
        sourceImageUrl: ordered[0].url, // şerit önizlemesi için kapak
        prompt,
        provider: "FAL_SEEDANCE",
        durationSec: REFERENCE_DURATION_SEC,
        status: "PROCESSING",
        jobId: job.id,
      },
    });

    try {
      // Fal'ın fotoğrafları çekebilmesi için imzalı URL — R2 public URL'i
      // bağlı olmadığından ham url güvenilmez.
      const imageUrls = await Promise.all(
        ordered.map((m) => presignDownload(m.key, 6 * 3600)),
      );
      const { requestId, model } = await generateReferenceVideo(prompt, {
        imageUrls,
        durationSec: REFERENCE_DURATION_SEC,
        aspectRatio: template.aspectRatio,
        resolution: "720p",
        generateAudio: false, // ses bizim seslendirme + müzik katmanımızdan
      });
      await prisma.studioJob.update({
        where: { id: job.id },
        data: { externalRequestId: requestId, externalModel: model },
      });
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
          data: { aiVideoCredits: { increment: cost } },
        }),
      ]);
    }

    const updatedRef = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { aiVideoCredits: true },
    });
    revalidatePath("/dashboard/studio");
    const viewRef = await toProjectView(project.id);
    return viewRef
      ? { ok: true, project: viewRef, remainingCredits: updatedRef?.aiVideoCredits ?? 0 }
      : { ok: false, error: "Proje oluşturulamadı." };
  }

  // ── per_scene modu: her fotoğraf ayrı Kling klibi ──
  for (let i = 0; i < selected.length; i++) {
    const media = mediaById.get(selected[i].id)!;
    const roomKey = selected[i].roomKey ?? null;
    const prompt = buildTemplateScenePrompt(template, i, roomKey);
    const durationSec = sceneDurations[i];

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
        videoConceptKey: template.legacyConceptKey,
        provider: "FAL_KLING",
        creditCost: sceneCosts[i],
      },
    });

    const scene = await prisma.videoScene.create({
      data: {
        projectId: project.id,
        order: i,
        sourceImageId: media.id,
        sourceImageUrl: media.url,
        prompt,
        roomKey,
        transitionKey: i === 0 ? null : transitionForBoundary(template, i - 1),
        provider: "FAL_KLING",
        durationSec,
        status: "PROCESSING",
        jobId: job.id,
      },
    });

    try {
      await submitScene(
        { id: scene.id, prompt, sourceImageUrl: media.url, durationSec, jobId: job.id },
        template.aspectRatio,
        buildTemplateNegativePrompt(template),
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
          data: { aiVideoCredits: { increment: sceneCosts[i] } },
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

  // Tenant sahipliğini doğrula — reconcile'ın kendisi tenant-bağımsızdır
  const owned = await prisma.studioProject.findFirst({
    where: { id: projectId, tenantId: session.tenantId },
    select: { id: true },
  });
  if (!owned) return { ok: false, error: "Proje bulunamadı." };

  // İşlemdeki sahne/birleştirme işlerini Fal ile mutabakata al
  // (aynı mantığı cron sweeper da kullanır — claim korumalı, idempotent).
  await reconcileProject(projectId);

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
        select: {
          id: true,
          listingId: true,
          aspectRatio: true,
          conceptKey: true,
          templateKey: true,
        },
      },
    },
  });
  if (!scene) return { ok: false, error: "Sahne bulunamadı." };
  if (scene.status === "PROCESSING") {
    return { ok: false, error: "Bu sahne zaten işleniyor." };
  }

  // Yeniden üretim sahnenin süresini korur — 10 sn sahne 40 kredi
  // (test modunda bedelsiz)
  const unlimited = isStudioUnlimited();
  const regenCost = unlimited
    ? 0
    : scene.durationSec === 10
      ? SCENE_CREDIT_COST_10S
      : SCENE_CREDIT_COST;
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { aiVideoCredits: true },
  });
  if (!tenant) return { ok: false, error: "Ofis bulunamadı." };
  if (!unlimited && tenant.aiVideoCredits < regenCost) {
    return {
      ok: false,
      error: `Bu sahne ${regenCost} kredi gerektirir, kalan krediniz ${tenant.aiVideoCredits}.`,
    };
  }

  // Maliyet/kötüye kullanım tavanı — eşzamanlılık + günlük limit
  const quotaError = await checkVideoQuota(session.tenantId, 1);
  if (quotaError) return { ok: false, error: quotaError };

  if (regenCost > 0) {
    await prisma.tenant.update({
      where: { id: session.tenantId },
      data: { aiVideoCredits: { decrement: regenCost } },
    });
  }

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
      provider: "FAL_KLING",
      creditCost: regenCost,
    },
  });

  // Aktif iş göstergesini yeni işe çevir, eski çıktıyı ve onayı temizle
  await prisma.videoScene.update({
    where: { id: scene.id },
    data: {
      jobId: job.id,
      status: "PROCESSING",
      outputUrl: null,
      outputKey: null,
      errorMessage: null,
      approved: false,
    },
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
      scene.project.templateKey
        ? buildTemplateNegativePrompt(
            resolveTemplate(scene.project.templateKey, scene.project.conceptKey),
          )
        : buildSceneNegativePrompt(scene.project.conceptKey ?? "interior"),
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
        data: { aiVideoCredits: { increment: regenCost } },
      }),
    ]);
  }

  const view = await toProjectView(scene.project.id);
  return view ? { ok: true, project: view } : { ok: false, error: "Proje bulunamadı." };
}

// ── 3b) Sahne onayı — kalite kontrol kapısı ──
// Onaysız sahne nihai videoya giremez; bozuk sahnenin sızması imkânsızlaşır.

export async function approveScene(input: {
  sceneId: string;
  approved: boolean;
}): Promise<ProjectResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Oturum bulunamadı." };

  const scene = await prisma.videoScene.findFirst({
    where: { id: input.sceneId, project: { tenantId: session.tenantId } },
    select: { id: true, status: true, projectId: true },
  });
  if (!scene) return { ok: false, error: "Sahne bulunamadı." };
  if (input.approved && scene.status !== "COMPLETED") {
    return { ok: false, error: "Yalnızca tamamlanmış sahne onaylanabilir." };
  }

  await prisma.videoScene.update({
    where: { id: scene.id },
    data: { approved: input.approved },
  });

  const view = await toProjectView(scene.projectId);
  return view ? { ok: true, project: view } : { ok: false, error: "Proje bulunamadı." };
}

// ── 3c) Şablon ince ayarları — geçişler + ekran yazıları + müzik ──
// Birleştirmeden önce düzenlenir; render sırasında kilitli.

const MAX_OVERLAY_TEXT = 80;

/** Sahnenin GİRİŞ geçişini değiştirir — Shotstack katmanı, yeniden render gerektirmez. */
export async function updateSceneTransition(input: {
  sceneId: string;
  transitionKey: string;
}): Promise<ProjectResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Oturum bulunamadı." };
  if (!(input.transitionKey in TRANSITION_LABELS)) {
    return { ok: false, error: "Geçersiz geçiş efekti." };
  }

  const scene = await prisma.videoScene.findFirst({
    where: { id: input.sceneId, project: { tenantId: session.tenantId } },
    select: {
      id: true,
      order: true,
      projectId: true,
      project: {
        select: {
          jobs: {
            where: { type: "VIDEO_MERGE", status: { in: ["PENDING", "PROCESSING"] } },
            select: { id: true },
          },
        },
      },
    },
  });
  if (!scene) return { ok: false, error: "Sahne bulunamadı." };
  if (scene.order === 0) {
    return { ok: false, error: "İlk sahnenin giriş geçişi yoktur." };
  }
  if (scene.project.jobs.length > 0) {
    return { ok: false, error: "Birleştirme sürerken geçişler değiştirilemez." };
  }

  await prisma.videoScene.update({
    where: { id: scene.id },
    data: { transitionKey: input.transitionKey },
  });

  const view = await toProjectView(scene.projectId);
  return view ? { ok: true, project: view } : { ok: false, error: "Proje bulunamadı." };
}

export async function updateOverlayData(input: {
  projectId: string;
  overlays: { key: string; text: string; enabled: boolean }[];
}): Promise<ProjectResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Oturum bulunamadı." };

  const project = await prisma.studioProject.findFirst({
    where: { id: input.projectId, tenantId: session.tenantId },
    select: {
      id: true,
      overlayData: true,
      jobs: {
        where: { type: "VIDEO_MERGE", status: { in: ["PENDING", "PROCESSING"] } },
        select: { id: true },
      },
    },
  });
  if (!project) return { ok: false, error: "Proje bulunamadı." };
  if (project.jobs.length > 0) {
    return { ok: false, error: "Birleştirme sürerken ekran yazıları değiştirilemez." };
  }

  // Yalnızca mevcut slotların metni/aktifliği değişir — slot eklenemez,
  // zamanlama/stil şablondan gelir (client'tan gelen değerlere güvenilmez).
  const current = (project.overlayData as ResolvedOverlay[] | null) ?? [];
  const byKey = new Map(input.overlays.map((o) => [o.key, o]));
  const next = current.map((slot) => {
    const edit = byKey.get(slot.key);
    if (!edit) return slot;
    return {
      ...slot,
      text: edit.text.slice(0, MAX_OVERLAY_TEXT),
      enabled: edit.enabled && edit.text.trim().length > 0,
    };
  });

  await prisma.studioProject.update({
    where: { id: project.id },
    data: { overlayData: next },
  });

  const view = await toProjectView(project.id);
  return view ? { ok: true, project: view } : { ok: false, error: "Proje bulunamadı." };
}

export async function setProjectMusic(input: {
  projectId: string;
  musicKey: string;
}): Promise<ProjectResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Oturum bulunamadı." };
  if (!isMusicKey(input.musicKey)) {
    return { ok: false, error: "Geçersiz müzik seçimi." };
  }

  const project = await prisma.studioProject.findFirst({
    where: { id: input.projectId, tenantId: session.tenantId },
    select: {
      id: true,
      jobs: {
        where: { type: "VIDEO_MERGE", status: { in: ["PENDING", "PROCESSING"] } },
        select: { id: true },
      },
    },
  });
  if (!project) return { ok: false, error: "Proje bulunamadı." };
  if (project.jobs.length > 0) {
    return { ok: false, error: "Birleştirme sürerken müzik değiştirilemez." };
  }

  await prisma.studioProject.update({
    where: { id: project.id },
    data: { musicKey: input.musicKey },
  });

  const view = await toProjectView(project.id);
  return view ? { ok: true, project: view } : { ok: false, error: "Proje bulunamadı." };
}

export type StudioMusicOption = {
  key: string;
  label: string;
  mood: string;
  url: string;
};

/** Müzik seçici önizlemeleri — R2 public URL'leri sunucuda çözülür. */
export async function getStudioMusicOptions(): Promise<StudioMusicOption[]> {
  const session = await getSession();
  if (!session) return [];
  return Object.entries(MUSIC_TRACKS).map(([key, t]) => ({
    key,
    label: t.label,
    mood: t.mood,
    url: publicUrl(t.r2Key),
  }));
}

// ── 4) Seslendirme + birleştirme ──

export async function mergeProject(input: {
  projectId: string;
  voiceText?: string; // segment yoksa tek parça fallback; boş string = sessiz video
  /** Altyazı bandı — yalnızca segment bazlı seslendirmede (varsayılan açık) */
  captions?: boolean;
  /** Kapanış kartı (ofis adı/telefon/logo) + köşe filigranı (varsayılan açık) */
  outro?: boolean;
}): Promise<ProjectResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Oturum bulunamadı." };

  const project = await prisma.studioProject.findFirst({
    where: { id: input.projectId, tenantId: session.tenantId },
    include: {
      scenes: { orderBy: { order: "asc" } },
      voiceSegments: { orderBy: { order: "asc" } },
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

  // Kalite kontrol kapısı — onaysız sahne nihai videoya giremez
  const unapproved = project.scenes.filter((s) => !s.approved);
  if (unapproved.length) {
    return {
      ok: false,
      error: `${unapproved.length} sahne henüz onaylanmadı. Her sahneyi izleyip onaylayın (bozuk sahneyi "Yeniden Üret" ile düzeltin).`,
    };
  }

  // ── Vitrin Sunucusu kapısı ──
  // presenter_reels'te sunucu klibi videonun omurgasıdır: hazır olmadan
  // birleştirme yapılmaz. Sunucu sesi klipte gömülü olduğundan avatar'lı
  // kurguda segment seslendirmesi KULLANILMAZ (çift ses engeli).
  if (project.templateKey === "presenter_reels") {
    if (project.avatarStatus === "PROCESSING") {
      return { ok: false, error: "Sunucu klibi üretiliyor — bitince birleştirin." };
    }
    if (project.avatarStatus !== "COMPLETED" || !project.avatarVideoUrl) {
      return { ok: false, error: "Önce sunucu klibini üretin (persona seçip \"Sunucuyu Konuştur\")." };
    }
  }
  const avatarActive =
    project.avatarStatus === "COMPLETED" &&
    !!project.avatarVideoUrl &&
    !!project.avatarDurationMs;

  try {
    // Ses: öncelik segment bazlı seslendirmede (Senaryo Editörü çıktısı)
    let audioKeyframes: { url: string; timestamp: number; duration: number }[] | null = null;

    if (avatarActive) {
      // Sunucu sesi PiP klibinde gömülü — ayrı seslendirme eklenmez
    } else if (project.voiceSegments.length > 0) {
      const notReady = project.voiceSegments.filter(
        (v) => v.status !== "COMPLETED" || !v.audioUrl || !v.durationMs,
      );
      if (notReady.length) {
        return {
          ok: false,
          error: "Seslendirme segmentleri hazır değil — başarısız cümleleri yeniden üretin veya silin.",
        };
      }
      let cursor = 0;
      audioKeyframes = project.voiceSegments.map((v) => {
        const kf = { url: v.audioUrl!, timestamp: cursor, duration: v.durationMs! };
        cursor += v.durationMs!;
        return kf;
      });
    } else {
      // Segment yoksa: tek parça fallback (voiceText doluysa)
      const voiceText =
        input.voiceText !== undefined ? input.voiceText.trim() : (project.voiceText ?? "");
      if (voiceText) {
        const voice = await generateVoice(voiceText, { provider: "ELEVENLABS" });
        const voiceKey = `studio/${session.tenantId}/voice/${project.id}.mp3`;
        await putObject(voiceKey, voice.buffer, voice.mimeType);
        const voiceUrl = publicUrl(voiceKey);
        await prisma.studioProject.update({
          where: { id: project.id },
          data: { voiceText, voiceUrl, voiceKey },
        });
        const totalMs = completed.reduce((sum, s) => sum + s.durationSec * 1000, 0);
        audioKeyframes = [{ url: voiceUrl, timestamp: 0, duration: totalMs }];
      }
    }

    // ── Kurgu (Shotstack): geçişler + ekran yazıları + müzik ──
    const template = resolveTemplate(project.templateKey, project.conceptKey);

    // Müzik: kullanıcı seçimi > şablon varsayılanı; dosya R2'de yoksa
    // render'ı bozmamak için müzik atlanır (soft-fail).
    const musicKey = (
      project.musicKey && isMusicKey(project.musicKey)
        ? project.musicKey
        : template.musicDefault
    ) as MusicKey;
    let music: { url: string; volume: number } | null = null;
    if (musicKey !== "none") {
      const musicUrl = publicUrl(MUSIC_TRACKS[musicKey].r2Key);
      const head = await fetch(musicUrl, { method: "HEAD" }).catch(() => null);
      if (head?.ok) music = { url: musicUrl, volume: template.musicVolume };
    }

    // Sahne geçişleri: kullanıcı override'ı > şablon dizisi (ilk sahnede yok)
    const scenes = completed.map((s, i) => ({
      videoUrl: s.outputUrl!,
      durationSec: s.durationSec,
      transitionIn:
        i === 0
          ? null
          : ((s.transitionKey as TransitionKey | null) ??
            transitionForBoundary(template, i - 1)),
    }));

    const overlays = (project.overlayData as ResolvedOverlay[] | null) ?? [];

    // Altyazılar: avatar'lı kurguda sunucu senaryosunun kelime
    // zamanlamalarından; değilse segment bazlı seslendirmeden.
    const captions = !(input.captions ?? true)
      ? []
      : avatarActive
        ? buildCaptionChunks(
            [
              {
                text: project.avatarScript ?? "",
                durationMs: project.avatarDurationMs!,
                wordTimings:
                  (project.avatarWordTimings as WordTiming[] | null) ?? null,
              },
            ],
            // hook tipografisi: 1-2 kelimelik dev gruplar
            { maxWords: 2, maxChars: 16 },
          )
        : project.voiceSegments.length > 0
          ? buildCaptionChunks(
              project.voiceSegments.map((v) => ({
                text: v.text,
                durationMs: v.durationMs ?? 0,
                wordTimings: (v.wordTimings as WordTiming[] | null) ?? null,
              })),
            )
          : [];

    // Ofis kimliği — kapanış kartı/filigran + hook tipografi rengi
    const tenantBrand = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { name: true, phone: true, logoUrl: true, brandColor: true },
    });
    let branding: TimelineBranding | null = null;
    if ((input.outro ?? true) && tenantBrand) {
      branding = {
        name: tenantBrand.name,
        phone: tenantBrand.phone,
        logoUrl: tenantBrand.logoUrl,
      };
    }

    // Sunucu, kuruluş sahnesinden (drone iniş açılışı) SONRA videoya girer —
    // tek sahnelik projede baştan itibaren görünür.
    const avatarStartSec =
      avatarActive && scenes.length > 1 ? scenes[0].durationSec : 0;

    // Webhook: secret tanımlıysa Shotstack bitişte bize haber verir
    // (kapalı sekmede bile merge tamamlanır); yoksa polling yeterli.
    const webhookSecret = process.env.SHOTSTACK_WEBHOOK_SECRET;
    const callbackUrl = webhookSecret
      ? `${getBaseUrl()}/api/studio/shotstack-webhook?token=${webhookSecret}`
      : undefined;

    const edit = buildTimelineFromProject({
      aspectRatio: project.aspectRatio,
      scenes,
      voiceKeyframes: audioKeyframes,
      music,
      overlays,
      captions,
      branding,
      avatar: avatarActive
        ? {
            videoUrl: project.avatarVideoUrl!,
            durationSec: project.avatarDurationMs! / 1000,
            startSec: avatarStartSec,
          }
        : null,
      captionStyle: avatarActive ? "hook" : "band",
      hookColor: tenantBrand?.brandColor ?? undefined,
      callbackUrl,
    });
    const { renderId } = await submitShotstackRender(edit);

    // Gerçek maliyet: Shotstack render (toplam süre) + seslendirme karakteri.
    // Shotstack tamamlansa da olmasa da faturalanır → submit anında yazılır.
    // (Avatar sesi klip üretiminde ödendi — burada tekrar sayılmaz.)
    const totalSec = scenes.reduce((sum, s) => sum + s.durationSec, 0);
    const voiceChars = (audioKeyframes ? project.voiceText?.length : 0) ?? 0;

    await prisma.studioJob.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        listingId: project.listingId,
        projectId: project.id,
        type: "VIDEO_MERGE",
        status: "PROCESSING",
        provider: "SHOTSTACK",
        externalRequestId: renderId,
        creditCost: 0, // birleştirme kredi düşmez
        costUsd: mergeCostUsd(totalSec, voiceChars),
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
