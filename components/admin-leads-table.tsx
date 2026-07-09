"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Search,
  Send,
  X,
  Mail,
  CheckSquare,
} from "lucide-react";
import type { MarketingLeadStatus } from "@prisma/client";
import {
  MARKETING_LEAD_STATUS_BADGE,
  MARKETING_LEAD_STATUS_TR,
} from "@/lib/marketing-lead-display";
import {
  ADMIN_MARKETING_TEMPLATES,
  getAdminMarketingTemplate,
} from "@/lib/admin-marketing-templates";

export type MarketingLeadRow = {
  id: string;
  firmaAdi: string;
  yetkiliIsmi: string | null;
  email: string;
  telefon: string | null;
  bolge: string | null;
  notes: string | null;
  status: MarketingLeadStatus;
  createdAt: string;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
};

type Counts = {
  total: number;
  pending: number;
  sent: number;
  opened: number;
  clicked: number;
  demo: number;
};

type OutboundRow = {
  id: string;
  templateKey: string;
  subject: string;
  preview: string | null;
  status: string;
  error: string | null;
  sentAt: string;
  openedAt: string | null;
  clickedAt: string | null;
};

const dtFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return dtFmt.format(new Date(iso));
}

const OUTBOUND_STATUS_TR: Record<string, string> = {
  sent: "Gönderildi",
  failed: "Başarısız",
  opened: "Açıldı",
  clicked: "Tıklandı",
  bounced: "Bounce",
};

