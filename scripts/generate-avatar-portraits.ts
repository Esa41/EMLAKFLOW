// Vitrin Sunucusu persona varlıklarını üretir ve R2'ye yükler (tek seferlik):
//   Faz 1 — sinematik portreler (FLUX): personanın yüz kimliği
//   Faz 2 — stinger klipleri (FLUX görsel → Kling i2v): detay çekimi + siluet
//           pozu; kurguda kapanış öncesi marka sahnesi olarak kullanılır
//
// Çalıştır: npx tsx scripts/generate-avatar-portraits.ts   (+ --force: üzerine yaz)
//           (+ --skip-stingers: yalnızca portreler)
// Gerekli env (.env'den okunur): FAL_KEY + R2 değişkenleri.
//
// DİKKAT: Portre personanın YÜZ KİMLİĞİDİR — yeniden üretmek yüzü değiştirir
// ve eski videolarla tutarlılık bozulur. Bu yüzden mevcut varlık varsa
// atlanır; bilinçli değiştirmek için --force ile çalıştırın.
//
// Modeller: FAL_PORTRAIT_MODEL (vars. FLUX dev ~$0.025/görsel),
//           FAL_KLING_MODEL (vars. Kling v2.1 std — stinger ~$0.28/klip).
// Beğenilmeyen varlığı --force ile yeniden üretin; videolara girmeden önce
// mutlaka gözle onaylayın.
import { config } from "dotenv";
config();
import {
  AVATAR_PERSONAS,
  AVATAR_STINGERS,
  buildPersonaPortraitPrompt,
  stingerR2Key,
} from "../lib/studio-avatar";
import { putObject, publicUrl } from "../lib/r2";

const PORTRAIT_MODEL =
  process.env.FAL_PORTRAIT_MODEL?.trim() || "fal-ai/flux/dev";
const KLING_MODEL =
  process.env.FAL_KLING_MODEL?.trim() ||
  "fal-ai/kling-video/v2.1/standard/image-to-video";
const FORCE = process.argv.includes("--force");
const SKIP_STINGERS = process.argv.includes("--skip-stingers");

const STINGER_NEGATIVE =
  "distorted hands, extra fingers, morphing, warping, face distortion, " +
  "text, captions, watermark, logo";

function falKey(): string {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY tanımlı değil (.env).");
  return key;
}

async function alreadyUploaded(url: string): Promise<boolean> {
  const res = await fetch(url, { method: "HEAD" }).catch(() => null);
  return !!res?.ok;
}

async function falJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Key ${falKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Fal hatası (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

async function download(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`İndirilemedi (${res.status}).`);
  return {
    buffer: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get("content-type") ?? "application/octet-stream",
  };
}

/** FLUX ile görsel üretir, geçici Fal URL'sini döndürür. */
async function generateImage(prompt: string, portraitAspect: boolean): Promise<string> {
  const data = await falJson<{ images?: { url?: string }[] }>(
    `https://fal.run/${PORTRAIT_MODEL}`,
    {
      method: "POST",
      body: JSON.stringify({
        prompt,
        image_size: portraitAspect ? "portrait_4_3" : "portrait_16_9",
        num_images: 1,
      }),
    },
  );
  const url = data.images?.[0]?.url;
  if (!url) throw new Error("Fal yanıtında görsel yok.");
  return url;
}

/** Kling i2v kuyruğuna gönderir, tamamlanana dek bekler, video URL döndürür. */
async function generateStingerClip(imageUrl: string, motionPrompt: string): Promise<string> {
  const submit = await falJson<{ request_id?: string }>(
    `https://queue.fal.run/${KLING_MODEL}`,
    {
      method: "POST",
      body: JSON.stringify({
        prompt: motionPrompt,
        image_url: imageUrl,
        duration: "5",
        aspect_ratio: "9:16",
        negative_prompt: STINGER_NEGATIVE,
      }),
    },
  );
  if (!submit.request_id) throw new Error("Kuyruk yanıtında request_id yok.");

  // Durum ucu APP kimliğini kullanır (ilk iki segment) — reconcile ile aynı kural
  const appId = KLING_MODEL.split("/").slice(0, 2).join("/");
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 10_000));
    const status = await falJson<{ status?: string }>(
      `https://queue.fal.run/${appId}/requests/${submit.request_id}/status`,
    );
    process.stdout.write(".");
    if (status.status === "COMPLETED") {
      const result = await falJson<{ video?: { url?: string } }>(
        `https://queue.fal.run/${appId}/requests/${submit.request_id}`,
      );
      if (!result.video?.url) throw new Error("Sonuçta video yok.");
      console.log("");
      return result.video.url;
    }
  }
  throw new Error("Zaman aşımı — klip 7 dakikada tamamlanmadı.");
}

async function main() {
  console.log(
    `Portre modeli: ${PORTRAIT_MODEL} · Stinger modeli: ${KLING_MODEL}` +
      `${FORCE ? " · --force: mevcutların üzerine yazılacak" : ""}\n`,
  );

  // ── Faz 1: Portreler ──
  for (const persona of AVATAR_PERSONAS) {
    const url = publicUrl(persona.portraitR2Key);
    if (!FORCE && (await alreadyUploaded(url))) {
      console.log(`⏭  ${persona.label}: portre zaten var — atlandı`);
      continue;
    }
    console.log(`🎨 ${persona.label}: portre üretiliyor…`);
    const imageUrl = await generateImage(buildPersonaPortraitPrompt(persona), true);
    const { buffer, contentType } = await download(imageUrl);
    await putObject(persona.portraitR2Key, buffer, contentType);
    console.log(`✅ ${persona.label}: ${url}`);
  }

  // ── Faz 2: Stinger klipleri ──
  if (!SKIP_STINGERS) {
    for (const persona of AVATAR_PERSONAS) {
      for (const st of AVATAR_STINGERS) {
        const key = stingerR2Key(persona.key, st.key);
        const url = publicUrl(key);
        if (!FORCE && (await alreadyUploaded(url))) {
          console.log(`⏭  ${persona.label}/${st.key}: stinger zaten var — atlandı`);
          continue;
        }
        console.log(`🎬 ${persona.label}/${st.label}: görsel + klip üretiliyor…`);
        const imageUrl = await generateImage(st.imagePrompt(persona), false);
        const videoUrl = await generateStingerClip(imageUrl, st.motionPrompt);
        const { buffer } = await download(videoUrl);
        await putObject(key, buffer, "video/mp4");
        console.log(`✅ ${persona.label}/${st.key}: ${url}`);
      }
    }
  }

  console.log(
    "\nSonraki adımlar:\n" +
      "  1. Portre ve stinger'ları gözle onaylayın (--force ile yeniden üretilebilir).\n" +
      "  2. ElevenLabs ses id'lerini env'e ekleyin: ELEVENLABS_VOICE_ELIF / _DENIZ / _KEREM.\n" +
      "  3. lib/studio-avatar.ts → persona available:true,\n" +
      "     lib/studio-templates.ts → presenter_reels available:true yapın.",
  );
}

main().catch((err) => {
  console.error("Hata:", err instanceof Error ? err.message : err);
  process.exit(1);
});
