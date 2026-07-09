import { prisma } from "@/lib/prisma";
import { AdminLeadsTable } from "@/components/admin-leads-table";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const leads = await prisma.marketingLead.findMany({
    orderBy: { createdAt: "desc" },
  });

  const counts = {
    total: leads.length,
    pending: leads.filter((l) => l.status === "PENDING").length,
    sent: leads.filter((l) => l.status === "SENT").length,
    opened: leads.filter((l) => l.status === "OPENED").length,
    clicked: leads.filter((l) => l.status === "CLICKED").length,
    demo: leads.filter((l) => l.status === "DEMO_BOOKED").length,
  };

  const withDates = leads.map((l) => ({
    id: l.id,
    firmaAdi: l.firmaAdi,
    yetkiliIsmi: l.yetkiliIsmi,
    email: l.email,
    telefon: l.telefon,
    bolge: l.bolge,
    notes: l.notes,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
    sentAt: l.sentAt?.toISOString() ?? null,
    openedAt: l.openedAt?.toISOString() ?? null,
    clickedAt: l.clickedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <AdminLeadsTable leads={withDates} counts={counts} />
    </div>
  );
}
