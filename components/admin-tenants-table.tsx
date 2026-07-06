"use client";

import { useState } from "react";
import { Sparkles, Eye } from "lucide-react";
import { FREE_LISTING_LIMIT, isPro } from "@/lib/plans";
import { AdminPlanToggle } from "./admin-plan-toggle";
import { AdminTenantDetailModal } from "./admin-tenant-detail-modal";

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  proExpiresAt: Date | null;
  city: string | null;
  createdAt: Date;
  _count: {
    listings: number;
    users: number;
  };
  users: Array<{
    email: string;
  }>;
}

export function AdminTenantsTable({ tenants }: { tenants: TenantRow[] }) {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  function getDaysLeft(expiresAt: Date | null) {
    if (!expiresAt) return null;
    const now = new Date();
    const diff = new Date(expiresAt).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-gradient-to-r from-ink/[0.02] to-brand-50/30">
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-ink/60">
                  Ofis
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-ink/60">
                  Sahip
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-ink/60">
                  Plan
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-ink/60">
                  İlan
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-ink/60">
                  Ekip
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-ink/60">
                  Kayıt
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-ink/60">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => {
                const pro = isPro(t.plan);
                const daysLeft = getDaysLeft(t.proExpiresAt);
                const expired = daysLeft !== null && daysLeft < 0;
                return (
                  <tr
                    key={t.id}
                    className="group border-b border-ink/[0.05] transition-colors last:border-0 hover:bg-brand-50/20"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-100 to-indigo-100 font-display text-sm font-bold text-brand-700">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-ink">{t.name}</div>
                          <div className="text-xs text-ink/45">
                            /{t.slug}
                            {t.city ? ` · ${t.city}` : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="max-w-[200px] truncate text-ink/70">
                        {t.users[0]?.email ?? "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={
                            pro
                              ? "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm"
                              : "inline-flex items-center gap-1.5 rounded-full bg-ink/[0.08] px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink/55"
                          }
                        >
                          {pro && <Sparkles size={11} />}
                          {pro ? "Pro" : t.plan}
                        </span>
                        {pro && daysLeft !== null && (
                          <span
                            className={`text-[10px] font-bold ${
                              expired
                                ? "text-rose-600"
                                : daysLeft <= 7
                                ? "text-amber-600"
                                : daysLeft <= 30
                                ? "text-blue-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {expired
                              ? "Süresi doldu"
                              : `${daysLeft} gün kaldı`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-ink">
                        {t._count.listings}
                        {!pro && (
                          <span className="text-ink/35">/{FREE_LISTING_LIMIT}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-ink/70">
                      {t._count.users}
                    </td>
                    <td className="px-5 py-4 text-ink/55">
                      {t.createdAt.toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedTenantId(t.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3 py-2 text-xs font-bold text-ink/70 shadow-sm transition-all hover:border-ink/30 hover:bg-ink/[0.02] hover:shadow"
                        >
                          <Eye size={13} />
                          Detay
                        </button>
                        <AdminPlanToggle tenantId={t.id} plan={t.plan} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTenantId && (
        <AdminTenantDetailModal
          tenantId={selectedTenantId}
          onClose={() => setSelectedTenantId(null)}
        />
      )}
    </>
  );
}
