import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);

  const tasks = await db.task.findMany({
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
    include: {
      assignee: { select: { id: true, name: true } },
      listing: { select: { id: true, refCode: true, title: true } },
    },
  });

  return NextResponse.json({ tasks });
}

/** Body: { title, note?, assigneeId?, listingId?, dueAt?, priority? } */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);
  const body = await req.json().catch(() => null);

  if (!body?.title?.trim()) {
    return NextResponse.json({ error: "title zorunlu." }, { status: 400 });
  }

  const task = await db.task.create({
    data: {
      tenantId: session.tenantId,
      title: body.title.trim(),
      note: body.note || null,
      assigneeId: body.assigneeId || session.userId,
      listingId: body.listingId || null,
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      priority: body.priority ?? "NORMAL",
    },
    include: {
      assignee: { select: { id: true, name: true } },
      listing: { select: { id: true, refCode: true, title: true } },
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}
