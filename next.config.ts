import path from "node:path";
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import { securityHeaders } from "./lib/security-headers";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // İlk boyama ile yarışmasın — client idle sonrası register (PwaRegister)
  register: false,
  skipWaiting: false,
  clientsClaim: false,
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    // Auth / API / CRM dinamik yanıtlarını SW cache'leme — stale session riski
    exclude: [
      /^\/api\//,
      /^\/admin/,
      /\/_next\/data\//,
      /middleware-manifest\.json$/,
    ],
  },
});

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["bcryptjs"],
  poweredByHeader: false,
  async headers() {
    // NOT: /_next/static için Cache-Control ELLE VERME — Vercel production'da
    // zaten immutable servis eder; dev'de chunk'lar hash'siz olduğundan
    // immutable cache tarayıcıda bayat chunk hatasına yol açar.
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      { source: "/galeri/:slug", destination: "/ofis/:slug" },
      { source: "/galeri/:slug/ilan/:id", destination: "/ofis/:slug/ilan/:id" },
      { source: "/galeri/:slug/favorilerim", destination: "/ofis/:slug/favorilerim" },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // AVIF önce (≈%20 daha küçük), desteklemeyen tarayıcıya WebP
    formats: ["image/avif", "image/webp"],
    // R2 varyantları immutable — optimize edilmiş kopyaları uzun süre önbellekle
    minimumCacheTTL: 2678400, // 31 gün
    remotePatterns: [
      { protocol: "https", hostname: "media.emlakflow.app" },
      // R2 public bucket (R2_PUBLIC_URL) — custom domain bağlanana kadar
      // gerçek yüklemeler pub-*.r2.dev üzerinden servis edilir
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
};

export default withPWA(nextConfig);
