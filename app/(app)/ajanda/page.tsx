import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { canViewTeamActivity } from "@/lib/permissions";
import { AgendaHub } from "@/components/agenda-hub";
import type { AgendaItem } from "@/components/agenda";
import type { TaskRow } from "@/components/task-list";

export default async function AgendaPage() {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);
  const d = (n: number) => new Date(Date.now() + n * 86400000);
  const isManager = canViewTeamActivity(session.role);

  const agentWhere = isManager ? undefined : session.userId;

  const [appointments, contacts, listings, agents, tasks] = await Promise.all([
    db.appointment.findMany({
      where: {
        startsAt: { gte: d(-14), lte: d(42) },
        ...(agentWhere ? { agentId: agentWhere } : {}),
      },
      orderBy: { startsAt: "asc" },
      include: {
        contact: { select: { id: true, fullName: true, phone: true } },
        listing: { select: { id: true, refCode: true, title: true } },
        agent: { select: { id: true, name: true } },
      },
    }),
    db.contact.findMany({ orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
    db.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: { id: true, refCode: true, title: true },
    }),
    db.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.task.findMany({
      where: agentWhere ? { assigneeId: agentWhere } : undefined,
      orderBy: [{ status: "asc" }, { dueAt: "asc" }],
      include: {
        assignee: { select: { id: true, name: true } },
        listing: { select: { id: true, refCode: true, title: true } },
      },
    }),
  ]);

  const items: AgendaItem[] = appointments.map((a) => ({
    id: a.id,
    title: a.title,
    status: a.status,
    startsAt: a.startsAt.toISOString(),
    note: a.note,
    contact: a.contact,
    listing: a.listing,
    agent: a.agent,
  }));

  const taskRows: TaskRow[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    note: t.note,
    status: t.status,
    priority: t.priority,
    dueAt: t.dueAt?.toISOString() ?? null,
    assignee: t.assignee,
    listing: t.listing,
  }));

  const todayCount = items.filter((a) => {
    const d = new Date(a.startsAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  return (
    <div className="app-page dash-in space-y-6">
      <div>
        <p className="app-page-meta">
          {items.length} randevu · {taskRows.filter((t) => t.status === "OPEN").length} açık görev
          {todayCount > 0 && ` · ${todayCount} bugün`}
        </p>
        <h1 className="app-page-title">Ajanda</h1>
        <p className="app-page-desc">
          Randevu ve görevler tek takvimde — haftalık görünüm veya günlük liste.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="dash-surface p-12 text-center text-[13px] text-ink/45">
            Ajanda yükleniyor…
          </div>
        }
      >
        <AgendaHub
          initialAppointments={items}
          initialTasks={taskRows}
          contacts={contacts.map((c) => ({ id: c.id, label: c.fullName }))}
          listings={listings.map((l) => ({ id: l.id, label: `${l.refCode} — ${l.title}` }))}
          agents={agents.map((a) => ({ id: a.id, label: a.name }))}
          currentUserId={session.userId}
          canFilterTeam={isManager}
          defaultAgentId={isManager ? "all" : session.userId}
        />
      </Suspense>
    </div>
  );
}
