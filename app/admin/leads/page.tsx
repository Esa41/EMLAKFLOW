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
  };

  return (
    <div className="space-y-6">
      <AdminLeadsTable leads={leads} counts={counts} />
    </div>
  );
}
