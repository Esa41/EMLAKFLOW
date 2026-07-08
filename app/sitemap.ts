import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { BLOG_POSTS } from "@/lib/blog";
import { getBaseUrl } from "@/lib/url";

/**
 * Dinamik sitemap — yalnızca public/indekslenebilir sayfalar:
 * vitrin açık ofislerin ana sayfası + o ofislerin yayındaki (ACTIVE) ilanları.
 * CRM (app) rotaları auth arkasında olduğundan burada yer almaz (bkz. robots.ts).
 *
 * İlan URL'leri detay sayfasındaki canonical ile birebir aynı formatta
 * üretilir: "/ilan/{id}-{seo-slug}" (slug yoksa yalnız id). Format değişirse
 * app/ofis/[slug]/ilan/[id]/page.tsx generateMetadata ile senkron tut.
 *
 * ~50k URL'ye kadar tek dosya yeterli (sitemap protokol limiti);
 * üzerine çıkınca generateSitemaps ile parçalama planı docs/seo-buyume-plani.md'de.
 */

// Botlar sık çeker — sonucu 1 saat önbellekle, her istekte DB'ye gitme
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const tenants = await prisma.tenant.findMany({
    where: { showcaseEnabled: true },
    select: {
      slug: true,
      updatedAt: true,
      listings: {
        where: { status: "ACTIVE" },
        select: { id: true, slug: true, updatedAt: true },
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
      url: `${baseUrl}/ofis/${t.slug}/ilan/${l.slug ? `${l.id}-${l.slug}` : l.id}`,
      lastModified: l.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    }))
  );

  const blogEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(
        BLOG_POSTS.reduce((m, p) => (p.updatedAt > m ? p.updatedAt : m), ""),
      ),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...BLOG_POSTS.map((p) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [...officeEntries, ...listingEntries, ...blogEntries];
}
