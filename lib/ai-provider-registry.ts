// ── AI Servis Kayıt Defteri (Provider Registry) ──
// AI Stüdyo'nun tüm dış AI çağrıları bu dosyadan geçer.
// Görüntü + video: Fal.ai (SDXL / Kling) — kuyruk tabanlı (queue.fal.run)
// Seslendirme:    ElevenLabs
//
// API anahtarları çağrı anında process.env'den okunur (modül yüklenirken
// değil) — böylece Vercel ortam değişkeni değişiklikleri yeniden build
// gerektirmeden etkili olur ve test ortamında anahtar mock'lanabilir.

// Prisma `AiProvider` enum'u ile bire bir eşleşir.
export type AiProviderKey = "FAL_KLING" | "FAL_SDXL" | "ELEVENLABS";

type ProviderDefinition = {
  label: string;
  /** Anahtarın okunacağı .env değişkeni */
  envVar: string;
  /** Modeli .env ile ezmek için değişken (kod değişikliği olmadan tier yükseltme) */
  modelEnvVar: string;
  /** providerConfig.model ve modelEnvVar verilmezse kullanılacak model */
  defaultModel: string;
};

export const PROVIDER_REGISTRY: Record<AiProviderKey, ProviderDefinition> = {
  FAL_KLING: {
    label: "Fal.ai — Kling (video)",
    envVar: "FAL_KEY",
    modelEnvVar: "FAL_KLING_MODEL",
    defaultModel: "fal-ai/kling-video/v2.1/standard/image-to-video",
  },
  FAL_SDXL: {
    label: "Fal.ai — SDXL (fotoğraf iyileştirme)",
    envVar: "FAL_KEY",
    modelEnvVar: "FAL_SDXL_MODEL",
    defaultModel: "fal-ai/fast-sdxl/image-to-image",
  },
  ELEVENLABS: {
    label: "ElevenLabs (seslendirme)",
    envVar: "ELEVENLABS_API_KEY",
    modelEnvVar: "ELEVENLABS_MODEL",
    defaultModel: "eleven_multilingual_v2",
  },
};

export type ProviderConfig = {
  provider: AiProviderKey;
  /** Verilmezse ilgili .env değişkeninden okunur */
  apiKey?: string;
  /** Varsayılan modeli ezmek için (ör. Kling v2.5 turbo) */
  model?: string;
  /** Sağlayıcıya özel ek istek parametreleri — gövdeye aynen eklenir */
  extra?: Record<string, unknown>;
};

/** Anahtarı config'ten, yoksa .env'den okur; ikisi de yoksa hata fırlatır. */
export function resolveApiKey(config: ProviderConfig): string {
  const def = PROVIDER_REGISTRY[config.provider];
  const key = config.apiKey ?? process.env[def.envVar];
  if (!key) {
    throw new Error(
      `${def.label} için API anahtarı bulunamadı — .env dosyasına ${def.envVar} ekleyin.`,
    );
  }
  return key;
}

// Öncelik: explicit config.model > .env override (modelEnvVar) > defaultModel.
// Not: değişiklik SUBMIT ile RECONCILE arasında model string'ini değiştirmemeli
// (aynı kuyruk URL'si gerekir); mid-flight env değişimi in-flight işleri strand
// edebilir. Bu istisnai durum kabul edilebilir (cron reconcile FAILED'a düşürür).
function resolveModel(config: ProviderConfig): string {
  if (config.model) return config.model;
  const def = PROVIDER_REGISTRY[config.provider];
  const envModel = process.env[def.modelEnvVar]?.trim();
  return envModel || def.defaultModel;
}

// ── Fal.ai kuyruk istemcisi ──
// Uzun süren işler (video) queue.fal.run üzerinden asenkron yürür:
// submit → request_id → worker durum sorgular / webhook tetiklenir.

const FAL_QUEUE_BASE = "https://queue.fal.run";
const FAL_SYNC_BASE = "https://fal.run";

