import { getVertical } from "./verticals";

/**
 * Kamuya açık site adresi (vitrin, sitemap, canonical, feed).
 * Tek kaynak: NEXT_PUBLIC_APP_URL → Vercel → localhost.
 * AUTH_URL yalnızca NextAuth içindir; vitrin URL'sinde kullanılmaz.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/** Dikeye göre vitrin yolu — emlak: /ofis/slug, galeri: /galeri/slug */
export function showcasePath(slug: string, vertical?: string | null): string {
  const base = getVertical(vertical).showcaseBase;
  return `${base}/${slug}`;
}

/**
 * Tam vitrin URL'si.
 * customDomain varsa https://domain (kök); yoksa platform /ofis/slug.
 */
export function showcaseUrl(
  slug: string,
  vertical?: string | null,
  customDomain?: string | null,
): string {
  if (customDomain) {
    const host = customDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }
  return `${getBaseUrl()}${showcasePath(slug, vertical)}`;
}

/** Custom domain üzerinde göreli vitrin yolu (kök = "/"). */
export function showcaseRelativePath(
  slug: string,
  path: "" | `/ilan/${string}` | "/favorilerim" = "",
  opts?: { customDomainActive?: boolean; vertical?: string | null },
): string {
  if (opts?.customDomainActive) {
    return path || "/";
  }
  return `${showcasePath(slug, opts?.vertical)}${path}`;
}
