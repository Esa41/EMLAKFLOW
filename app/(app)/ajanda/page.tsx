import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { Agenda, type AgendaItem } from "@/components/agenda";
import { TaskList } from "@/components/task-list";

export default async function AgendaPage() {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);
  const d = (n: number) => new Date(Date.now() + n * 86400000);

  const [appointments, contacts, listings, agents, tasks] = await Promise.all([
    db.appointment.findMany({
      where: { startsAt: { gte: d(-7), lte: d(21) } },
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

  const taskRows = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    note: t.note,
    status: t.status,
    priority: t.priority,
    dueAt: t.dueAt?.toISOString() ?? null,
    assignee: t.assignee,
    listing: t.listing,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-[27px] font-extrabold tracking-tight">Ajanda & Görevler</h1>
        <p className="mt-1 text-sm text-ink/55">
          Son 7 gün ve önümüzdeki 3 hafta — yer göstermeler, imzalar, ziyaretler.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink/45">Görevler</h2>
        <TaskList
          initialTasks={taskRows}
          agents={agents.map((a) => ({ id: a.id, name: a.name }))}
          currentUserId={session.userId}
        />
      </section>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-ink/45">Randevular</h2>
        <Agenda
        initialItems={items}
        currentUserId={session.userId}
        contacts={contacts.map((c) => ({ id: c.id, label: c.fullName }))}
        listings={listings.map((l) => ({ id: l.id, label: `${l.refCode} — ${l.title}` }))}
        agents={agents.map((a) => ({ id: a.id, label: a.name }))}
      />
      </section>
    </div>
  );
}
