/**
 * İlan yayın portalları — tek kaynak (settings, ilan formu ve XML feed bunu kullanır).
 * İstemci-güvenli: server-only import yok.
 */

export type PortalKey =
  | "sahibinden"
  | "hepsiemlak"
  | "emlakjet"
  | "arabam"
  | "sahibinden-auto";

export type PortalTenantFlag =
  | "portalSahibinden"
  | "portalHepsiemlak"
  | "portalEmlakjet"
  | "portalArabam"
  | "portalSahibindenAuto";

export interface PortalDef {
  key: PortalKey;
  label: string;
  vertical: "estate" | "auto";
  /** Tenant modelindeki aç/kapa bayrağı (Ayarlar > Portal Yayını). */
  tenantFlag: PortalTenantFlag;
}

export const PORTALS: PortalDef[] = [
  { key: "sahibinden", label: "Sahibinden.com", vertical: "estate", tenantFlag: "portalSahibinden" },
  { key: "hepsiemlak", label: "Hepsiemlak", vertical: "estate", tenantFlag: "portalHepsiemlak" },
  { key: "emlakjet", label: "Emlakjet", vertical: "estate", tenantFlag: "portalEmlakjet" },
  { key: "arabam", label: "Arabam.com", vertical: "auto", tenantFlag: "portalArabam" },
  { key: "sahibinden-auto", label: "Sahibinden Otomobil", vertical: "auto", tenantFlag: "portalSahibindenAuto" },
];

const PORTAL_KEYS = new Set<string>(PORTALS.map((p) => p.key));

/** Geçerli portal anahtarı mı? */
export function isPortalKey(v: unknown): v is PortalKey {
  return typeof v === "string" && PORTAL_KEYS.has(v);
}

/** Serbest diziyi geçerli, tekilleştirilmiş PortalKey listesine indirger. */
export function normalizePortals(input: unknown): PortalKey[] {
  if (!Array.isArray(input)) return [];
  const out: PortalKey[] = [];
  for (const v of input) {
    if (isPortalKey(v) && !out.includes(v)) out.push(v);
  }
  return out;
}

/** Tenant portal bayraklarına göre açık portallar (dikeye göre süzülür). */
export function enabledPortals(
  flags: Partial<Record<PortalTenantFlag, boolean | null>>,
  vertical: string | null | undefined,
): PortalDef[] {
  const target = vertical === "AUTO_DEALER" ? "auto" : "estate";
  return PORTALS.filter((p) => p.vertical === target && !!flags[p.tenantFlag]);
}
