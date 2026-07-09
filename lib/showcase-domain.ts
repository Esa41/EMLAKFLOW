import { prisma } from "@/lib/prisma";
import { normalizeHost } from "@/lib/platform-host";

export type ShowcaseDomainHit = {
  id: string;
  slug: string;
  name: string;
  brandName: string | null;
  customDomain: string;
  showcaseEnabled: boolean;
  vertical: string;
};

/**
 * Host → Tenant (customDomain). www / apex varyantlarını dener.
 */
export async function findTenantByHost(
  hostRaw: string,
): Promise<ShowcaseDomainHit | null> {
  const host = normalizeHost(hostRaw);
  if (!host) return null;

  const candidates = new Set<string>([host]);
  if (host.startsWith("www.")) candidates.add(host.slice(4));
  else candidates.add(`www.${host}`);

  const tenant = await prisma.tenant.findFirst({
    where: {
      customDomain: { in: [...candidates] },
      showcaseEnabled: true,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      brandName: true,
      customDomain: true,
      showcaseEnabled: true,
      vertical: true,
    },
  });

  if (!tenant?.customDomain) return null;

  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    brandName: tenant.brandName,
    customDomain: tenant.customDomain,
    showcaseEnabled: tenant.showcaseEnabled,
    vertical: tenant.vertical,
  };
}
