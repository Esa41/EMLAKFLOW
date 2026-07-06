import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

const PAGE_SIZE = 20;

/** Sayfalanmış bildirimler + okunmamış sayısı */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const category = url.searchParams.get("category") || undefined;
  const unreadOnly = url.searchParams.get("unreadOnly") === "true";

  const where: Record<string, unknown> = { userId: session.userId };
  if (category && category !== "all") where.category = category;
  if (unreadOnly) where.readAt = null;

  const [notifications, total, unread] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.notification.count({ where }),
    db.notification.count({
      where: { userId: session.userId, readAt: null },
    }),
  ]);

  return NextResponse.json({
    notifications,
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
    page,
    unread,
  });
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
