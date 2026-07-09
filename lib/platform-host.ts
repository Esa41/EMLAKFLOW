/**
 * Platform (EmlakFlow) host'ları vs müşteri custom domain ayrımı.
 * Middleware (Edge) ve Node route'larda ortak kullanılır — Prisma yok.
 */

export function normalizeHost(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.trim().toLowerCase().replace(/:\d+$/, "");
}

/** Protokolsüz host; geçersizse null. */
export function normalizeCustomDomain(
  raw: string | null | undefined,
): string | null {
  if (raw === null || raw === undefined) return null;
  let d = String(raw).trim().toLowerCase();
  if (!d) return null;
  d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
  if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(d) || !d.includes(".")) {
    return null;
  }
  return d;
}

function platformHostSet(): Set<string> {
  const hosts = new Set<string>();
  const add = (h: string | undefined | null) => {
    const n = normalizeHost(h);
    if (n) hosts.add(n);
  };

  try {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      add(new URL(process.env.NEXT_PUBLIC_APP_URL).host);
    }
  } catch {
    /* ignore */
  }
  add(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  add(process.env.VERCEL_URL);
  add("emlakflow.app");
  add("www.emlakflow.app");
  add("localhost");
  add("127.0.0.1");

  // Ek platform host'ları (virgülle)
  for (const extra of (process.env.PLATFORM_HOSTS ?? "").split(",")) {
    add(extra);
  }

  return hosts;
}

export function isPlatformHost(host: string | null | undefined): boolean {
  const h = normalizeHost(host);
  if (!h) return true;
  const set = platformHostSet();
  if (set.has(h)) return true;
  // Vercel preview: *.vercel.app platform sayılır
  if (h.endsWith(".vercel.app")) return true;
  return false;
}

/** Custom domain üzerinde CRM / auth yolları engellenir. */
export const CUSTOM_DOMAIN_BLOCKED_PREFIXES = [
  "/dashboard",
  "/portfoy",
  "/kisiler",
  "/musteriler",
  "/ajanda",
  "/takvim",
  "/sohbet",
  "/ayarlar",
  "/raporlar",
  "/gorevler",
  "/kira",
  "/sozlesmeler",
  "/ekip",
  "/admin",
  "/login",
  "/register",
  "/sifremi-unuttum",
  "/sifre-sifirla",
  "/platform",
] as const;
