import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  const db = forTenant(session.tenantId);
  const body = await req.json().catch(() => ({}));

  try {
    const task = await db.task.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.note !== undefined && { note: body.note || null }),
        ...(body.status !== undefined && {
          status: body.status,
          doneAt: body.status === "DONE" ? new Date() : null,
        }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.dueAt !== undefined && {
          dueAt: body.dueAt ? new Date(body.dueAt) : null,
        }),
        ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId || null }),
      },
      include: {
        assignee: { select: { id: true, name: true } },
        listing: { select: { id: true, refCode: true, title: true } },
      },
    });
    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    await forTenant(session.tenantId).task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}
