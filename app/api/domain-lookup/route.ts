import { NextResponse } from "next/server";
import { findTenantByHost } from "@/lib/showcase-domain";
import { isPlatformHost, normalizeHost } from "@/lib/platform-host";

/**
 * Edge middleware'in custom domain → slug çözümlemesi için.
 * GET /api/domain-lookup?host=www.emlakofisi.com
 * Cache: 60s (domain değişince kısa gecikme kabul).
 */
export async function GET(req: Request) {
  const host = normalizeHost(new URL(req.url).searchParams.get("host"));
  if (!host || isPlatformHost(host)) {
    return NextResponse.json({ slug: null }, { status: 200 });
  }

  const tenant = await findTenantByHost(host);
  if (!tenant) {
    return NextResponse.json({ slug: null }, { status: 404 });
  }

  return NextResponse.json(
    {
      slug: tenant.slug,
      brandName: tenant.brandName,
      name: tenant.name,
      customDomain: tenant.customDomain,
      vertical: tenant.vertical,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
