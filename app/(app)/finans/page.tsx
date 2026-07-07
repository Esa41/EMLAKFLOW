import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { trMoney } from "@/lib/labels";
import { MarkPaidButton } from "@/components/mark-paid-button";
import { Wallet, Hourglass, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function FinancePage() {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);
  const canManage = ["OWNER", "BROKER"].includes(session.role);

  const commissions = await db.commission.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      agent: { select: { name: true } },
      deal: {
        select: {
          value: true,
          contact: { select: { fullName: true, id: true } },
          listing: { select: { refCode: true, title: true, purpose: true } },
        },
      },
    },
  });

  const sum = (rows: typeof commissions) =>
    rows.reduce((s, c) => s + Number(c.gross), 0);
  const pending = commissions.filter((c) => !c.paidAt);
  const paid = commissions.filter((c) => c.paidAt);

  const stats = [
    { label: "Toplam komisyon", value: trMoney.format(sum(commissions)), icon: Wallet },
    { label: "Bekleyen", value: trMoney.format(sum(pending)), icon: Hourglass },
    { label: "Ödenen", value: trMoney.format(sum(paid)), icon: CheckCircle2 },
  ];

  return (
    <div className="app-page dash-in space-y-6">
      <div>
        <p className="app-page-meta">{commissions.length} hak ediş kaydı</p>
        <h1 className="app-page-title">Kasa</h1>
        <p className="app-page-desc">
          Komisyon ve ödeme takibi. Sözleşmeleri müşteri kartından yükleyin ve
          düzenleyin —{" "}
          <Link href="/kisiler" className="font-semibold text-brand-600 hover:underline">
            Müşteriler
          </Link>
          .
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="dash-kpi">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/[0.04] text-ink/50">
              <Icon size={17} strokeWidth={1.75} />
            </span>
            <p className="mt-3 text-[12px] font-medium text-ink/45">{label}</p>
            <p className="font-display text-[22px] font-bold tracking-tight tabular-nums text-copper">
              {value}
            </p>
          </div>
        ))}
      </div>

      {commissions.length === 0 ? (
        <div className="dash-empty py-16">
          Henüz hak ediş yok. Fırsatı kanbanda &quot;Kazanıldı&quot;ya taşıdığınızda
          burada otomatik belirir.
        </div>
      ) : (
        <div className="dash-surface overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="border-b border-ink/[0.06] bg-ink/[0.02] text-left text-[11px] font-semibold text-ink/40">
                <th className="px-4 py-3">İşlem</th>
                <th className="px-4 py-3">Danışman</th>
                <th className="px-4 py-3 text-right">Brüt</th>
                <th className="px-4 py-3 text-right">Danışman payı</th>
                <th className="px-4 py-3 text-right">Ofis payı</th>
                <th className="px-4 py-3">Durum</th>
                {canManage && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.04]">
              {commissions.map((c) => (
                <tr key={c.id} className="transition hover:bg-brand-50/20">
                  <td className="px-4 py-3">
                    <p className="font-semibold">
                      {c.deal.contact ? (
                        <Link
                          href={`/kisiler/${c.deal.contact.id}`}
                          className="hover:text-brand-700"
                        >
                          {c.deal.contact.fullName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </p>
                    <p className="text-[12px] text-ink/45">
                      {c.deal.listing ? (
                        <>
                          <span className="text-[10px] text-ink/35">
                            {c.deal.listing.refCode}
                          </span>{" "}
                          {c.deal.listing.title}
                          {" · "}
                          {c.deal.listing.purpose === "SALE" ? "Satış" : "Kiralama"}
                        </>
                      ) : (
                        "İlansız işlem"
                      )}
                      {c.deal.value != null && (
                        <> · {trMoney.format(Number(c.deal.value))}</>
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink/55">{c.agent?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-display font-bold tabular-nums text-copper">
                    {trMoney.format(Number(c.gross))}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink/55">
                    {trMoney.format(Number(c.agentShare))}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink/55">
                    {trMoney.format(Number(c.officeShare))}
                  </td>
                  <td className="px-4 py-3">
                    {c.paidAt ? (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        Ödendi · {c.paidAt.toLocaleDateString("tr-TR")}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                        Bekliyor
                      </span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <MarkPaidButton commissionId={c.id} paid={!!c.paidAt} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
