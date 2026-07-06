import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { KanbanBoard, type DealCard } from "@/components/kanban-board";
import { getVertical } from "@/lib/verticals";

export default async function CustomersPage() {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { vertical: true },
  });
  const vertical = tenant?.vertical ?? "REAL_ESTATE";
  const v = getVertical(vertical);

  const [deals, contacts, listings, agents] = await Promise.all([
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
    db.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const cards: DealCard[] = deals.map((d) => ({
    id: d.id,
    stage: d.stage,
    value: d.value != null ? Number(d.value) : null,
    lostReason: d.lostReason,
    stageChangedAt: d.stageChangedAt?.toISOString() ?? null,
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
        <h1 className="font-display text-[27px] font-extrabold tracking-tight">
          {v.labels.pipeline}
        </h1>
        <p className="mt-1 text-sm text-ink/55">
          {cards.length} fırsat · Açık pipeline:{" "}
          {new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
            maximumFractionDigits: 0,
          }).format(pipelineValue)}
          {" — "}kartlara tıklayarak detay açın veya sürükleyerek taşıyın.
        </p>
      </div>
      <KanbanBoard
        initialDeals={cards}
        contacts={contacts}
        listings={listings}
        agents={agents}
        vertical={vertical}
        currentUserId={session.userId}
      />
    </div>
  );
}
