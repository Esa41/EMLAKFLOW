/**
 * Kurumsal HTTP güvenlik başlıkları — next.config.ts headers() içinde kullanılır.
 *
 * CSP allowlist'i koddan çıkarılmıştır; yeni bir harici host eklerken buraya da ekle:
 *  - Mapbox GL: api.mapbox.com (style/tile/glyph), events.mapbox.com (telemetri),
 *    worker-src blob: (harita worker'ları) — resmi CSP gereksinimleri
 *  - R2 medya: media.emlakflow.app (public CDN) + *.r2.cloudflarestorage.com
 *    (tarayıcıdan presigned PUT upload — bkz. lib/r2.ts)
 *  - Demo görselleri: images.unsplash.com, i.pravatar.cc (next.config images ile aynı)
 *  - Vercel: vitals.vercel-insights.com (Speed Insights), vercel.live (preview yorumları)
 */

const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  // Next.js inline runtime script'leri nonce altyapısı olmadan 'unsafe-inline' ister;
  // dev'de React Refresh için 'unsafe-eval' gerekir (production'da eklenmez).
  // va.vercel-scripts.com: Speed Insights script'i buradan yüklenir
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://vercel.live https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://media.emlakflow.app https://*.r2.dev https://images.unsplash.com https://i.pravatar.cc https://api.mapbox.com https://*.tiles.mapbox.com",
  // İlan videoları R2'den oynatılır
  "media-src 'self' blob: https://media.emlakflow.app https://*.r2.dev",
  "font-src 'self' data:",
  "connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com https://media.emlakflow.app https://*.r2.cloudflarestorage.com https://vitals.vercel-insights.com" +
    (isDev ? " ws:" : ""),
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "frame-ancestors 'none'",
  "frame-src https://vercel.live",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

export const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // 2 yıl + preload — HSTS preload listesine başvuru için gerekli format
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Harita için geolocation'a kendi origin'imiz izinli; gerisi kapalı
    value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];
