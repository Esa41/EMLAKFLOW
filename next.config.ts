import path from "node:path";
import type { NextConfig } from "next";
import { securityHeaders } from "./lib/security-headers";

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
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
};

export default nextConfig;
