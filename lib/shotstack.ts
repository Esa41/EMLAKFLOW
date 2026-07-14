// ── Shotstack Edit API İstemcisi (kurgu katmanı) ──
// Kling sahneleri ÜRETİR (ai-provider-registry), Shotstack BİRLEŞTİRİR:
// geçiş efektleri, ekran yazısı (HTML overlay) ve müzik miksi burada eklenir.
// Fal'ın ffmpeg compose endpoint'i bunları desteklemediği için ayrı vendor.
//
// Render asenkrondur: submit → renderId → webhook callback + polling
// (mevcut reconcile mimarisiyle aynı claim-korumalı desen).
//
// Env (çağrı anında okunur — registry geleneği):
//   SHOTSTACK_API_KEY        zorunlu
//   SHOTSTACK_HOST           "stage" (sandbox, filigranlı, ücretsiz) | "v1" (prod)
//   SHOTSTACK_WEBHOOK_SECRET webhook token'ı (yoksa callback gönderilmez)

import type { ResolvedOverlay, OverlayStyleKey, TransitionKey } from "@/lib/studio-templates";

const SHOTSTACK_BASE = "https://api.shotstack.io";

function resolveShotstackHost(): string {
  const host = process.env.SHOTSTACK_HOST?.trim();
  return host === "v1" ? "v1" : "stage";
}

function resolveShotstackKey(): string {
  const key = process.env.SHOTSTACK_API_KEY;
  if (!key) {
    throw new Error(
      "Shotstack için API anahtarı bulunamadı — .env dosyasına SHOTSTACK_API_KEY ekleyin.",
    );
  }
  return key;
}

async function shotstackFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SHOTSTACK_BASE}/${resolveShotstackHost()}${path}`, {
    ...init,
    headers: {
      "x-api-key": resolveShotstackKey(),
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Shotstack hatası (${res.status}): ${detail.slice(0, 500)}`);
  }
  return (await res.json()) as T;
}

// ── Edit JSON tipleri (kullandığımız alt küme) ──

type ShotstackAsset =
  | { type: "video"; url: string; volume?: number }
  | { type: "audio"; url: string; volume?: number; effect?: "fadeIn" | "fadeOut" | "fadeInFadeOut" }
  | { type: "html"; html: string; css: string; width: number; height: number };

type ShotstackClip = {
  asset: ShotstackAsset;
  start: number; // saniye
  length: number; // saniye
  fit?: "crop" | "cover" | "contain" | "none";
  position?:
    | "top" | "topRight" | "right" | "bottomRight" | "bottom"
    | "bottomLeft" | "left" | "topLeft" | "center";
  offset?: { x?: number; y?: number };
  volume?: number;
  transition?: { in?: string; out?: string };
};

export type ShotstackEdit = {
  timeline: {
    background: string;
    fonts?: { src: string }[];
    tracks: { clips: ShotstackClip[] }[];
  };
  output: { format: "mp4"; size: { width: number; height: number } };
  callback?: string;
};

// ── 1) Render gönderimi + durum sorgusu ──

export async function submitShotstackRender(
  edit: ShotstackEdit,
): Promise<{ renderId: string }> {
  const data = await shotstackFetch<{ response?: { id?: string } }>("/render", {
    method: "POST",
    body: JSON.stringify(edit),
  });
  const renderId = data.response?.id;
  if (!renderId) throw new Error("Shotstack render kimliği alınamadı.");
  return { renderId };
}

export type ShotstackRenderStatus =
  | "queued"
  | "fetching"
  | "rendering"
  | "saving"
  | "done"
  | "failed";

export async function getShotstackRender(renderId: string): Promise<{
  status: ShotstackRenderStatus;
  url?: string;
  error?: string;
}> {
  const data = await shotstackFetch<{
    response?: { status?: string; url?: string; error?: string };
  }>(`/render/${renderId}`);
  return {
    status: (data.response?.status ?? "queued") as ShotstackRenderStatus,
    url: data.response?.url,
    error: data.response?.error,
  };
}

// ── 2) Overlay stilleri — ekran yazısı kartlarının HTML/CSS üreticileri ──
// Kling prompt'unda yazı YASAK (BASE_NEGATIVE_PROMPT); tüm yazılar burada,
// kurgu katmanında bindirilir. Font: Montserrat (Türkçe glif desteği).

const MONTSERRAT =
  "https://templates.shotstack.io/basic/asset/font/montserrat-bold.ttf";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type OverlayRender = {
  html: string;
  css: string;
  width: number;
  height: number;
  position: ShotstackClip["position"];
  offset?: { x?: number; y?: number };
  transition: { in: string; out: string };
};

