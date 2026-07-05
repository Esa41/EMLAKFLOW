import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { Agenda, type AgendaItem } from "@/components/agenda";

export default async function AgendaPage() {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);
  const d = (n: number) => new Date(Date.now() + n * 86400000);

  const [appointments, contacts, listings, agents] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[27px] font-extrabold tracking-tight">Ajanda & Görevler</h1>
        <p className="mt-1 text-sm text-ink/55">
          Son 7 gün ve önümüzdeki 3 hafta — yer göstermeler, imzalar, ziyaretler.
        </p>
      </div>
      <Agenda
        initialItems={items}
        currentUserId={session.userId}
        contacts={contacts.map((c) => ({ id: c.id, label: c.fullName }))}
        listings={listings.map((l) => ({ id: l.id, label: `${l.refCode} — ${l.title}` }))}
        agents={agents.map((a) => ({ id: a.id, label: a.name }))}
      />
    </div>
  );
}
