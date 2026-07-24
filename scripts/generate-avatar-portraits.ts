// Vitrin Sunucusu persona portrelerini üretir ve R2'ye yükler (tek seferlik).
// Çalıştır: npx tsx scripts/generate-avatar-portraits.ts   (+ --force: üzerine yaz)
// Gerekli env (.env'den okunur): FAL_KEY + R2 değişkenleri.
//
// DİKKAT: Portre personanın YÜZ KİMLİĞİDİR — yeniden üretmek yüzü değiştirir
// ve eski videolarla tutarlılık bozulur. Bu yüzden mevcut portre varsa
// atlanır; bilinçli değiştirmek için --force ile çalıştırın.
//
// Model: FAL_PORTRAIT_MODEL ile ezilebilir (varsayılan FLUX dev, ~$0.025/görsel).
// Beğenilmeyen portreyi aynı persona için --force ile tekrar üretebilirsiniz;
// videolara girmeden önce mutlaka gözle onaylayın.
import { config } from "dotenv";
config();
import { AVATAR_PERSONAS, buildPersonaPortraitPrompt } from "../lib/studio-avatar";
import { putObject, publicUrl } from "../lib/r2";

const MODEL = process.env.FAL_PORTRAIT_MODEL?.trim() || "fal-ai/flux/dev";
const FORCE = process.argv.includes("--force");

async function alreadyUploaded(url: string): Promise<boolean> {
  const res = await fetch(url, { method: "HEAD" }).catch(() => null);
  return !!res?.ok;
}

async function generatePortrait(prompt: string): Promise<{ buffer: Buffer; contentType: string }> {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) throw new Error("FAL_KEY tanımlı değil (.env).");

  const res = await fetch(`https://fal.run/${MODEL}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: "portrait_4_3", // Kling avatar dikey kadrajına uygun
      num_images: 1,
    }),
  });
  if (!res.ok) {
    throw new Error(`Fal hatası (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as { images?: { url?: string }[] };
  const imageUrl = data.images?.[0]?.url;
  if (!imageUrl) throw new Error("Fal yanıtında görsel yok.");

  const img = await fetch(imageUrl);
  if (!img.ok) throw new Error(`Görsel indirilemedi (${img.status}).`);
  return {
    buffer: Buffer.from(await img.arrayBuffer()),
    contentType: img.headers.get("content-type") ?? "image/png",
  };
}

async function main() {
  console.log(`Model: ${MODEL}${FORCE ? " (--force: mevcutların üzerine yazılacak)" : ""}\n`);

  for (const persona of AVATAR_PERSONAS) {
    const url = publicUrl(persona.portraitR2Key);
    if (!FORCE && (await alreadyUploaded(url))) {
      console.log(`⏭  ${persona.label}: portre zaten var — atlandı (${url})`);
      continue;
    }

    console.log(`🎨 ${persona.label}: üretiliyor…`);
    const prompt = buildPersonaPortraitPrompt(persona);
    const { buffer, contentType } = await generatePortrait(prompt);
    await putObject(persona.portraitR2Key, buffer, contentType);
    console.log(`✅ ${persona.label}: ${url}`);
  }

  console.log(
    "\nSonraki adımlar:\n" +
      "  1. Portreleri gözle onaylayın (beğenmediğinizi --force ile yeniden üretin).\n" +
      "  2. ElevenLabs ses id'lerini env'e ekleyin: ELEVENLABS_VOICE_ELIF / _DENIZ / _KEREM.\n" +
      "  3. lib/studio-avatar.ts → persona available:true,\n" +
      "     lib/studio-templates.ts → presenter_reels available:true yapın.",
  );
}

main().catch((err) => {
  console.error("Hata:", err instanceof Error ? err.message : err);
  process.exit(1);
});
