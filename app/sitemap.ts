import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

/**
 * Dinamik sitemap — yalnızca public/indekslenebilir sayfalar:
 * vitrin açık ofislerin ana sayfası + o ofislerin yayındaki (ACTIVE) ilanları.
 * CRM (app) rotaları auth arkasında olduğundan burada yer almaz (bkz. robots.ts).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

  const tenants = await prisma.tenant.findMany({
    where: { showcaseEnabled: true },
    select: {
      slug: true,
      updatedAt: true,
      listings: {
        where: { status: "ACTIVE" },
        select: { id: true, updatedAt: true },
      },
    },
  });

  const officeEntries: MetadataRoute.Sitemap = tenants.map((t) => ({
    url: `${baseUrl}/ofis/${t.slug}`,
    lastModified: t.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const listingEntries: MetadataRoute.Sitemap = tenants.flatMap((t) =>
    t.listings.map((l) => ({
      url: `${baseUrl}/ofis/${t.slug}/ilan/${l.id}`,
      lastModified: l.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    }))
  );

  return [...officeEntries, ...listingEntries];
}
