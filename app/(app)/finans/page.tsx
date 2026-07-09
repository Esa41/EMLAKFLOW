import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { trMoney } from "@/lib/labels";
import { MarkPaidButton } from "@/components/mark-paid-button";
import { CashEntryForm } from "@/components/cash-entry-form";
import { DeleteCashEntryButton } from "@/components/delete-cash-entry-button";
import {
  Wallet,
  Hourglass,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";

const CATEGORY_TR: Record<string, string> = {
  reklam: "Reklam",
  kira: "Kira",
  ofis: "Ofis gideri",
  maas: "Maaş / prim",
  vergi: "Vergi / harç",
  "komisyon-disi": "Komisyon dışı",
  diger: "Diğer",
};

export default async function FinancePage() {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);
  const canManage = ["OWNER", "BROKER"].includes(session.role);

  const [commissions, cashEntries] = await Promise.all([
    db.commission.findMany({
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
    }),
    db.cashEntry.findMany({
      orderBy: { occurredAt: "desc" },
      include: { createdBy: { select: { name: true } } },
    }),
  ]);

  const sum = (rows: typeof commissions) =>
    rows.reduce((s, c) => s + Number(c.gross), 0);
  const pending = commissions.filter((c) => !c.paidAt);
  const paid = commissions.filter((c) => c.paidAt);

  const incomeTotal = cashEntries
    .filter((e) => e.type === "income")
    .reduce((s, e) => s + Number(e.amount), 0);
  const expenseTotal = cashEntries
    .filter((e) => e.type === "expense")
    .reduce((s, e) => s + Number(e.amount), 0);

  const stats = [
    { label: "Toplam komisyon", value: trMoney.format(sum(commissions)), icon: Wallet },
    { label: "Bekleyen", value: trMoney.format(sum(pending)), icon: Hourglass },
    { label: "Ödenen", value: trMoney.format(sum(paid)), icon: CheckCircle2 },
    { label: "Manuel gelir", value: trMoney.format(incomeTotal), icon: TrendingUp },
    { label: "Manuel gider", value: trMoney.format(expenseTotal), icon: TrendingDown },
  ];

  return (
    <div className="app-page dash-in space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="app-page-meta">
            {commissions.length} hak ediş · {cashEntries.length} manuel kayıt
          </p>
          <h1 className="app-page-title">Kasa</h1>
          <p className="app-page-desc">
            Komisyon takibi ve manuel gelir/gider. Sözleşmeler{" "}
            <Link href="/kisiler" className="font-semibold text-brand-600 hover:underline">
              Müşteriler
            </Link>{" "}
            kartından.
          </p>
        </div>
        <CashEntryForm canManage={canManage} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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

      {/* Manuel gelir / gider */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold">Manuel gelir & gider</h2>
        {cashEntries.length === 0 ? (
          <div className="dash-empty py-10">
            Henüz manuel kayıt yok.{" "}
            {canManage
              ? "Sağ üstten Gelir / Gider ekleyebilirsiniz."
              : "Yalnızca ofis sahibi veya broker ekleyebilir."}
          </div>
        ) : (
          <div className="dash-surface overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-b border-ink/[0.06] bg-ink/[0.02] text-left text-[11px] font-semibold text-ink/40">
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Tür</th>
                  <th className="px-4 py-3">Açıklama</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right">Tutar</th>
                  {canManage && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.04]">
                {cashEntries.map((e) => (
                  <tr key={e.id} className="transition hover:bg-brand-50/20">
                    <td className="px-4 py-3 tabular-nums text-ink/55">
                      {e.occurredAt.toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-3">
                      {e.type === "income" ? (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          Gelir
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                          Gider
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{e.title}</p>
                      {e.note && (
                        <p className="text-[12px] text-ink/45">{e.note}</p>
                      )}
                      {e.createdBy && (
                        <p className="text-[11px] text-ink/35">
                          {e.createdBy.name}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink/55">
                      {e.category ? CATEGORY_TR[e.category] ?? e.category : "—"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-display font-bold tabular-nums ${
                        e.type === "income" ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {e.type === "expense" ? "−" : "+"}
                      {trMoney.format(Number(e.amount))}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <DeleteCashEntryButton id={e.id} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Komisyonlar */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold">Komisyon hak edişleri</h2>
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
      </section>
    </div>
  );
}
