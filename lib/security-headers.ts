const isProd = process.env.NODE_ENV === "production";

/** CSP — middleware nonce ile dinamik üretilir; statik başlıklar next.config'te. */
export function buildCspHeader(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://api.mapbox.com`,
    "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
    "img-src 'self' data: blob: https://media.emlakflow.app https://*.mapbox.com https://images.unsplash.com https://i.pravatar.cc",
    "font-src 'self' data:",
    "connect-src 'self' https://*.mapbox.com https://api.mapbox.com wss://*.mapbox.com",
    "frame-src 'self' https://www.youtube.com https://my.matterport.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export const staticSecurityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=()",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];
