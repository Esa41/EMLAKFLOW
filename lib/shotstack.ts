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
import {
  AVATAR_PIP,
  AVATAR_INTRO_SEC,
  AI_DISCLOSURE_TEXT,
  HOOK_DEFAULT_COLOR,
} from "@/lib/studio-avatar";

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
  | { type: "video"; src: string; volume?: number; trim?: number }
  | { type: "audio"; src: string; volume?: number; effect?: "fadeIn" | "fadeOut" | "fadeInFadeOut" }
  | { type: "html"; html: string; css: string; width: number; height: number }
  | { type: "image"; src: string };

type ShotstackClip = {
  asset: ShotstackAsset;
  start: number; // saniye
  length: number; // saniye
  fit?: "crop" | "cover" | "contain" | "none";
  scale?: number; // çıktı genişliğine oranla boyut (filigran/logo)
  opacity?: number;
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
    // Altyazı bandının (y ~0.05-0.15) üstünde durur — çakışma yok
    offset: { y: 0.2 },
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
    // Altyazı bandının üstünde durur — çakışma yok
    offset: { y: 0.2 },
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

/** Altyazı parçası — kelime zamanlamalarından gruplanmış kısa metin. */
export type CaptionChunk = { text: string; startMs: number; endMs: number };

/** Ofis kimliği — kapanış kartı + köşe filigranı. */
export type TimelineBranding = {
  name: string;
  phone: string | null;
  logoUrl: string | null;
};

const OUTRO_SEC = 3.5;

export function buildTimelineFromProject(input: {
  aspectRatio: string; // "16:9" | "9:16"
  scenes: TimelineSceneInput[];
  /** Mevcut mergeProject formatı — timestamp/duration milisaniye */
  voiceKeyframes: { url: string; timestamp: number; duration: number }[] | null;
  music: { url: string; volume: number } | null;
  overlays: ResolvedOverlay[];
  /** Boş dizi = altyazı yok */
  captions?: CaptionChunk[];
  /** null = kapanış kartı/filigran yok */
  branding?: TimelineBranding | null;
  /**
   * Vitrin Sunucusu klibi: startSec anında (kuruluş sahnesinden sonra)
   * TAM EKRAN girer, AVATAR_INTRO_SEC sonra köşe penceresine (PiP) küçülür;
   * sesi (dudak senkronlu konuşma) videoya gömülüdür. Verildiğinde AI
   * şeffaflık ibaresi OTOMATİK basılır.
   */
  avatar?: { videoUrl: string; durationSec: number; startSec?: number } | null;
  /**
   * Altyazı stili: "band" küçük alt bant (varsayılan); "hook" referans
   * kreatiflerdeki dev, ortalanmış kelime-kelime tipografi (avatar kurguları).
   */
  captionStyle?: "band" | "hook";
  /** Hook tipografisinin rengi — ofis marka rengi (yoksa HOOK_DEFAULT_COLOR). */
  hookColor?: string;
  callbackUrl?: string;
}): ShotstackEdit {
  const portrait = input.aspectRatio === "9:16";
  const scenesSec = input.scenes.reduce((sum, s) => sum + s.durationSec, 0);
  const totalSec = scenesSec + (input.branding ? OUTRO_SEC : 0);
  // Sunucunun videoya giriş anı (kuruluş sahnesinden sonra)
  const avatarStartSec = Math.min(input.avatar?.startSec ?? 0, scenesSec);

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
    asset: { type: "video", src: s.videoUrl },
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
    // Tek sahne (reference modu — Seedance tek video): sahne index'i yok,
    // yerleşim ZAMANA göre hesaplanır. Aksi halde "son sahne" işaretli
    // fiyat/CTA videonun başında çıkardı.
    const windows: { start: number; length: number }[] = [];
    if (input.scenes.length === 1) {
      const total = input.scenes[0].durationSec;
      let start: number;
      if (o.placement === "last") {
        start = Math.max(0, total - o.lengthSec - 0.5);
      } else if (o.placement === "first" || o.placement === "all") {
        start = o.startSec;
      } else {
        // sahne index'i → orantılı zaman (0=baş, N=son)
        const ratio = Math.min(Math.max(o.placement, 0), 4) / 5;
        start = Math.min(total * ratio + o.startSec, Math.max(total - 1, 0));
      }
      const length = Math.min(
        o.placement === "all" ? total : o.lengthSec,
        total - start,
      );
      if (length > 0) windows.push({ start, length });
    } else {
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
        if (length > 0) windows.push({ start, length });
      }
    }

    for (const { start, length } of windows) {
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
    asset: { type: "audio", src: kf.url, volume: 1 },
    start: kf.timestamp / 1000,
    length: kf.duration / 1000,
  }));

  // [3] Müzik — tek klip, seslendirme altında sabit düşük seviye (duck);
  // kapanış kartı varsa müzik onu da kaplar ve fade-out ile biter
  const musicClips: ShotstackClip[] = input.music
    ? [
        {
          asset: {
            type: "audio",
            src: input.music.url,
            volume: input.music.volume,
            effect: "fadeOut",
          },
          start: 0,
          length: totalSec,
        },
      ]
    : [];

  // [A] Altyazılar — iki stil:
  //   band : alt bantta küçük kelime grupları (klasik)
  //   hook : dev, ortalanmış, marka renkli kelime-kelime tipografi
  //          (referans AI sunucu kreatiflerinin görsel dili)
  const hookStyle = input.captionStyle === "hook";
  const hookColor = input.hookColor?.trim() || HOOK_DEFAULT_COLOR;
  const captionClips: ShotstackClip[] = (input.captions ?? [])
    .filter((c) => c.text.trim() && c.endMs > c.startMs)
    .map((c) =>
      hookStyle
        ? {
            asset: {
              type: "html" as const,
              html: `<div class="hook">${escapeHtml(c.text.toLocaleUpperCase("tr-TR"))}</div>`,
              css:
                `.hook { font-family: "Montserrat"; font-size: ${portrait ? 88 : 80}px; ` +
                `font-weight: 800; color: ${hookColor}; text-align: center; ` +
                `letter-spacing: 2px; line-height: 1.08; ` +
                `text-shadow: 0 4px 28px rgba(0,0,0,0.55); }`,
              width: portrait ? 1000 : 1500,
              height: 300,
            },
            // konuşma sunucuyla birlikte başlar — kuruluş sahnesi kadar kayar
            start: avatarStartSec + c.startMs / 1000,
            length: (c.endMs - c.startMs) / 1000,
            position: "center" as const,
          }
        : {
            asset: {
              type: "html" as const,
              html: `<div class="cap">${escapeHtml(c.text)}</div>`,
              css: portrait
                ? `.cap { font-family: "Montserrat"; font-size: 52px; font-weight: 800; color: #ffffff; text-align: center; text-shadow: 0 3px 14px rgba(0,0,0,0.9); }`
                : `.cap { font-family: "Montserrat"; font-size: 42px; font-weight: 800; color: #ffffff; text-align: center; text-shadow: 0 3px 14px rgba(0,0,0,0.9); }`,
              width: portrait ? 960 : 1500,
              height: portrait ? 150 : 110,
            },
            start: c.startMs / 1000,
            length: (c.endMs - c.startMs) / 1000,
            position: "bottom" as const,
            // 9:16'da platform arayüzü (beğen/paylaş) alta biner — biraz yukarıda
            offset: { y: portrait ? 0.14 : 0.05 },
          },
    );

  // [B] Ofis kimliği — köşe filigranı + kapanış kartı
  const brandingClips: ShotstackClip[] = [];
  if (input.branding) {
    const b = input.branding;
    if (b.logoUrl) {
      // Filigran: sahneler boyunca köşede yarı saydam logo
      brandingClips.push({
        asset: { type: "image", src: b.logoUrl },
        start: 0,
        length: scenesSec,
        fit: "none",
        scale: 0.08,
        opacity: 0.55,
        position: "topRight",
        offset: { x: -0.03, y: -0.03 },
      });
      // Kapanış kartı: siyah zemin üzerinde logo
      brandingClips.push({
        asset: { type: "image", src: b.logoUrl },
        start: scenesSec,
        length: OUTRO_SEC,
        fit: "none",
        scale: 0.22,
        position: "center",
        offset: { y: 0.12 },
        transition: { in: "fade" },
      });
    }
    const contact = [b.name, b.phone].filter(Boolean).join(" · ");
    brandingClips.push({
      asset: {
        type: "html",
        html: `<div class="outro">${escapeHtml(contact)}</div>`,
        css: `.outro { font-family: "Montserrat"; font-size: ${portrait ? 44 : 48}px; font-weight: 700; color: #ffffff; text-align: center; }`,
        width: portrait ? 960 : 1400,
        height: 180,
      },
      start: scenesSec + 0.3,
      length: OUTRO_SEC - 0.3,
      position: "center",
      offset: { y: b.logoUrl ? -0.1 : 0 },
      transition: { in: "fade" },
    });
  }

  // [P] Vitrin Sunucusu — köşe penceresi (PiP) + zorunlu AI ibaresi.
  // Sunucu sesi klibin içinde gömülü (volume 1); bu yüzden avatar'lı
  // kurgularda çağıran voiceKeyframes GÖNDERMEMELİDİR (çift ses olur).
  const avatarClips: ShotstackClip[] = [];
  if (input.avatar) {
    // Kuruluş sahnesi (drone iniş) sunucusuz oynar; sunucu startSec anında
    // TAM EKRAN videoya girer, sonra köşe penceresine küçülür.
    const avatarLen = Math.min(input.avatar.durationSec, scenesSec - avatarStartSec);
    const introSec = Math.min(AVATAR_INTRO_SEC, avatarLen);
    avatarClips.push({
      asset: { type: "video", src: input.avatar.videoUrl, volume: 1 },
      start: avatarStartSec,
      length: introSec,
      fit: "cover",
      transition: { in: "fade" },
    });
    // Devam: köşe penceresi (trim ile kaldığı yerden — ses kesintisiz akar)
    if (avatarLen > introSec) {
      avatarClips.push({
        asset: {
          type: "video",
          src: input.avatar.videoUrl,
          volume: 1,
          trim: introSec,
        },
        start: avatarStartSec + introSec,
        length: avatarLen - introSec,
        scale: AVATAR_PIP.scale,
        position: AVATAR_PIP.position,
        offset: { x: AVATAR_PIP.offsetX, y: AVATAR_PIP.offsetY },
        transition: { out: "fade" },
      });
    }
    // AI şeffaflık ibaresi — sunucu göründüğü sürece üst-ortada, silik ama
    // okunur. Overlay slotu DEĞİLDİR: kullanıcı kapatamaz (etik + Meta kuralı).
    avatarClips.push({
      asset: {
        type: "html",
        html: `<div class="ai">${escapeHtml(AI_DISCLOSURE_TEXT)}</div>`,
        css: `.ai { font-family: "Montserrat"; font-size: 24px; color: rgba(255,255,255,0.9); background: rgba(0,0,0,0.45); padding: 6px 14px; border-radius: 999px; display: inline-block; }`,
        width: 560,
        height: 48,
      },
      start: 0.3,
      length: Math.max(scenesSec - 0.3, 1),
      position: "top",
      offset: { y: -0.025 },
    });
  }

  // Track sırası: Shotstack ilk track'i EN ÜSTTE render eder
  const tracks: { clips: ShotstackClip[] }[] = [];
  if (captionClips.length) tracks.push({ clips: captionClips });
  if (brandingClips.length) tracks.push({ clips: brandingClips });
  if (overlayClips.length) tracks.push({ clips: overlayClips });
  if (avatarClips.length) tracks.push({ clips: avatarClips });
  tracks.push({ clips: videoClips });
  if (voiceClips.length) tracks.push({ clips: voiceClips });
  if (musicClips.length) tracks.push({ clips: musicClips });

  const usesHtml =
    overlayClips.length > 0 ||
    captionClips.length > 0 ||
    brandingClips.length > 0 ||
    avatarClips.length > 0;

  return {
    timeline: {
      background: "#000000",
      ...(usesHtml ? { fonts: [{ src: MONTSERRAT }] } : {}),
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

// ── 4) Altyazı parçalayıcı — segment kelime zamanlamalarından kısa gruplar ──
// Kelime zamanlaması olan segmentler 3-4 kelimelik parçalara bölünür;
// olmayanlar (eski kayıtlar) cümle bütünüyle segment süresine yayılır.

const CAPTION_MAX_WORDS = 4;
const CAPTION_MAX_CHARS = 26;

export function buildCaptionChunks(
  segments: {
    text: string;
    durationMs: number;
    wordTimings: { word: string; startMs: number; endMs: number }[] | null;
  }[],
  // hook tipografisi daha az kelime ister: {maxWords: 2, maxChars: 16}
  opts?: { maxWords?: number; maxChars?: number },
): CaptionChunk[] {
  const maxWords = opts?.maxWords ?? CAPTION_MAX_WORDS;
  const maxChars = opts?.maxChars ?? CAPTION_MAX_CHARS;
  const chunks: CaptionChunk[] = [];
  let cursor = 0; // segmentin timeline offset'i (ms)

  for (const seg of segments) {
    const words = seg.wordTimings ?? [];
    if (!words.length) {
      // Fallback: cümle bütünüyle göster
      chunks.push({ text: seg.text, startMs: cursor, endMs: cursor + seg.durationMs });
      cursor += seg.durationMs;
      continue;
    }

    let group: typeof words = [];
    const flush = () => {
      if (!group.length) return;
      chunks.push({
        text: group.map((w) => w.word).join(" "),
        startMs: cursor + group[0].startMs,
        endMs: cursor + group[group.length - 1].endMs,
      });
      group = [];
    };
    for (const w of words) {
      const candidate = [...group, w].map((x) => x.word).join(" ");
      if (group.length >= maxWords || candidate.length > maxChars) {
        flush();
      }
      group.push(w);
    }
    flush();
    cursor += seg.durationMs;
  }

  // Parçalar arası mikro boşlukları kapat (titreşim önleme): her parçanın
  // sonu bir sonrakinin başına uzatılır (en fazla 400 ms).
  for (let i = 0; i < chunks.length - 1; i++) {
    const gap = chunks[i + 1].startMs - chunks[i].endMs;
    if (gap > 0) chunks[i].endMs += Math.min(gap, 400);
  }
  return chunks;
}
