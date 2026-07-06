"use client";

import { useMemo, useState } from "react";
import { Plus, Phone, Trash2, CheckCircle2, XCircle, UserX, RotateCcw } from "lucide-react";

export interface AgendaItem {
  id: string;
  title: string;
  status: string;
  startsAt: string; // ISO
  note: string | null;
  contact: { id: string; fullName: string; phone: string | null } | null;
  listing: { id: string; refCode: string; title: string } | null;
  agent: { id: string; name: string } | null;
}
export interface Option {
  id: string;
  label: string;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  SCHEDULED: { label: "Planlandı", cls: "bg-brand-50 text-brand-700" },
  DONE: { label: "Yapıldı", cls: "bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "İptal", cls: "bg-ink/[0.05] text-ink/55" },
  NO_SHOW: { label: "Gelmedi", cls: "bg-rose-50 text-rose-600" },
};

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dayLabel(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((date.getTime() - t.getTime()) / 86400000);
  const base = date.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  if (diff === 0) return `Bugün · ${base}`;
  if (diff === 1) return `Yarın · ${base}`;
  if (diff === -1) return `Dün · ${base}`;
  return base;
}

export function Agenda({
  initialItems,
  contacts,
  listings,
  agents,
  currentUserId,
}: {
  initialItems: AgendaItem[];
  contacts: Option[];
  listings: Option[];
  agents: Option[];
  currentUserId: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const it of items) {
      const k = dayKey(it.startsAt);
      map.set(k, [...(map.get(k) ?? []), it]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  async function setStatus(id: string, status: string) {
    const prev = items;
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, status } : x)));
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setItems(prev);
      setError("Durum güncellenemedi.");
    }
  }

  async function remove(id: string) {
    const prev = items;
    setItems((xs) => xs.filter((x) => x.id !== id));
    const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setItems(prev);
      setError("Randevu silinemedi.");
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <NewAppointment
        contacts={contacts}
        listings={listings}
        agents={agents}
        currentUserId={currentUserId}
        onCreated={(a) =>
          setItems((xs) =>
            [...xs, a].sort((p, q) => p.startsAt.localeCompare(q.startsAt))
          )
        }
      />

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">{error}</p>
      )}

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/25 bg-white/70 p-12 text-center text-sm text-ink/55">
          Önümüzdeki 3 haftada randevu yok. Yukarıdan ilk randevunu oluştur.
        </div>
      ) : (
        groups.map(([key, dayItems]) => (
          <section key={key}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink/45">
              {dayLabel(key)}
            </h2>
            <div className="space-y-2">
              {dayItems.map((a) => {
                const meta = STATUS_META[a.status] ?? STATUS_META.SCHEDULED;
                const past = new Date(a.startsAt).getTime() < Date.now();
                return (
                  <article
                    key={a.id}
                    className="flex flex-wrap items-start gap-3 rounded-2xl bg-white p-4 border border-ink/15"
                  >
                    <span className="rounded-lg bg-brand-50 px-2 py-1 font-mono text-xs font-bold text-brand-700">
                      {new Date(a.startsAt).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`font-semibold ${a.status === "CANCELLED" ? "text-ink/45 line-through" : ""}`}>
                          {a.title}
                        </p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink/55">
                        {a.contact?.fullName ?? "—"}
                        {a.listing && (
                          <>
                            {" · "}
                            <span className="font-mono text-[10px] text-ink/45">
                              {a.listing.refCode}
                            </span>{" "}
                            {a.listing.title}
                          </>
                        )}
                        {a.agent && <> · {a.agent.name}</>}
                      </p>
                      {a.note && <p className="mt-1 text-xs text-ink/45">{a.note}</p>}
                    </div>

                    <div className="flex items-center gap-1">
                      {a.contact?.phone && (
                        <a
                          href={`tel:${a.contact.phone}`}
                          className="rounded-lg p-2 text-ink/45 hover:bg-brand-50 hover:text-brand-600"
                          aria-label="Ara"
                        >
                          <Phone size={15} />
                        </a>
                      )}
                      {a.status === "SCHEDULED" ? (
                        <>
                          {past && (
                            <>
                              <button
                                onClick={() => setStatus(a.id, "DONE")}
                                className="rounded-lg p-2 text-ink/45 hover:bg-emerald-50 hover:text-emerald-600"
                                aria-label="Yapıldı işaretle"
                                title="Yapıldı"
                              >
                                <CheckCircle2 size={15} />
                              </button>
                              <button
                                onClick={() => setStatus(a.id, "NO_SHOW")}
                                className="rounded-lg p-2 text-ink/45 hover:bg-rose-50 hover:text-rose-500"
                                aria-label="Gelmedi işaretle"
                                title="Gelmedi"
                              >
                                <UserX size={15} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setStatus(a.id, "CANCELLED")}
                            className="rounded-lg p-2 text-ink/45 hover:bg-ink/[0.05]"
                            aria-label="İptal et"
                            title="İptal"
                          >
                            <XCircle size={15} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setStatus(a.id, "SCHEDULED")}
                          className="rounded-lg p-2 text-ink/45 hover:bg-brand-50 hover:text-brand-600"
                          aria-label="Planlandıya geri al"
                          title="Geri al"
                        >
                          <RotateCcw size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => remove(a.id)}
                        className="rounded-lg p-2 text-ink/25 hover:bg-rose-50 hover:text-rose-500"
                        aria-label="Sil"
                        title="Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

// ── Yeni randevu formu ──
export function NewAppointment({
  contacts,
  listings,
  agents,
  currentUserId,
  onCreated,
  defaultOpen = false,
  onClose,
}: {
  contacts: Option[];
  listings: Option[];
  agents: Option[];
  currentUserId: string;
  onCreated: (a: AgendaItem) => void;
  defaultOpen?: boolean;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [contactId, setContactId] = useState("");
  const [listingId, setListingId] = useState("");
  const [agentId, setAgentId] = useState(currentUserId);
  const [saving, setSaving] = useState(false);

  const sel =
    "w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/40";

  async function create() {
    if (!title || !date || !time) return;
    setSaving(true);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        startsAt: new Date(`${date}T${time}`).toISOString(),
        contactId: contactId || undefined,
        listingId: listingId || undefined,
        agentId,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      onCreated(data.appointment);
      setOpen(false);
      onClose?.();
      setTitle("");
      setContactId("");
      setListingId("");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-selvi flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
      >
        <Plus size={16} /> Yeni randevu
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl bg-white p-5 border border-ink/15">
      <input
        className={sel}
        placeholder="Başlık — örn. Yer gösterme: Park Oran 3+1 *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <input type="date" className={sel} value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="time" className={sel} value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select className={sel} value={contactId} onChange={(e) => setContactId(e.target.value)}>
          <option value="">Müşteri (opsiyonel)</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <select className={sel} value={listingId} onChange={(e) => setListingId(e.target.value)}>
          <option value="">İlan (opsiyonel)</option>
          {listings.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
        <select className={sel} value={agentId} onChange={(e) => setAgentId(e.target.value)}>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          onClick={create}
          disabled={saving || !title || !date}
          className="btn-selvi rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Oluşturuluyor…" : "Oluştur"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            onClose?.();
          }}
          className="rounded-xl bg-ink/[0.05] px-5 py-2 text-sm font-semibold text-ink/65"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
