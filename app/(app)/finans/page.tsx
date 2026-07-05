import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { trMoney } from "@/lib/labels";
import { MarkPaidButton } from "@/components/mark-paid-button";
import { Wallet, Hourglass, CheckCircle2 } from "lucide-react";

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
          contact: { select: { fullName: true } },
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
    { label: "Toplam Komisyon", value: trMoney.format(sum(commissions)), icon: Wallet },
    { label: "Bekleyen", value: trMoney.format(sum(pending)), icon: Hourglass },
    { label: "Ödenen", value: trMoney.format(sum(paid)), icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[27px] font-extrabold tracking-tight">Kasa · Hak Ediş Defteri</h1>
        <p className="mt-1 text-sm text-ink/55">
          Kanban'da "Kazanıldı"ya taşınan her fırsat için otomatik oluşur.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }, i) => (
          <div key={label} className="relative overflow-hidden rounded-[10px] border border-ink bg-white p-5">
            <Icon className="absolute -right-3 -top-3 h-16 w-16 text-ink opacity-[0.06]" />
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">{label}</p>
            <p className={`mt-2 font-display text-xl font-extrabold tracking-tight ${i === 0 ? "text-copper" : ""}`}>{value}</p>
          </div>
        ))}
      </div>

      {commissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/25 bg-white/70 p-12 text-center text-sm text-ink/55">
          Henüz hak ediş yok. İlk fırsatı Kanban'da "Kazanıldı"ya taşıdığında
          burada otomatik belirecek.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white border border-ink/15">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs font-bold uppercase tracking-wider text-ink/45">
                <th className="px-4 py-3">İşlem</th>
                <th className="px-4 py-3">Danışman</th>
                <th className="px-4 py-3 text-right">Brüt</th>
                <th className="px-4 py-3 text-right">Danışman Payı</th>
                <th className="px-4 py-3 text-right">Ofis Payı</th>
                <th className="px-4 py-3">Durum</th>
                {canManage && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.06]">
              {commissions.map((c) => (
                <tr key={c.id} className="hover:bg-ink/[0.03]">
                  <td className="px-4 py-3">
                    <p className="font-semibold">
                      {c.deal.contact?.fullName ?? "—"}
                    </p>
                    <p className="text-xs text-ink/55">
                      {c.deal.listing ? (
                        <>
                          <span className="font-mono text-[10px] text-ink/45">
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
                        <> · bedel {trMoney.format(Number(c.deal.value))}</>
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink/65">{c.agent?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-display font-extrabold text-copper">
                    {trMoney.format(Number(c.gross))}
                  </td>
                  <td className="px-4 py-3 text-right text-ink/65">
                    {trMoney.format(Number(c.agentShare))}
                  </td>
                  <td className="px-4 py-3 text-right text-ink/65">
                    {trMoney.format(Number(c.officeShare))}
                  </td>
                  <td className="px-4 py-3">
                    {c.paidAt ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Ödendi · {c.paidAt.toLocaleDateString("tr-TR")}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
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
