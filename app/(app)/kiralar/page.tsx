import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { RentalManager } from "@/components/rental-manager";
import { getVertical } from "@/lib/verticals";

export default async function RentalsPage() {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { vertical: true },
  });
  const v = getVertical(tenant?.vertical);

  const [agreements, contacts, listings] = await Promise.all([
    db.rentalAgreement.findMany({
      orderBy: { startDate: "desc" },
      include: {
        contact: { select: { id: true, fullName: true, phone: true } },
        listing: { select: { id: true, refCode: true, title: true } },
        payments: { orderBy: { dueDate: "asc" } },
      },
    }),
    db.contact.findMany({
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
    db.listing.findMany({
      where: { status: { in: ["ACTIVE", "RENTED"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, refCode: true, title: true },
    }),
  ]);

  const rows = agreements.map((a) => ({
    id: a.id,
    title: a.title,
    status: a.status,
    period: a.period,
    startDate: a.startDate.toISOString(),
    endDate: a.endDate.toISOString(),
    rentAmount: Number(a.rentAmount),
    paymentDueDay: a.paymentDueDay,
    contact: a.contact,
    listing: a.listing,
    payments: a.payments.map((p) => ({
      id: p.id,
      periodLabel: p.periodLabel,
      dueDate: p.dueDate.toISOString(),
      amount: Number(p.amount),
      paidAt: p.paidAt?.toISOString() ?? null,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[27px] font-extrabold tracking-tight">
          {v.labels.rentals}
        </h1>
        <p className="mt-1 text-sm text-ink/55">
          Kiraladığınız mülk veya araçların sözleşme ve ödeme takibi.
        </p>
      </div>
      <RentalManager
        initial={rows}
        contacts={contacts}
        listings={listings}
        labels={{ rentals: v.labels.rentals, listing: v.labels.listing }}
      />
    </div>
  );
}