async function falFetch<T>(
  url: string,
  apiKey: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Fal.ai hatası (${res.status}): ${detail.slice(0, 500)}`);
  }

  return (await res.json()) as T;
}

export type FalQueueStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED";

export type FalSubmitResult = {
  requestId: string;
  /** Durum sorgusu için worker'ın kullanacağı model yolu */
  model: string;
};

// ── 1) Görüntü üretimi / iyileştirme (Fal.ai — SDXL) ──

export type GenerateImageInput = {
  /** İyileştirilecek kaynak fotoğraf (image-to-image) — boşsa text-to-image */
  sourceImageUrl?: string;
  /** 0-1: kaynaktan ne kadar uzaklaşılacağı (image-to-image) */
  strength?: number;
};

export type GenerateImageResult = {
  imageUrl: string;
  width?: number;
  height?: number;
};

/**
 * Fal.ai üzerinden fotoğraf üretir/iyileştirir. Görüntü işleri kısa sürdüğü
 * için senkron endpoint (fal.run) kullanılır — kuyruk gerekmez.
 */
export async function generateImage(
  prompt: string,
  providerConfig: ProviderConfig & GenerateImageInput,
): Promise<GenerateImageResult> {
  const apiKey = resolveApiKey(providerConfig);
  const model = resolveModel(providerConfig);

  const body: Record<string, unknown> = {
    prompt,
    ...(providerConfig.sourceImageUrl
      ? {
          image_url: providerConfig.sourceImageUrl,
          strength: providerConfig.strength ?? 0.45,
        }
      : {}),
    ...providerConfig.extra,
  };

  const data = await falFetch<{
    images?: { url: string; width?: number; height?: number }[];
  }>(`${FAL_SYNC_BASE}/${model}`, apiKey, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const image = data.images?.[0];
  if (!image?.url) {
    throw new Error("Fal.ai yanıtında görüntü bulunamadı.");
  }

  return { imageUrl: image.url, width: image.width, height: image.height };
}

// ── 1b) Fotoğraf iyileştirme (Fal.ai — Clarity Upscaler) ──
// SDXL img2img'den farkı: üretken yeniden çizim YOK — kareyi olduğu gibi
// korur, netlik/ışık/detayı yükseltir ve en-boy oranını BOZMAZ. (SDXL
// image-to-image çıktıyı 1024x1024 kareye basıyor, tabela/pencere gibi
// detayları yeniden "hayal ediyordu" — emlak fotoğrafı için yanlış araç.)

export const FAL_ENHANCE_DEFAULT_MODEL = "fal-ai/clarity-upscaler";

export type EnhanceImageInput = {
  sourceImageUrl: string;
  /** Kaynak genişlik (px) — büyük fotoğrafta upscale katsayısını düşürmek için */
  sourceWidth?: number | null;
};

export async function enhanceImage(
  input: EnhanceImageInput,
): Promise<GenerateImageResult> {
  const apiKey = resolveApiKey({ provider: "FAL_SDXL" }); // aynı FAL_KEY
  const model =
    process.env.FAL_ENHANCE_MODEL?.trim() || FAL_ENHANCE_DEFAULT_MODEL;

  // Zaten yüksek çözünürlüklü fotoğrafı 2x büyütmek süre/maliyet israfı —
  // yalnızca küçük kaynaklarda upscale, büyüklerde salt iyileştirme (1x).
  const upscaleFactor =
    input.sourceWidth && input.sourceWidth >= 1600 ? 1 : 2;

  const data = await falFetch<{
    image?: { url?: string; width?: number; height?: number };
  }>(`${FAL_SYNC_BASE}/${model}`, apiKey, {
    method: "POST",
    body: JSON.stringify({
      image_url: input.sourceImageUrl,
      prompt:
        "high quality professional real estate photograph, sharp details, " +
        "natural lighting, realistic colors",
      upscale_factor: upscaleFactor,
      creativity: 0.1, // düşük = fotoğrafa sadık; yapı/eşya/tabela yeniden çizilmez
      resemblance: 0.85, // yüksek = kaynak dokuyu koru
    }),
  });

  if (!data.image?.url) {
    throw new Error("Fal.ai yanıtında görüntü bulunamadı.");
  }
  return {
    imageUrl: data.image.url,
    width: data.image.width,
    height: data.image.height,
  };
}

// ── 2) Video üretimi (Fal.ai — Kling, sahne bazlı) ──

export type GenerateVideoInput = {
  /** Sahnenin kaynak fotoğrafı (VideoScene.sourceImageUrl) */
  sourceImageUrl: string;
  /** Kling: 5 | 10 saniye */
  durationSec?: 5 | 10;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  /** Görsel sadakat: modelin sahneye EKLEMEMESİ/DEĞİŞTİRMEMESİ gerekenler */
  negativePrompt?: string;
  /** İş bitince Fal.ai'nin çağıracağı webhook (StudioJob tamamlama ucu) */
  webhookUrl?: string;
};

/**
 * Bir VideoScene için Fal.ai (Kling) kuyruğuna render işi gönderir.
 * Senkron BEKLEMEZ — dönen requestId StudioJob kaydına yazılır;
 * sonuç worker tarafından getVideoResult ile (veya webhook'la) alınır.
 */
export async function generateVideo(
  sceneId: string,
  prompt: string,
  providerConfig: ProviderConfig & GenerateVideoInput,
): Promise<FalSubmitResult> {
  const apiKey = resolveApiKey(providerConfig);
  const model = resolveModel(providerConfig);

  const webhookSuffix = providerConfig.webhookUrl
    ? `?fal_webhook=${encodeURIComponent(providerConfig.webhookUrl)}`
    : "";

  const data = await falFetch<{ request_id?: string }>(
    `${FAL_QUEUE_BASE}/${model}${webhookSuffix}`,
    apiKey,
    {
      method: "POST",
      body: JSON.stringify({
        prompt,
        image_url: providerConfig.sourceImageUrl,
        duration: String(providerConfig.durationSec ?? 5),
        aspect_ratio: providerConfig.aspectRatio ?? "16:9",
        ...(providerConfig.negativePrompt
          ? { negative_prompt: providerConfig.negativePrompt }
          : {}),
        ...providerConfig.extra,
      }),
    },
  );

  if (!data.request_id) {
    throw new Error(
      `Fal.ai kuyruk yanıtında request_id yok (sahne: ${sceneId}).`,
    );
  }

  return { requestId: data.request_id, model };
}

/** Kuyruktaki video işinin durumunu sorgular (worker polling). */
export async function getVideoStatus(
  requestId: string,
  providerConfig: ProviderConfig,
): Promise<{ status: FalQueueStatus }> {
  const apiKey = resolveApiKey(providerConfig);
  const model = resolveModel(providerConfig);

  return falFetch<{ status: FalQueueStatus }>(
    `${FAL_QUEUE_BASE}/${model}/requests/${requestId}/status`,
    apiKey,
    { method: "GET" },
  );
}

export type GenerateVideoResult = {
  videoUrl: string;
};

/** Tamamlanan video işinin çıktısını alır — URL geçicidir, R2'ye kopyalanmalı. */
export async function getVideoResult(
  requestId: string,
  providerConfig: ProviderConfig,
): Promise<GenerateVideoResult> {
  const apiKey = resolveApiKey(providerConfig);
  const model = resolveModel(providerConfig);

  const data = await falFetch<{ video?: { url?: string } }>(
    `${FAL_QUEUE_BASE}/${model}/requests/${requestId}`,
    apiKey,
    { method: "GET" },
  );

  if (!data.video?.url) {
    throw new Error("Fal.ai video sonucunda çıktı URL'si bulunamadı.");
  }

  return { videoUrl: data.video.url };
}

// ── 2b) Video birleştirme (Fal.ai — ffmpeg compose) ──
// Render edilmiş sahne kliplerini ve seslendirmeyi tek videoda birleştirir.

export const FFMPEG_COMPOSE_MODEL = "fal-ai/ffmpeg-api/compose";

export type MergeSceneInput = {
  videoUrl: string;
  durationSec: number;
};

export type MergeAudioKeyframe = {
  url: string;
  /** ms — zaman çizelgesindeki başlangıç */
  timestamp: number;
  /** ms */
  duration: number;
};

/**
 * Sahneleri (+ varsa ses parçaları) Fal.ai ffmpeg compose kuyruğuna gönderir.
 * Ses, segment bazlı seslendirmede cümle cümle ayrı keyframe olarak dizilir.
 * Senkron beklemez — requestId döner, sonuç getMergeResult ile alınır.
 */
export async function mergeVideoWithAudio(
  scenes: MergeSceneInput[],
  audioKeyframes: MergeAudioKeyframe[] | null,
  providerConfig?: Partial<ProviderConfig>,
): Promise<FalSubmitResult> {
  const config: ProviderConfig = {
    provider: "FAL_KLING", // FAL_KEY paylaşılır
    ...providerConfig,
    model: FFMPEG_COMPOSE_MODEL,
  };
  const apiKey = resolveApiKey(config);

  // Kliplerin zaman çizelgesi — timestamp/duration milisaniye
  let cursor = 0;
  const videoKeyframes = scenes.map((s) => {
    const kf = { url: s.videoUrl, timestamp: cursor, duration: s.durationSec * 1000 };
    cursor += s.durationSec * 1000;
    return kf;
  });

  const tracks: Record<string, unknown>[] = [
    { id: "video", type: "video", keyframes: videoKeyframes },
  ];
  if (audioKeyframes?.length) {
    tracks.push({ id: "voiceover", type: "audio", keyframes: audioKeyframes });
  }

  const data = await falFetch<{ request_id?: string }>(
    `${FAL_QUEUE_BASE}/${FFMPEG_COMPOSE_MODEL}`,
    apiKey,
    { method: "POST", body: JSON.stringify({ tracks }) },
  );

  if (!data.request_id) {
    throw new Error("Fal.ai compose kuyruk yanıtında request_id yok.");
  }

  return { requestId: data.request_id, model: FFMPEG_COMPOSE_MODEL };
}

/** Tamamlanan birleştirme işinin çıktı URL'sini alır (şema esnek ayrıştırılır). */
export async function getMergeResult(
  requestId: string,
  providerConfig?: Partial<ProviderConfig>,
): Promise<GenerateVideoResult> {
  const config: ProviderConfig = {
    provider: "FAL_KLING",
    ...providerConfig,
    model: FFMPEG_COMPOSE_MODEL,
  };
  const apiKey = resolveApiKey(config);

  const data = await falFetch<{
    video_url?: string;
    video?: { url?: string };
  }>(`${FAL_QUEUE_BASE}/${FFMPEG_COMPOSE_MODEL}/requests/${requestId}`, apiKey, {
    method: "GET",
  });

  const videoUrl = data.video_url ?? data.video?.url;
  if (!videoUrl) {
    throw new Error("Fal.ai birleştirme sonucunda video URL'si bulunamadı.");
  }

  return { videoUrl };
}

// ── 3) Seslendirme (ElevenLabs) ──

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
// "Rachel" — ElevenLabs'in çok dilli varsayılan sesi; .env ile ezilebilir.
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export type GenerateVoiceInput = {
  /** Verilmezse ELEVENLABS_VOICE_ID, o da yoksa varsayılan ses kullanılır */
  voiceId?: string;
  /** 0-1: ses tutarlılığı/ifade dengesi */
  stability?: number;
  similarityBoost?: number;
};

export type GenerateVoiceResult = {
  buffer: Buffer;
  mimeType: string; // audio/mpeg
};

/**
 * ElevenLabs ile seslendirme üretir. Ses baytlarını döndürür —
 * çağıran taraf (worker) R2'ye yükleyip StudioProject.voiceUrl'e yazar.
 */
export async function generateVoice(
  text: string,
  providerConfig: ProviderConfig & GenerateVoiceInput,
): Promise<GenerateVoiceResult> {
  const apiKey = resolveApiKey(providerConfig);
  const modelId = resolveModel(providerConfig);
  const voiceId =
    providerConfig.voiceId ??
    process.env.ELEVENLABS_VOICE_ID ??
    DEFAULT_VOICE_ID;

  const res = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: providerConfig.stability ?? 0.5,
        similarity_boost: providerConfig.similarityBoost ?? 0.75,
      },
      ...providerConfig.extra,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `ElevenLabs hatası (${res.status}): ${detail.slice(0, 500)}`,
    );
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, mimeType: res.headers.get("content-type") ?? "audio/mpeg" };
}

// ── 3b) Segment bazlı seslendirme (ElevenLabs with-timestamps) ──
// Metin cümle cümle üretilir; previous/next bağlamı tonlamayı tek parça gibi
// akıtır, timestamp hizalaması segmentin gerçek süresini (ms) verir.

export type GenerateVoiceSegmentInput = GenerateVoiceInput & {
  /** Önceki cümle — ElevenLabs tonlama sürekliliği için */
  previousText?: string;
  /** Sonraki cümle */
  nextText?: string;
};

/** Kelime bazlı zamanlama — altyazı (caption) üretimi için. */
export type WordTiming = { word: string; startMs: number; endMs: number };

export type GenerateVoiceSegmentResult = GenerateVoiceResult & {
  durationMs: number;
  /** Hizalama gelmezse boş dizi — altyazı cümle bazlı fallback'e düşer */
  wordTimings: WordTiming[];
};

/** ElevenLabs karakter hizalamasını kelime zamanlamalarına çevirir. */
function parseWordTimings(alignment?: {
  characters?: string[];
  character_start_times_seconds?: number[];
  character_end_times_seconds?: number[];
}): WordTiming[] {
  const chars = alignment?.characters;
  const starts = alignment?.character_start_times_seconds;
  const ends = alignment?.character_end_times_seconds;
  if (!chars?.length || starts?.length !== chars.length || ends?.length !== chars.length) {
    return [];
  }

  const words: WordTiming[] = [];
  let current = "";
  let startIdx = -1;
  for (let i = 0; i <= chars.length; i++) {
    const c = i < chars.length ? chars[i] : " "; // son kelimeyi kapat
    if (/\s/.test(c)) {
      if (current) {
        words.push({
          word: current,
          startMs: Math.round(starts[startIdx] * 1000),
          endMs: Math.round(ends[i - 1] * 1000),
        });
        current = "";
        startIdx = -1;
      }
    } else {
      if (!current) startIdx = i;
      current += c;
    }
  }
  return words;
}

export async function generateVoiceSegment(
  text: string,
  providerConfig: ProviderConfig & GenerateVoiceSegmentInput,
): Promise<GenerateVoiceSegmentResult> {
  const apiKey = resolveApiKey(providerConfig);
  const modelId = resolveModel(providerConfig);
  const voiceId =
    providerConfig.voiceId ??
    process.env.ELEVENLABS_VOICE_ID ??
    DEFAULT_VOICE_ID;

  const res = await fetch(
    `${ELEVENLABS_BASE}/text-to-speech/${voiceId}/with-timestamps`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: providerConfig.stability ?? 0.5,
          similarity_boost: providerConfig.similarityBoost ?? 0.75,
        },
        ...(providerConfig.previousText
          ? { previous_text: providerConfig.previousText }
          : {}),
        ...(providerConfig.nextText ? { next_text: providerConfig.nextText } : {}),
        ...providerConfig.extra,
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `ElevenLabs hatası (${res.status}): ${detail.slice(0, 500)}`,
    );
  }

  const data = (await res.json()) as {
    audio_base64?: string;
    alignment?: {
      characters?: string[];
      character_start_times_seconds?: number[];
      character_end_times_seconds?: number[];
    };
  };
  if (!data.audio_base64) {
    throw new Error("ElevenLabs yanıtında ses verisi bulunamadı.");
  }

  const ends = data.alignment?.character_end_times_seconds;
  // Hizalama gelmezse Türkçe ~14 karakter/sn tahminiyle düş
  const durationMs = ends?.length
    ? Math.round(ends[ends.length - 1] * 1000)
    : Math.round((text.length / 14) * 1000);

  return {
    buffer: Buffer.from(data.audio_base64, "base64"),
    mimeType: "audio/mpeg",
    durationMs,
    wordTimings: parseWordTimings(data.alignment),
  };
}
