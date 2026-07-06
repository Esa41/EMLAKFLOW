import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { canViewTeamActivity } from "@/lib/permissions";

/**
 * Bugünkü faaliyet özeti — rol bazlı.
 * OWNER/BROKER: tüm ekip sayaçları + danışman kırılımı + pasif danışmanlar.
 * AGENT/ASSISTANT: yalnızca kendi bugünkü sayaçları.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);
  const isTeam = canViewTeamActivity(session.role);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const where: Record<string, unknown> = { createdAt: { gte: startOfDay } };
  if (!isTeam) where.userId = session.userId;

  const byType = await db.activity.groupBy({
    by: ["type"],
    where,
    _count: { _all: true },
  });

  const today: Record<string, number> = {};
  let total = 0;
  for (const row of byType) {
    const n = row._count._all;
    today[row.type] = n;
    total += n;
  }

  if (!isTeam) {
    return NextResponse.json({ scope: "own", today, total });
  }

  // ── Yönetici: danışman kırılımı + pasif danışmanlar ──
  const [byUser, users] = await Promise.all([
    db.activity.groupBy({
      by: ["userId"],
      where,
      _count: { _all: true },
    }),
    db.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const countByUser = new Map<string, number>();
  for (const row of byUser) {
    if (row.userId) countByUser.set(row.userId, row._count._all);
  }

  const team = users.map((u) => ({
    userId: u.id,
    name: u.name,
    today: countByUser.get(u.id) ?? 0,
  }));
  const passive = team
    .filter((u) => u.today === 0)
    .map((u) => ({ userId: u.userId, name: u.name }));

  return NextResponse.json({ scope: "team", today, total, team, passive });
}
