import type { TenantClient } from "./tenant";
import { getVertical } from "./verticals";

/** Dikeye göre sıradaki referans kodu: EF-2026-0001 / GF-2026-0001 */
export async function nextRefCode(
  db: TenantClient,
  vertical: string | null | undefined,
): Promise<string> {
  const prefix = getVertical(vertical).refPrefix;
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-`;
  const count = await db.listing.count({
    where: { refCode: { startsWith: pattern } },
  });
  return `${pattern}${String(count + 1).padStart(4, "0")}`;
}
