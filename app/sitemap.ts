import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/url";

const PAGE_SIZE = 2000;

export async function generateSitemaps() {
  const count = await prisma.listing.count({
    where: { status: "ACTIVE", tenant: { showcaseEnabled: true } },
  });
  const listingPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  // id=0 → ofis sayfaları, id>=1 → ilan sayfaları
  return Array.from({ length: listingPages + 1 }, (_, i) => ({ id: i }));
}

export default async function sitemap(props: {
  id: number | string;
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(props.id);
  const baseUrl = getBaseUrl();

  if (id === 0) {
    const tenants = await prisma.tenant.findMany({
      where: { showcaseEnabled: true },
      select: { slug: true, updatedAt: true },
    });
    return tenants.map((t) => ({
      url: `${baseUrl}/ofis/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    }));
  }

  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE", tenant: { showcaseEnabled: true } },
    select: {
      id: true,
      slug: true,
      updatedAt: true,
      tenant: { select: { slug: true } },
    },
    orderBy: { updatedAt: "desc" },
    skip: (id - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return listings.map((l) => {
    const publicId = l.slug ? `${l.id}-${l.slug}` : l.id;
    return {
      url: `${baseUrl}/ofis/${l.tenant.slug}/ilan/${publicId}`,
      lastModified: l.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    };
  });
}

export const revalidate = 3600;
