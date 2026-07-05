import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { KanbanBoard, type DealCard } from "@/components/kanban-board";

export default async function CustomersPage() {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);

  const [deals, contacts, listings] = await Promise.all([
    db.deal.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        contact: { select: { id: true, fullName: true, phone: true } },
        listing: { select: { id: true, refCode: true, title: true } },
        agent: { select: { id: true, name: true } },
      },
    }),
    db.contact.findMany({
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
    db.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: { id: true, refCode: true, title: true },
    }),
  ]);

  // Decimal → number serileştirme (client bileşene düz veri)
  const cards: DealCard[] = deals.map((d) => ({
    id: d.id,
    stage: d.stage,
    value: d.value != null ? Number(d.value) : null,
    lostReason: d.lostReason,
    contact: d.contact,
    listing: d.listing,
    agent: d.agent,
  }));

  const pipelineValue = cards
    .filter((c) => !["CLOSED_WON", "CLOSED_LOST"].includes(c.stage))
    .reduce((s, c) => s + (c.value ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[27px] font-extrabold tracking-tight">Satış Hattı</h1>
        <p className="mt-1 text-sm text-ink/55">
          {cards.length} fırsat · Açık pipeline:{" "}
          {new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
            maximumFractionDigits: 0,
          }).format(pipelineValue)}
          {" — "}kartları sürükleyerek aşama değiştir.
        </p>
      </div>
      <KanbanBoard initialDeals={cards} contacts={contacts} listings={listings} />
    </div>
  );
}
