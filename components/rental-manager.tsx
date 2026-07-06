"use client";

import { useState } from "react";
import { trMoney } from "@/lib/labels";
import { paymentStatus } from "@/lib/rentals";

export interface RentalRow {
  id: string;
  title: string;
  status: string;
  period: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  paymentDueDay: number;
  contact: { id: string; fullName: string; phone: string | null };
  listing: { id: string; refCode: string; title: string } | null;
  payments: Array<{
    id: string;
    periodLabel: string;
    dueDate: string;
    amount: number;
    paidAt: string | null;
  }>;
}

const STATUS_BADGE: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700",
  OVERDUE: "bg-rose-50 text-rose-700",
  UPCOMING: "bg-amber-50 text-amber-800",
  DUE: "bg-slate-100 text-slate-600",
};

const STATUS_TR: Record<string, string> = {
  PAID: "Ödendi",
  OVERDUE: "Gecikti",
  UPCOMING: "Yaklaşıyor",
  DUE: "Bekliyor",
};

export function RentalManager({
  initial,
  contacts,
  listings,
  labels,
}: {
  initial: RentalRow[];
  contacts: Array<{ id: string; fullName: string }>;
  listings: Array<{ id: string; refCode: string; title: string }>;
  labels: { rentals: string; listing: string };
}) {
  const [rows, setRows] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    contactId: "",
    listingId: "",
    startDate: "",
    endDate: "",
    rentAmount: "",
    paymentDueDay: "1",
    deposit: "",
  });
  const [error, setError] = useState<string | null>(null);

  function currentMonthPayment(payments: RentalRow["payments"]) {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return (
      payments.find((p) => p.periodLabel === key) ??
      payments.find((p) => !p.paidAt && new Date(p.dueDate) >= now)
    );
  }

  async function markPaid(paymentId: string, agreementId: string) {
    const res = await fetch(`/api/rentals/${agreementId}/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paidAt: new Date().toISOString(), method: "nakit" }),
    });
    if (!res.ok) return;
    const { payment } = await res.json();
    setRows((rs) =>
      rs.map((r) =>
        r.id === agreementId
          ? {
              ...r,
              payments: r.payments.map((p) =>
                p.id === paymentId
                  ? { ...p, paidAt: payment.paidAt }
                  : p,
              ),
            }
          : r,
      ),
    );
  }

  async function createAgreement() {
    setError(null);
    const res = await fetch("/api/rentals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        rentAmount: Number(form.rentAmount),
        deposit: form.deposit ? Number(form.deposit) : undefined,
        paymentDueDay: Number(form.paymentDueDay),
        listingId: form.listingId || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Kaydedilemedi.");
      return;
    }
    const a = data.agreement;
    setRows((rs) => [
      {
        id: a.id,
        title: a.title,
        status: a.status,
        period: a.period,
        startDate: a.startDate,
        endDate: a.endDate,
        rentAmount: Number(a.rentAmount),
        paymentDueDay: a.paymentDueDay,
        contact: a.contact,
        listing: a.listing,
        payments: a.payments.map(
          (p: { id: string; periodLabel: string; dueDate: string; amount: unknown; paidAt: string | null }) => ({
            id: p.id,
            periodLabel: p.periodLabel,
            dueDate: p.dueDate,
            amount: Number(p.amount),
            paidAt: p.paidAt,
          }),
        ),
      },
      ...rs,
    ]);
    setShowForm(false);
    setForm({
      title: "",
      contactId: "",
      listingId: "",
      startDate: "",
      endDate: "",
      rentAmount: "",
      paymentDueDay: "1",
      deposit: "",
    });
  }

  const active = rows.filter((r) => r.status === "ACTIVE");
  const overdueCount = active.reduce((n, r) => {
    const p = currentMonthPayment(r.payments);
    if (!p) return n;
    return paymentStatus(p.paidAt ? new Date(p.paidAt) : null, new Date(p.dueDate)) === "OVERDUE"
      ? n + 1
      : n;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-4 text-sm">
          <span className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-ink/10">
            <strong>{active.length}</strong> aktif sözleşme
          </span>
          {overdueCount > 0 && (
            <span className="rounded-lg bg-rose-50 px-3 py-1.5 font-semibold text-rose-700">
              {overdueCount} geciken ödeme
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-selvi rounded-xl px-4 py-2 text-sm font-semibold text-white"
        >
          + Yeni sözleşme
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-ink/15 bg-white p-5 space-y-3">
          <h2 className="font-bold">Yeni kira sözleşmesi</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
              placeholder="Başlık * — örn. Çankaya 2+1"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <select
              className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
              value={form.contactId}
              onChange={(e) => setForm((f) => ({ ...f, contactId: e.target.value }))}
            >
              <option value="">Kiracı seç *</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.fullName}</option>
              ))}
            </select>
            <select
              className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
              value={form.listingId}
              onChange={(e) => setForm((f) => ({ ...f, listingId: e.target.value }))}
            >
              <option value="">{labels.listing} bağla (opsiyonel)</option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>{l.refCode} — {l.title}</option>
              ))}
            </select>
            <input
              type="number"
              className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
              placeholder="Aylık kira (₺) *"
              value={form.rentAmount}
              onChange={(e) => setForm((f) => ({ ...f, rentAmount: e.target.value }))}
            />
            <input
              type="date"
              className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
            <input
              type="date"
              className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
            <input
              type="number"
              min={1}
              max={31}
              className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
              placeholder="Ödeme günü (1-31)"
              value={form.paymentDueDay}
              onChange={(e) => setForm((f) => ({ ...f, paymentDueDay: e.target.value }))}
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            onClick={createAgreement}
            className="btn-selvi rounded-xl px-5 py-2 text-sm font-semibold text-white"
          >
            Sözleşme oluştur
          </button>
        </div>
      )}

      <div className="space-y-3">
        {active.map((r) => {
          const cur = currentMonthPayment(r.payments);
          const st = cur
            ? paymentStatus(cur.paidAt ? new Date(cur.paidAt) : null, new Date(cur.dueDate))
            : "DUE";
          return (
            <div key={r.id} className="rounded-xl border border-ink/15 bg-white overflow-hidden">
              <button
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-ink/[0.02]"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div>
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-xs text-ink/50">
                    {r.contact.fullName} · {trMoney.format(r.rentAmount)}/ay · ödeme günü: {r.paymentDueDay}
                  </p>
                </div>
                {cur && (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_BADGE[st]}`}>
                    {STATUS_TR[st]}
                  </span>
                )}
              </button>
              {expanded === r.id && (
                <div className="border-t border-ink/10 px-4 py-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-ink/45">
                        <th className="pb-2">Dönem</th>
                        <th className="pb-2">Vade</th>
                        <th className="pb-2">Tutar</th>
                        <th className="pb-2">Durum</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {r.payments.map((p) => {
                        const ps = paymentStatus(
                          p.paidAt ? new Date(p.paidAt) : null,
                          new Date(p.dueDate),
                        );
                        return (
                          <tr key={p.id} className="border-t border-ink/5">
                            <td className="py-2">{p.periodLabel}</td>
                            <td>{new Date(p.dueDate).toLocaleDateString("tr-TR")}</td>
                            <td>{trMoney.format(p.amount)}</td>
                            <td>
                              <span className={`rounded px-1.5 py-0.5 font-semibold ${STATUS_BADGE[ps]}`}>
                                {STATUS_TR[ps]}
                              </span>
                            </td>
                            <td className="text-right">
                              {!p.paidAt && (
                                <button
                                  onClick={() => markPaid(p.id, r.id)}
                                  className="font-semibold text-brand-600 hover:underline"
                                >
                                  Ödendi
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
        {active.length === 0 && (
          <p className="rounded-xl border border-dashed border-ink/20 py-12 text-center text-sm text-ink/45">
            Henüz aktif kira sözleşmesi yok.
          </p>
        )}
      </div>
    </div>
  );
}
