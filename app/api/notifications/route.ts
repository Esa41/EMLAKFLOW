import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

/** Son 20 bildirim + okunmamış sayısı (yalnız oturum sahibinin) */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);

  const [notifications, unread] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.notification.count({
      where: { userId: session.userId, readAt: null },
    }),
  ]);

  return NextResponse.json({ notifications, unread });
}

/** Tümünü okundu işaretle */
export async function PATCH() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  await forTenant(session.tenantId).notification.updateMany({
    where: { userId: session.userId, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
