import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/url";

/** Vitrin (/ofis/**) taranabilir; CRM/auth rotaları ve API dışarıda tutulur. */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
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
          "/admin",
          "/*?*",
        ],
      },
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
