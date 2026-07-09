"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Loader2, Plus } from "lucide-react";
import type { MarketingLeadStatus } from "@prisma/client";
import {
  MARKETING_LEAD_STATUS_BADGE,
  MARKETING_LEAD_STATUS_TR,
} from "@/lib/marketing-lead-display";

export type MarketingLeadRow = {
  id: string;
  firmaAdi: string;
  yetkiliIsmi: string | null;
  email: string;
  telefon: string | null;
  bolge: string | null;
  status: MarketingLeadStatus;
  createdAt: Date | string;
};

type Counts = {
  total: number;
  pending: number;
  sent: number;
  opened: number;
  clicked: number;
};

export function AdminLeadsTable({
  leads,
  counts,
}: {
  leads: MarketingLeadRow[];
  counts: Counts;
}) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  async function startCampaign() {
    if (sending) return;
    setSending(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/leads/send", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Kampanya başlatılamadı.");
        return;
      }
      setMessage(data.message ?? "Kampanya tamamlandı.");
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-[32px] font-extrabold tracking-tight text-ink">
            Pazarlama Leadleri
          </h1>
          <p className="text-sm text-ink/60">
            Outbound kampanya havuzu. Bekleyenlere şablon e-posta gönderin;
            açılma ve tıklama Resend webhook ile güncellenir.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3 py-2 text-xs font-bold text-ink/70 shadow-sm transition-all hover:border-ink/30 hover:bg-ink/[0.02]"
          >
            <Plus size={13} />
            Lead ekle
          </button>
          <button
            type="button"
            onClick={startCampaign}
            disabled={sending || counts.pending === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Megaphone size={13} />
            )}
            Kampanyayı Başlat (Bekleyenlere Gönder)
            {counts.pending > 0 ? ` · ${counts.pending}` : ""}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Toplam", value: counts.total },
          { label: "Bekleyen", value: counts.pending },
          { label: "Gönderildi", value: counts.sent },
          { label: "Açıldı", value: counts.opened },
          { label: "Tıklandı", value: counts.clicked },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm"
          >
            <p className="text-2xl font-extrabold text-ink">{s.value}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-ink/45">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {(message || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            error
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {error ?? message}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-gradient-to-r from-ink/[0.02] to-brand-50/30">
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-ink/60">
                  Firma
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-ink/60">
                  Yetkili
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-ink/60">
                  E-posta
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-ink/60">
                  Bölge
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-ink/60">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-ink/45"
                  >
                    Henüz pazarlama leadi yok. Sağ üstten ekleyebilirsiniz.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="group border-b border-ink/[0.05] transition-colors last:border-0 hover:bg-brand-50/20"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-100 to-indigo-100 font-display text-sm font-bold text-brand-700">
                          {lead.firmaAdi.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-ink">
                            {lead.firmaAdi}
                          </div>
                          {lead.telefon && (
                            <div className="text-xs text-ink/45">
                              {lead.telefon}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-ink/70">
                      {lead.yetkiliIsmi ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="max-w-[220px] truncate text-ink/70">
                        {lead.email}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-ink/55">
                      {lead.bolge ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${MARKETING_LEAD_STATUS_BADGE[lead.status]}`}
                      >
                        {MARKETING_LEAD_STATUS_TR[lead.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <AddMarketingLeadModal
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

const input =
  "w-full rounded-xl border border-ink/15 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

function AddMarketingLeadModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [firmaAdi, setFirmaAdi] = useState("");
  const [yetkiliIsmi, setYetkiliIsmi] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [bolge, setBolge] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firmaAdi,
          yetkiliIsmi: yetkiliIsmi || undefined,
          email,
          telefon: telefon || undefined,
          bolge: bolge || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Kayıt oluşturulamadı.");
        return;
      }
      onCreated();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="font-display text-lg font-extrabold text-ink">
          Yeni pazarlama leadi
        </h2>
        <p className="mt-1 text-xs text-ink/50">
          Kampanya havuzuna ofis / firma ekleyin.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-ink/60">
              Firma adı *
            </label>
            <input
              className={input}
              value={firmaAdi}
              onChange={(e) => setFirmaAdi(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-ink/60">
              Yetkili ismi
            </label>
            <input
              className={input}
              value={yetkiliIsmi}
              onChange={(e) => setYetkiliIsmi(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-ink/60">
              E-posta *
            </label>
            <input
              type="email"
              className={input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-ink/60">
                Telefon
              </label>
              <input
                className={input}
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-ink/60">
                Bölge
              </label>
              <input
                className={input}
                value={bolge}
                onChange={(e) => setBolge(e.target.value)}
                placeholder="İstanbul"
              />
            </div>
          </div>
          {error && (
            <p className="text-sm font-medium text-rose-600">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-ink/15 px-4 py-2 text-xs font-bold text-ink/60 hover:bg-ink/[0.03]"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
