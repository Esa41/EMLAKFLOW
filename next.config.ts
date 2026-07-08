import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["bcryptjs"],
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
