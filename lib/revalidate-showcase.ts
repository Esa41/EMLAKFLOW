import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";

/**
 * İlan mutasyonundan sonra vitrindeki ISR kopyasını anında tazeler —
 * fiyat/foto değişikliği 5 dk'lık revalidate penceresini beklemez.
 * Detay sayfası iki URL biçiminden de erişilebilir olduğundan ikisi de
 * temizlenir: "/ilan/{id}" ve canonical "/ilan/{id}-{slug}".
 */
export async function revalidateListingShowcase(
  tenantId: string,
  listing: { id: string; slug: string | null },
): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true, showcaseEnabled: true },
  });
  if (!tenant?.showcaseEnabled) return;

  const base = `/ofis/${tenant.slug}/ilan/${listing.id}`;
  revalidatePath(base);
  if (listing.slug) revalidatePath(`${base}-${listing.slug}`);
  revalidatePath(`/ofis/${tenant.slug}`);
}

/** Vitrin ana sayfasını tazele (öne çıkan / istatistik değişiklikleri). */
export async function revalidateShowcaseHome(tenantId: string): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true, showcaseEnabled: true },
  });
  if (!tenant?.showcaseEnabled) return;
  revalidatePath(`/ofis/${tenant.slug}`);
}
