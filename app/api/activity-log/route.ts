import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

const PAGE_SIZE = 50;

/** Faaliyet loglarını sayfalanmış, filtrelenebilir şekilde döndür */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const type = url.searchParams.get("type") || undefined;
  const entity = url.searchParams.get("entity") || undefined;
  const userId = url.searchParams.get("userId") || undefined;
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (entity) where.entity = entity;
  if (userId) where.userId = userId;
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
    };
  }

  const [activities, total] = await Promise.all([
    db.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true } } },
    }),
    db.activity.count({ where }),
  ]);

  return NextResponse.json({
    activities,
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
    page,
  });
}
