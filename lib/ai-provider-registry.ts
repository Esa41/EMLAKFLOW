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
  /** providerConfig.model verilmezse kullanılacak model */
  defaultModel: string;
};

export const PROVIDER_REGISTRY: Record<AiProviderKey, ProviderDefinition> = {
  FAL_KLING: {
    label: "Fal.ai — Kling (video)",
    envVar: "FAL_KEY",
    defaultModel: "fal-ai/kling-video/v2.1/standard/image-to-video",
  },
  FAL_SDXL: {
    label: "Fal.ai — SDXL (fotoğraf iyileştirme)",
    envVar: "FAL_KEY",
    defaultModel: "fal-ai/fast-sdxl/image-to-image",
  },
  ELEVENLABS: {
    label: "ElevenLabs (seslendirme)",
    envVar: "ELEVENLABS_API_KEY",
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

function resolveModel(config: ProviderConfig): string {
  return config.model ?? PROVIDER_REGISTRY[config.provider].defaultModel;
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

// ── 2) Video üretimi (Fal.ai — Kling, sahne bazlı) ──

export type GenerateVideoInput = {
  /** Sahnenin kaynak fotoğrafı (VideoScene.sourceImageUrl) */
  sourceImageUrl: string;
  /** Kling: 5 | 10 saniye */
  durationSec?: 5 | 10;
  aspectRatio?: "16:9" | "9:16" | "1:1";
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