const input =
  "w-full rounded-xl border border-ink/15 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function AdminLeadsTable({
  leads,
  counts,
}: {
  leads: MarketingLeadRow[];
  counts: Counts;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [batchSending, setBatchSending] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!q) return true;
      return (
        l.firmaAdi.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.yetkiliIsmi?.toLowerCase().includes(q) ?? false) ||
        (l.bolge?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [leads, query, statusFilter]);

  const active = activeId ? leads.find((l) => l.id === activeId) ?? null : null;

  const openRate =
    counts.sent + counts.opened + counts.clicked > 0
      ? Math.round(
          ((counts.opened + counts.clicked) /
            (counts.sent + counts.opened + counts.clicked)) *
            100,
        )
      : 0;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    const ids = filtered.map((l) => l.id);
    const allOn = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOn) ids.forEach((id) => next.delete(id));
      else ids.slice(0, 20).forEach((id) => next.add(id));
      return next;
    });
  }

  async function sendSelected() {
    if (batchSending || selected.size === 0) return;
    setBatchSending(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/leads/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: Array.from(selected).slice(0, 20),
          templateKey: "demo-invite",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gönderilemedi.");
      setNotice({ ok: true, text: data.message ?? "Gönderildi." });
      setSelected(new Set());
      router.refresh();
    } catch (e) {
      setNotice({
        ok: false,
        text: e instanceof Error ? e.message : "Gönderilemedi.",
      });
    } finally {
      setBatchSending(false);
    }
  }

  async function sendPending() {
    if (batchSending || counts.pending === 0) return;
    setBatchSending(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/leads/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateKey: "demo-invite" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gönderilemedi.");
      setNotice({ ok: true, text: data.message ?? "Gönderildi." });
      router.refresh();
    } catch (e) {
      setNotice({
        ok: false,
        text: e instanceof Error ? e.message : "Gönderilemedi.",
      });
    } finally {
      setBatchSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-[32px] font-extrabold tracking-tight text-ink">
            Pazarlama
          </h1>
          <p className="text-sm text-ink/60">
            Kişiye özel outbound. Lead&apos;e tıklayıp şablon seçin; açılma ve
            tıklama tarihleri Resend ile güncellenir.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3 py-2 text-xs font-bold text-ink/70 shadow-sm hover:bg-ink/[0.02]"
          >
            <Plus size={13} />
            Lead ekle
          </button>
          {selected.size > 0 ? (
            <button
              type="button"
              onClick={() => void sendSelected()}
              disabled={batchSending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {batchSending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <CheckSquare size={13} />
              )}
              Seçilenlere gönder · {Math.min(selected.size, 20)}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void sendPending()}
              disabled={batchSending || counts.pending === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3 py-2 text-xs font-bold text-ink/60 hover:bg-ink/[0.02] disabled:opacity-50"
            >
              {batchSending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Send size={13} />
              )}
              Bekleyenlere (max 20)
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Toplam", value: counts.total },
          { label: "Bekleyen", value: counts.pending },
          { label: "Gönderildi", value: counts.sent },
          { label: "Açıldı", value: counts.opened },
          { label: "Tıklandı", value: counts.clicked },
          { label: "Open rate", value: `%${openRate}` },
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35"
          />
          <input
            className={`${input} pl-9`}
            placeholder="Firma, e-posta, yetkili, bölge…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className={`${input} sm:w-44`}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tüm durumlar</option>
          {(Object.keys(MARKETING_LEAD_STATUS_TR) as MarketingLeadStatus[]).map(
            (s) => (
              <option key={s} value={s}>
                {MARKETING_LEAD_STATUS_TR[s]}
              </option>
            ),
          )}
        </select>
      </div>

      {notice && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            notice.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-gradient-to-r from-ink/[0.02] to-brand-50/30">
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      filtered.length > 0 &&
                      filtered
                        .slice(0, 20)
                        .every((l) => selected.has(l.id))
                    }
                    onChange={toggleAllFiltered}
                    className="rounded border-ink/30"
                    aria-label="Tümünü seç"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink/60">
                  Firma
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink/60">
                  Yetkili
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink/60">
                  Durum
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink/60">
                  Son gönderim
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink/60">
                  Açılma
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-ink/45"
                  >
                    Kayıt yok.
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="cursor-pointer border-b border-ink/[0.05] transition-colors last:border-0 hover:bg-brand-50/20"
                    onClick={() => setActiveId(lead.id)}
                  >
                    <td
                      className="px-3 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="rounded border-ink/30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink">
                        {lead.firmaAdi}
                      </div>
                      <div className="truncate text-xs text-ink/45">
                        {lead.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink/70">
                      {lead.yetkiliIsmi ?? "—"}
                      {lead.bolge && (
                        <div className="text-xs text-ink/40">{lead.bolge}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${MARKETING_LEAD_STATUS_BADGE[lead.status]}`}
                      >
                        {MARKETING_LEAD_STATUS_TR[lead.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink/55">
                      {fmtDate(lead.sentAt)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink/55">
                      {fmtDate(lead.openedAt ?? lead.clickedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {active && (
        <LeadDetailDrawer
          key={active.id}
          lead={active}
          onClose={() => setActiveId(null)}
          onChanged={() => {
            router.refresh();
          }}
        />
      )}

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

function LeadDetailDrawer({
  lead,
  onClose,
  onChanged,
}: {
  lead: MarketingLeadRow;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [status, setStatus] = useState<MarketingLeadStatus>(lead.status);
  const [templateKey, setTemplateKey] = useState("demo-invite");
  const [subject, setSubject] = useState(
    () =>
      getAdminMarketingTemplate("demo-invite")?.subject
        .replaceAll("{{Firma_Adi}}", lead.firmaAdi)
        .replaceAll("{{Yetkili_Ismi}}", lead.yetkiliIsmi || "Yetkili") ?? "",
  );
  const [body, setBody] = useState(
    () =>
      getAdminMarketingTemplate("demo-invite")?.body
        .replaceAll("{{Firma_Adi}}", lead.firmaAdi)
        .replaceAll("{{Yetkili_Ismi}}", lead.yetkiliIsmi || "Yetkili")
        .replaceAll("{{Bolge}}", lead.bolge || "") ?? "",
  );
  const [emails, setEmails] = useState<OutboundRow[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setEmails(null);
    void (async () => {
      try {
        const res = await fetch(`/api/admin/leads/${lead.id}/emails`);
        const data = await res.json();
        if (alive) setEmails(data.emails ?? []);
      } catch {
        if (alive) setEmails([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [lead.id]);

  function pickTemplate(key: string) {
    setTemplateKey(key);
    const tpl = getAdminMarketingTemplate(key);
    if (!tpl) return;
    const fill = (s: string) =>
      s
        .replaceAll("{{Firma_Adi}}", lead.firmaAdi)
        .replaceAll("{{Yetkili_Ismi}}", lead.yetkiliIsmi || "Yetkili")
        .replaceAll("{{Bolge}}", lead.bolge || "");
    setSubject(fill(tpl.subject));
    setBody(fill(tpl.body));
  }

  async function saveLead() {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Kaydedilemedi.");
      setMsg("Lead güncellendi.");
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function sendOne() {
    if (sending) return;
    setSending(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateKey, subject, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gönderilemedi.");
      setMsg("E-posta gönderildi.");
      const hist = await fetch(`/api/admin/leads/${lead.id}/emails`);
      const histData = await hist.json().catch(() => ({}));
      setEmails(histData.emails ?? []);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gönderilemedi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40">
      <button
        type="button"
        className="flex-1"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-ink/10 px-5 py-4">
          <div>
            <h2 className="font-display text-xl font-extrabold">{lead.firmaAdi}</h2>
            <p className="mt-0.5 text-sm text-ink/50">{lead.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink/40 hover:bg-ink/[0.05]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="font-bold uppercase tracking-wider text-ink/40">
                Yetkili
              </p>
              <p className="mt-1 text-sm text-ink">{lead.yetkiliIsmi ?? "—"}</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-wider text-ink/40">
                Bölge
              </p>
              <p className="mt-1 text-sm text-ink">{lead.bolge ?? "—"}</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-wider text-ink/40">
                Son gönderim
              </p>
              <p className="mt-1 text-sm text-ink">{fmtDate(lead.sentAt)}</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-wider text-ink/40">
                Açılma
              </p>
              <p className="mt-1 text-sm text-ink">{fmtDate(lead.openedAt)}</p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-ink/60">
              Durum
            </label>
            <select
              className={input}
              value={status}
              onChange={(e) => setStatus(e.target.value as MarketingLeadStatus)}
            >
              {(Object.keys(MARKETING_LEAD_STATUS_TR) as MarketingLeadStatus[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {MARKETING_LEAD_STATUS_TR[s]}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-ink/60">
              Not
            </label>
            <textarea
              className={`${input} min-h-[72px] resize-y`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Görüşme notu…"
            />
          </div>

          <button
            type="button"
            onClick={() => void saveLead()}
            disabled={saving}
            className="rounded-lg border border-ink/15 px-3 py-2 text-xs font-bold text-ink/70 hover:bg-ink/[0.03] disabled:opacity-50"
          >
            {saving ? "Kaydediliyor…" : "Lead’i kaydet"}
          </button>

          <div className="border-t border-ink/10 pt-5">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Mail size={15} className="text-brand-600" /> Bu kişiye e-posta
            </h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ADMIN_MARKETING_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.key}
                  type="button"
                  onClick={() => pickTemplate(tpl.key)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                    templateKey === tpl.key
                      ? "border-brand-600 bg-brand-50 text-brand-800"
                      : "border-ink/15 text-ink/65 hover:bg-ink/[0.03]"
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <input
                className={input}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Konu"
              />
              <textarea
                className={`${input} min-h-[140px] resize-y`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Mesaj"
              />
              <button
                type="button"
                onClick={() => void sendOne()}
                disabled={sending || !subject || !body}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Gönder
              </button>
            </div>
          </div>

          {(msg || err) && (
            <p
              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                err ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {err ?? msg}
            </p>
          )}

          <div className="border-t border-ink/10 pt-5">
            <h3 className="text-sm font-bold">Gönderim geçmişi</h3>
            {emails === null ? (
              <p className="mt-2 text-xs text-ink/45">Yükleniyor…</p>
            ) : emails.length === 0 ? (
              <p className="mt-2 text-xs text-ink/45">Henüz gönderim yok.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {emails.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-xl border border-ink/10 bg-ink/[0.02] px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-ink">
                        {e.subject}
                      </p>
                      <span className="shrink-0 text-[10px] font-bold uppercase text-ink/40">
                        {OUTBOUND_STATUS_TR[e.status] ?? e.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-ink/45">
                      {fmtDate(e.sentAt)}
                      {e.openedAt ? ` · açıldı ${fmtDate(e.openedAt)}` : ""}
                      {e.clickedAt ? ` · tık ${fmtDate(e.clickedAt)}` : ""}
                    </p>
                    {e.error && (
                      <p className="mt-1 text-[11px] text-rose-600">{e.error}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
              className="rounded-lg border border-ink/15 px-4 py-2 text-xs font-bold text-ink/60"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
