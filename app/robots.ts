import type { MetadataRoute } from "next";

/** Vitrin (/ofis/**) taranabilir; CRM/auth rotaları ve API dışarıda tutulur. */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/ofis/",
      disallow: [
        "/api/",
        "/dashboard",
        "/portfoy",
        "/musteriler",
        "/kisiler",
        "/analitik",
        "/sohbet",
        "/ajanda",
        "/finans",
        "/ekip",
        "/ayarlar",
        "/login",
        "/register",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
