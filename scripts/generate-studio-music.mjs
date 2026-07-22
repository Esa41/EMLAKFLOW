// ── AI Stüdyo müzik üretimi (tek seferlik operasyon) ──
// Kalan 3 müzik slotunu Stable Audio 2.5 (Fal) ile üretir ve R2'ye yükler.
// Çalıştır: node scripts/generate-studio-music.mjs
// Gereksinim: .env.local'de FAL_KEY (bakiyeli) + .env'de R2_* anahtarları.
// calm_piano ve ambient_nature Mixkit'ten yüklü — bu script onlara DOKUNMAZ.

import { config } from "dotenv";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

config({ path: ".env" });
config({ path: ".env.local" });

const MODEL = "fal-ai/stable-audio-25/text-to-audio";
// Prompt dili: enstrümantal + kullanım bağlamı + tempo — vokal istenmez
// (altyazı/seslendirmeyle çakışır). 90 sn: en uzun per_scene kurguyu kaplar.
const TRACKS = {
  uplifting_corporate: {
    prompt:
      "Uplifting modern corporate background music, warm synth pads, clean electric piano, light electronic percussion, confident and trustworthy mood, steady 100 bpm, instrumental, no vocals",
    seconds: 90,
  },
  energetic_pop: {
    prompt:
      "Energetic upbeat pop instrumental, catchy bright synth hooks, punchy driving drums, fun social media advertisement energy, 122 bpm, instrumental, no vocals",
    seconds: 90,
  },
  epic_cinematic: {
    prompt:
      "Epic cinematic orchestral music, majestic prestigious mood, sweeping strings, deep brass swells, powerful percussion hits, luxury showcase trailer, instrumental, no vocals",
    seconds: 90,
  },
};

const falHeaders = {
  Authorization: `Key ${process.env.FAL_KEY}`,
  "Content-Type": "application/json",
};

async function generate(slot, { prompt, seconds }) {
  const submit = await fetch(`https://queue.fal.run/${MODEL}`, {
    method: "POST",
    headers: falHeaders,
    body: JSON.stringify({ prompt, seconds_total: seconds }),
  });
  const sub = await submit.json();
  if (!submit.ok) throw new Error(`${slot} submit ${submit.status}: ${JSON.stringify(sub)}`);
  const { request_id } = sub;

  // Kuyruk: tamamlanana dek 5 sn arayla yokla (üretim ~30-60 sn sürer)
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const st = await fetch(`https://queue.fal.run/${MODEL}/requests/${request_id}/status`, { headers: falHeaders });
    const s = await st.json();
    if (s.status === "COMPLETED") break;
    if (s.status === "FAILED" || st.status >= 400) throw new Error(`${slot} kuyruk: ${JSON.stringify(s)}`);
    if (i === 59) throw new Error(`${slot} zaman aşımı`);
  }

  const res = await fetch(`https://queue.fal.run/${MODEL}/requests/${request_id}`, { headers: falHeaders });
  const out = await res.json();
  const url = out?.audio?.url ?? out?.audio_file?.url;
  if (!url) throw new Error(`${slot} çıktı URL yok: ${JSON.stringify(out).slice(0, 300)}`);
  const bytes = Buffer.from(await (await fetch(url)).arrayBuffer());
  const isWav = url.includes(".wav") || bytes.subarray(0, 4).toString() === "RIFF";
  return { bytes, contentType: isWav ? "audio/wav" : "audio/mpeg" };
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

for (const [slot, def] of Object.entries(TRACKS)) {
  console.log(`🎵 ${slot} üretiliyor…`);
  const { bytes, contentType } = await generate(slot, def);
  // Anahtar .mp3 sabit (lib/studio-music.ts) — WAV gelirse de aynı anahtara
  // konur; Shotstack ve tarayıcı içeriği baytlardan tanır, uzantıya bakmaz.
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET || "emlakflow-media",
      Key: `studio/music/${slot}.mp3`,
      Body: bytes,
      ContentType: contentType,
    }),
  );
  console.log(`   ✔ R2'ye yüklendi (${Math.round(bytes.length / 1024)} KB, ${contentType})`);
}
console.log("Bitti — 5/5 müzik slotu dolu.");