const OVERLAY_STYLES: Record<OverlayStyleKey, (text: string) => OverlayRender> = {
  cardTopLeft: (text) => ({
    html: `<div class="card">${escapeHtml(text)}</div>`,
    css: `.card { font-family: "Montserrat"; font-size: 34px; color: #ffffff; background: rgba(0,0,0,0.55); padding: 14px 22px; border-radius: 12px; display: inline-block; }`,
    width: 620,
    height: 90,
    position: "topLeft",
    offset: { x: 0.04, y: -0.05 },
    transition: { in: "slideRight", out: "fade" },
  }),
  bannerBottom: (text) => ({
    html: `<div class="banner">${escapeHtml(text)}</div>`,
    css: `.banner { font-family: "Montserrat"; font-size: 40px; font-weight: 700; color: #ffffff; background: rgba(14,116,144,0.85); padding: 16px 32px; border-radius: 14px; text-align: center; }`,
    width: 1000,
    height: 100,
    position: "bottom",
    offset: { y: 0.07 },
    transition: { in: "slideUp", out: "fade" },
  }),
  bigCenter: (text) => ({
    html: `<div class="price">${escapeHtml(text)}</div>`,
    css: `.price { font-family: "Montserrat"; font-size: 72px; font-weight: 800; color: #ffffff; text-shadow: 0 4px 24px rgba(0,0,0,0.7); text-align: center; }`,
    width: 1000,
    height: 150,
    position: "center",
    transition: { in: "zoom", out: "fade" },
  }),
  hook: (text) => ({
    html: `<div class="hook">${escapeHtml(text)}</div>`,
    css: `.hook { font-family: "Montserrat"; font-size: 56px; font-weight: 800; color: #ffffff; background: rgba(220,38,38,0.9); padding: 18px 30px; border-radius: 16px; text-align: center; }`,
    width: 900,
    height: 200,
    position: "center",
    offset: { y: 0.18 },
    transition: { in: "zoom", out: "fade" },
  }),
  cta: (text) => ({
    html: `<div class="cta">${escapeHtml(text)}</div>`,
    css: `.cta { font-family: "Montserrat"; font-size: 42px; font-weight: 700; color: #0f172a; background: rgba(255,255,255,0.92); padding: 16px 30px; border-radius: 999px; text-align: center; }`,
    width: 900,
    height: 110,
    position: "bottom",
    offset: { y: 0.1 },
    transition: { in: "slideUp", out: "fade" },
  }),
};

// ── 3) Proje → Shotstack timeline dönüştürücü ──

export type TimelineSceneInput = {
  videoUrl: string;
  durationSec: number;
  /** Bu sahnenin GİRİŞ geçişi — ilk sahnede null */
  transitionIn: TransitionKey | null;
};

export function buildTimelineFromProject(input: {
  aspectRatio: string; // "16:9" | "9:16"
  scenes: TimelineSceneInput[];
  /** Mevcut mergeProject formatı — timestamp/duration milisaniye */
  voiceKeyframes: { url: string; timestamp: number; duration: number }[] | null;
  music: { url: string; volume: number } | null;
  overlays: ResolvedOverlay[];
  callbackUrl?: string;
}): ShotstackEdit {
  const portrait = input.aspectRatio === "9:16";
  const totalSec = input.scenes.reduce((sum, s) => sum + s.durationSec, 0);

  // Sahne başlangıç zamanları (bitişik dizilim)
  const sceneStarts: number[] = [];
  let cursor = 0;
  for (const s of input.scenes) {
    sceneStarts.push(cursor);
    cursor += s.durationSec;
  }

  // [1] Sahne videoları — aynı track'te bitişik klipler; transition.in
  // Shotstack'te iki klip arasında çapraz geçiş üretir.
  const videoClips: ShotstackClip[] = input.scenes.map((s, i) => ({
    asset: { type: "video", url: s.videoUrl },
    start: sceneStarts[i],
    length: s.durationSec,
    fit: "crop",
    ...(s.transitionIn && s.transitionIn !== "none"
      ? { transition: { in: s.transitionIn } }
      : {}),
  }));

  // [0] Ekran yazıları — hedef sahnenin timeline offset'i + slot startSec
  const overlayClips: ShotstackClip[] = [];
  for (const o of input.overlays) {
    if (!o.enabled || !o.text.trim()) continue;
    const style = OVERLAY_STYLES[o.styleKey] ?? OVERLAY_STYLES.bannerBottom;
    const render = style(o.text.trim());
    const targets: number[] =
      o.placement === "first"
        ? [0]
        : o.placement === "last"
          ? [input.scenes.length - 1]
          : o.placement === "all"
            ? input.scenes.map((_, i) => i)
            : [Math.min(Math.max(o.placement, 0), input.scenes.length - 1)];
    for (const sceneIndex of targets) {
      const sceneStart = sceneStarts[sceneIndex];
      const sceneLen = input.scenes[sceneIndex].durationSec;
      const start = sceneStart + Math.min(o.startSec, Math.max(sceneLen - 1, 0));
      const length = Math.min(o.lengthSec, sceneStart + sceneLen - start);
      if (length <= 0) continue;
      overlayClips.push({
        asset: {
          type: "html",
          html: render.html,
          css: render.css,
          width: render.width,
          height: render.height,
        },
        start,
        length,
        position: render.position,
        ...(render.offset ? { offset: render.offset } : {}),
        transition: render.transition,
      });
    }
  }

  // [2] Seslendirme — segment başına bir audio klip
  const voiceClips: ShotstackClip[] = (input.voiceKeyframes ?? []).map((kf) => ({
    asset: { type: "audio", url: kf.url, volume: 1 },
    start: kf.timestamp / 1000,
    length: kf.duration / 1000,
  }));

  // [3] Müzik — tek klip, seslendirme altında sabit düşük seviye (duck)
  const musicClips: ShotstackClip[] = input.music
    ? [
        {
          asset: {
            type: "audio",
            url: input.music.url,
            volume: input.music.volume,
            effect: "fadeOut",
          },
          start: 0,
          length: totalSec,
        },
      ]
    : [];

  // Track sırası: Shotstack ilk track'i EN ÜSTTE render eder
  const tracks: { clips: ShotstackClip[] }[] = [];
  if (overlayClips.length) tracks.push({ clips: overlayClips });
  tracks.push({ clips: videoClips });
  if (voiceClips.length) tracks.push({ clips: voiceClips });
  if (musicClips.length) tracks.push({ clips: musicClips });

  return {
    timeline: {
      background: "#000000",
      ...(overlayClips.length ? { fonts: [{ src: MONTSERRAT }] } : {}),
      tracks,
    },
    output: {
      format: "mp4",
      size: portrait
        ? { width: 1080, height: 1920 }
        : { width: 1920, height: 1080 },
    },
    ...(input.callbackUrl ? { callback: input.callbackUrl } : {}),
  };
}
