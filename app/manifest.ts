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
    background_color: "#f7f8f6",
    theme_color: "#1e5b3e",
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
