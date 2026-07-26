import type { MetadataRoute } from "next";

/**
 * Web App Manifest — Ana Ekrana Ekle / PWA kurulumu.
 * Next.js App Router otomatik /manifest.webmanifest üretir.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EmlakFlow",
    short_name: "EmlakFlow",
    description:
      "Harita vitrini, akıllı eşleştirme ve satış hattı — modern emlak ofisinin tek paneli.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f5f5f7",
    theme_color: "#1d1d1f",
    lang: "tr",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
