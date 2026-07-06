import { Building2, Users, FileText, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { FREE_LISTING_LIMIT, isPro } from "@/lib/plans";
import { AdminTenantsTable } from "@/components/admin-tenants-table";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      proExpiresAt: true,
      city: true,
      createdAt: true,
      _count: { select: { listings: true, users: true } },
      users: {
        where: { role: "OWNER" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { email: true },
      },
    },
  });

  const proCount = tenants.filter((t) => isPro(t.plan)).length;
  const totalListings = tenants.reduce((sum, t) => sum + t._count.listings, 0);
  const totalUsers = tenants.reduce((sum, t) => sum + t._count.users, 0);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="space-y-2">
        <h1 className="font-display text-[32px] font-extrabold tracking-tight text-ink">
          Ofis Yönetimi
        </h1>
        <p className="text-sm text-ink/60">
          Ücretsiz planda ofisler en fazla {FREE_LISTING_LIMIT} ilan ekleyebilir. 
          Pro yapılan ofislerde limit kalkar.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-brand-100/50 blur-2xl transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <Building2 size={20} />
            </div>
            <p className="text-2xl font-extrabold text-ink">{tenants.length}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-ink/50">
              Toplam Ofis
            </p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-emerald-100/50 blur-2xl transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Sparkles size={20} />
            </div>
            <p className="text-2xl font-extrabold text-ink">{proCount}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-ink/50">
              Pro Ofis
            </p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-indigo-100/50 blur-2xl transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <FileText size={20} />
            </div>
            <p className="text-2xl font-extrabold text-ink">{totalListings}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-ink/50">
              Toplam İlan
            </p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-violet-100/50 blur-2xl transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Users size={20} />
            </div>
            <p className="text-2xl font-extrabold text-ink">{totalUsers}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-ink/50">
              Toplam Kullanıcı
            </p>
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <AdminTenantsTable tenants={tenants} />
    </div>
  );
}
