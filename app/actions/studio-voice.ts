"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateVoiceSegment } from "@/lib/ai-provider-registry";
import { putObject, publicUrl, deleteObject } from "@/lib/r2";
import {
  splitIntoSentences,
  findNegativeTermViolations,
  parseNegativeTerms,
} from "@/lib/studio-prompts";

// ── Akıllı Senaryo Editörü — cümle bazlı seslendirme ──
// Metin cümlelere bölünür, her cümle ElevenLabs'ten AYRI üretilir.
// previous/next bağlamı sayesinde tonlama tek parça gibi akar; kullanıcı
// tek cümleyi düzenlediğinde yalnızca o segment yeniden üretilir.

export type VoiceSegmentView = {
  id: string;
  order: number;
  text: string;
  status: string;
  audioUrl: string | null;
  durationMs: number | null;
  errorMessage: string | null;
};

type SegmentsResult =
  | { ok: true; segments: VoiceSegmentView[] }
  | { ok: false; error: string };

function toView(s: {
  id: string;
  order: number;
  text: string;
  status: string;
  audioUrl: string | null;
  durationMs: number | null;
  errorMessage: string | null;
}): VoiceSegmentView {
  return {
    id: s.id,
    order: s.order,
    text: s.text,
    status: s.status,
    audioUrl: s.audioUrl,
    durationMs: s.durationMs,
    errorMessage: s.errorMessage,
  };
}

/** Segment ses dosyasını üretir ve R2'ye yükler (immutable cache için sürümlü anahtar). */
async function renderSegmentAudio(
  tenantId: string,
  projectId: string,
  segment: { id: string; text: string },
  previousText?: string,
  nextText?: string,
): Promise<void> {
  try {
    const voice = await generateVoiceSegment(segment.text, {
      provider: "ELEVENLABS",
      previousText,
      nextText,
    });
    const audioKey = `studio/${tenantId}/voice/${projectId}/${segment.id}-${Date.now()}.mp3`;
    await putObject(audioKey, voice.buffer, voice.mimeType);

    // Eski sürümü temizle
    const prev = await prisma.voiceSegment.findUnique({
      where: { id: segment.id },
      select: { audioKey: true },
    });
    if (prev?.audioKey) await deleteObject(prev.audioKey).catch(() => {});

    await prisma.voiceSegment.update({
      where: { id: segment.id },
      data: {
        status: "COMPLETED",
        audioUrl: publicUrl(audioKey),
        audioKey,
        durationMs: voice.durationMs,
        errorMessage: null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Seslendirme başarısız.";
    await prisma.voiceSegment.update({
      where: { id: segment.id },
      data: { status: "FAILED", errorMessage: message.slice(0, 500) },
    });
  }
}

// ── 1) Metni cümlelere böl ve tüm segmentleri seslendir ──

export async function generateVoiceSegments(input: {
  projectId: string;
  voiceText: string;
  negativeTermsInput?: string; // virgülle ayrılmış yasaklı kelimeler
}): Promise<SegmentsResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Oturum bulunamadı." };

  const project = await prisma.studioProject.findFirst({
    where: { id: input.projectId, tenantId: session.tenantId },
    include: { voiceSegments: { select: { audioKey: true } } },
  });
  if (!project) return { ok: false, error: "Proje bulunamadı." };

  const negativeTerms = parseNegativeTerms(input.negativeTermsInput ?? "");

  // Negative constraints — yasaklı kelime varsa seslendirme başlamaz
  const violations = findNegativeTermViolations(input.voiceText, negativeTerms);
  if (violations.length) {
    return {
      ok: false,
      error: `Metinde yasaklı kelime var: ${violations.join(", ")}. Lütfen metni düzenleyin.`,
    };
  }

  const sentences = splitIntoSentences(input.voiceText);
  if (!sentences.length) {
    return { ok: false, error: "Seslendirilecek metin bulunamadı." };
  }

  // Eski segmentleri ve ses dosyalarını temizle
  const oldKeys = project.voiceSegments
    .map((s) => s.audioKey)
    .filter((k): k is string => !!k);
  await prisma.voiceSegment.deleteMany({ where: { projectId: project.id } });
  await Promise.allSettled(oldKeys.map((k) => deleteObject(k)));

  await prisma.studioProject.update({
    where: { id: project.id },
    data: { voiceText: input.voiceText, negativeTerms },
  });

  // Segment kayıtlarını oluştur, sonra sırayla seslendir
  const segments = await Promise.all(
    sentences.map((text, i) =>
      prisma.voiceSegment.create({
        data: { projectId: project.id, order: i, text, status: "PROCESSING" },
      }),
    ),
  );

  for (let i = 0; i < segments.length; i++) {
    await renderSegmentAudio(
      session.tenantId,
      project.id,
      segments[i],
      sentences[i - 1],
      sentences[i + 1],
    );
  }

  const fresh = await prisma.voiceSegment.findMany({
    where: { projectId: project.id },
    orderBy: { order: "asc" },
  });
  return { ok: true, segments: fresh.map(toView) };
}

// ── 2) Tek segmenti düzenle / yeniden seslendir ──

export async function regenerateVoiceSegment(input: {
  segmentId: string;
  text?: string; // verilirse önce metin güncellenir
}): Promise<SegmentsResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Oturum bulunamadı." };

  const segment = await prisma.voiceSegment.findFirst({
    where: { id: input.segmentId, project: { tenantId: session.tenantId } },
    include: { project: { select: { id: true, negativeTerms: true } } },
  });
  if (!segment) return { ok: false, error: "Segment bulunamadı." };

  const newText = input.text?.trim() || segment.text;
  const violations = findNegativeTermViolations(
    newText,
    segment.project.negativeTerms,
  );
  if (violations.length) {
    return {
      ok: false,
      error: `Yasaklı kelime: ${violations.join(", ")}.`,
    };
  }

  // Komşu cümleler — tonlama sürekliliği için
  const siblings = await prisma.voiceSegment.findMany({
    where: { projectId: segment.project.id },
    orderBy: { order: "asc" },
    select: { id: true, order: true, text: true },
  });
  const idx = siblings.findIndex((s) => s.id === segment.id);

  await prisma.voiceSegment.update({
    where: { id: segment.id },
    data: { text: newText, status: "PROCESSING" },
  });

  await renderSegmentAudio(
    session.tenantId,
    segment.project.id,
    { id: segment.id, text: newText },
    siblings[idx - 1]?.text,
    siblings[idx + 1]?.text,
  );

  const fresh = await prisma.voiceSegment.findMany({
    where: { projectId: segment.project.id },
    orderBy: { order: "asc" },
  });
  return { ok: true, segments: fresh.map(toView) };
}

// ── 3) Segment silme ──

export async function deleteVoiceSegment(input: {
  segmentId: string;
}): Promise<SegmentsResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Oturum bulunamadı." };

  const segment = await prisma.voiceSegment.findFirst({
    where: { id: input.segmentId, project: { tenantId: session.tenantId } },
    select: { id: true, projectId: true, audioKey: true },
  });
  if (!segment) return { ok: false, error: "Segment bulunamadı." };

  await prisma.voiceSegment.delete({ where: { id: segment.id } });
  if (segment.audioKey) await deleteObject(segment.audioKey).catch(() => {});

  const fresh = await prisma.voiceSegment.findMany({
    where: { projectId: segment.projectId },
    orderBy: { order: "asc" },
  });
  return { ok: true, segments: fresh.map(toView) };
}
