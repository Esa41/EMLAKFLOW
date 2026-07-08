import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

/** İlan CRUD sonrası vitrin + sitemap önbelleğini anında tazeler. */
export async function revalidateShowcaseForTenant(
  tenantId: string,
  listing?: { id: string; slug?: string | null },
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true, showcaseEnabled: true },
  });
  if (!tenant?.showcaseEnabled) return;

  revalidatePath(`/ofis/${tenant.slug}`);
  revalidateTag(`listings:${tenant.slug}`);
  revalidateTag(`showcase:${tenant.slug}`);
  revalidateTag("sitemap");

  if (listing) {
    const publicId = listing.slug ? `${listing.id}-${listing.slug}` : listing.id;
    revalidatePath(`/ofis/${tenant.slug}/ilan/${publicId}`);
  }
}
