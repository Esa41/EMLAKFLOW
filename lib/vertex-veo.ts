import {
  getGoogleAccessToken,
  getGoogleCloudLocation,
  getGoogleCloudProjectId,
  getVeoModelId,
} from "./google-cloud-auth";

const VEO_PROMPT =
  "Cinematic 4K drone fly-through, slowly approaching the building in the center, smooth panning, sunny daylight, photorealistic.";

const POLL_INTERVAL_MS = 10_000;
const MAX_POLL_ATTEMPTS = 36; // ~6 dakika

type VeoStartResponse = {
  name?: string;
};

type VeoVideoResult = {
  gcsUri?: string;
  bytesBase64Encoded?: string;
  mimeType?: string;
};

type VeoPollResponse = {
  name?: string;
  done?: boolean;
  error?: { message?: string };
  response?: {
    videos?: VeoVideoResult[];
    raiMediaFilteredCount?: number;
  };
};

function veoBaseUrl(): string {
  const projectId = getGoogleCloudProjectId();
  const location = getGoogleCloudLocation();
  const modelId = getVeoModelId();
  return `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}`;
}

async function veoFetch<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const token = await getGoogleAccessToken();
  const res = await fetch(`${veoBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Vertex AI Veo hatası (${res.status}): ${detail.slice(0, 500)}`,
    );
  }

  return (await res.json()) as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Uzaktan görüntüyü indirip base64'e çevirir (Veo girdisi için). */
export async function fetchImageAsBase64(
  imageUrl: string,
): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Statik harita görüntüsü indirilemedi (${res.status}).`);
  }

  const contentType = res.headers.get("content-type") ?? "image/png";
  const mimeType = contentType.includes("jpeg")
    ? "image/jpeg"
    : contentType.includes("png")
      ? "image/png"
      : "image/png";

  const buffer = Buffer.from(await res.arrayBuffer());
  return { base64: buffer.toString("base64"), mimeType };
}

export type VeoGeneratedVideo = {
  buffer: Buffer;
  mimeType: string;
};

/**
 * Mapbox statik görüntüsünden Vertex AI Veo ile drone videosu üretir.
 * storageUri verilmez — video baytları yanıtta döner, Vercel Blob'a yüklenir.
 */
export async function generateDroneVideoFromImage(
  imageUrl: string,
  prompt: string = VEO_PROMPT,
): Promise<VeoGeneratedVideo> {
  const { base64, mimeType } = await fetchImageAsBase64(imageUrl);

  const start = await veoFetch<VeoStartResponse>(":predictLongRunning", {
    instances: [
      {
        prompt,
        image: {
          bytesBase64Encoded: base64,
          mimeType,
        },
      },
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio: "16:9",
      durationSeconds: 8,
    },
  });

  const operationName = start.name;
  if (!operationName) {
    throw new Error("Vertex AI işlem adı döndürülmedi.");
  }

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);

    const status = await veoFetch<VeoPollResponse>(":fetchPredictOperation", {
      operationName,
    });

    if (status.error?.message) {
      throw new Error(`Veo üretim hatası: ${status.error.message}`);
    }

    if (!status.done) continue;

    const video = status.response?.videos?.[0];
    if (!video) {
      throw new Error("Veo yanıtında video bulunamadı.");
    }

    if (video.bytesBase64Encoded) {
      return {
        buffer: Buffer.from(video.bytesBase64Encoded, "base64"),
        mimeType: video.mimeType ?? "video/mp4",
      };
    }

    if (video.gcsUri) {
      throw new Error(
        `Veo video GCS URI döndürdü (${video.gcsUri}); Blob yükleme için bytesBase64Encoded bekleniyordu.`,
      );
    }

    throw new Error("Veo video çıktısı tanınmadı.");
  }

  throw new Error("Veo video üretimi zaman aşımına uğradı.");
}
