import { prisma } from "./prisma";
import { showcaseUrl } from "./url";
import type { MailBrand } from "./marketing-mailer";

/**
 * Ofis adına e-posta gönderimi için marka bilgisi: görünen ad ofis adı,
 * yanıt adresi ofis sahibinin e-postası, CTA linki vitrin URL'si.
 */
export async function officeBrand(tenantId: string): Promise<{
  brand: MailBrand;
  slug: string;
  showcase: string;
} | null> {
  const t = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      brandName: true,
      slug: true,
      vertical: true,
      customDomain: true,
      plan: true,
      users: {
        where: { role: "OWNER" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { email: true },
      },
    },
  });
  if (!t) return null;
  return {
    brand: {
      name: t.brandName?.trim() || t.name,
      replyTo: t.users[0]?.email,
      hidePlatform: t.plan === "premium",
    },
    slug: t.slug,
    showcase: showcaseUrl(t.slug, t.vertical, t.customDomain),
  };
}
