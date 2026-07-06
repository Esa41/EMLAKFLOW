import type { Role } from "@prisma/client";

/**
 * Rol bazlı yetki yardımcıları — Bildirim & Faaliyet Merkezi ve diğer
 * ekip görünürlüğü kararları buradan okunur. Tek kaynak.
 */

/** Tüm ekibin faaliyetini görebilir mi? (yönetici görünümü) */
export function canViewTeamActivity(role: Role): boolean {
  return role === "OWNER" || role === "BROKER";
}

/** Kendi faaliyetini görebilir mi? (oturum açan herkes) */
export function canViewOwnActivity(_role: Role): boolean {
  return true;
}
