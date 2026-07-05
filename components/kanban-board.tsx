"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Phone, GripVertical } from "lucide-react";
import { trMoney } from "@/lib/labels";

// ── Tipler (server'dan serileştirilmiş) ──
export interface DealCard {
  id: string;
  stage: string;
  value: number | null;
  lostReason: string | null;
  contact: { id: string; fullName: string; phone: string | null } | null;
  listing: { id: string; refCode: string; title: string } | null;
  agent: { id: string; name: string } | null;
}
export interface ContactOption {
  id: string;
  fullName: string;
}
export interface ListingOption {
  id: string;
  refCode: string;
  title: string;
}

const COLUMNS: Array<{ key: string; label: string; accent: string; closed?: boolean }> = [
  { key: "NEW", label: "Yeni", accent: "#c7d6c2" },
  { key: "CONTACTED", label: "İletişimde", accent: "#c7d6c2" },
  { key: "VIEWING", label: "Yer Gösterildi", accent: "#8fb392" },
  { key: "OFFER", label: "Teklif", accent: "#4e8362" },
  { key: "CONTRACT", label: "Sözleşme", accent: "#1e5b3e" },
  { key: "CLOSED_WON", label: "Kazanıldı", accent: "#b4652a", closed: true },
  { key: "CLOSED_LOST", label: "Kaybedildi", accent: "#c8beb4", closed: true },
];

export function KanbanBoard({
  initialDeals,
  contacts,
  listings,
}: {
  initialDeals: DealCard[];
  contacts: ContactOption[];
  listings: ListingOption[];
}) {
  const [deals, setDeals] = useState<DealCard[]>(initialDeals);
  const [contactList, setContactList] = useState<ContactOption[]>(contacts);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleContactCreated(c: ContactOption) {
    setContactList((cs) => [...cs, c].sort((a, b) => a.fullName.localeCompare(b.fullName, "tr")));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  const byStage = useMemo(() => {
    const map: Record<string, DealCard[]> = {};
    for (const c of COLUMNS) map[c.key] = [];
    for (const d of deals) (map[d.stage] ?? (map[d.stage] = [])).push(d);
    return map;
  }, [deals]);

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const dealId = String(e.active.id);
    const target = e.over ? String(e.over.id) : null;
    if (!target) return;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === target) return;

    // Optimistic
    const prev = deals;
    setDeals((ds) => ds.map((d) => (d.id === dealId ? { ...d, stage: target } : d)));
    setError(null);

    const res = await fetch(`/api/deals/${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: target }),
    });
    if (!res.ok) {
      setDeals(prev);
      setError("Aşama güncellenemedi, tekrar dene.");
    }
  }

  function handleCreated(deal: DealCard) {
    setDeals((ds) => [deal, ...ds]);
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">{error}</p>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {COLUMNS.map((col) => (
            <Column
              key={col.key}
              col={col}
              deals={byStage[col.key] ?? []}
              contacts={contactList}
              listings={listings}
              onCreated={handleCreated}
              onContactCreated={handleContactCreated}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? <Card deal={activeDeal} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ── Kolon ──
function Column({
  col,
  deals,
  contacts,
  listings,
  onCreated,
  onContactCreated,
}: {
  col: (typeof COLUMNS)[number];
  deals: DealCard[];
  contacts: ContactOption[];
  listings: ListingOption[];
  onCreated: (d: DealCard) => void;
  onContactCreated: (c: ContactOption) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  const total = deals.reduce((s, d) => s + (d.value ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-lg p-2 transition-colors ${
        isOver ? "bg-brand-50 ring-2 ring-brand-500/40" : ""
      } ${col.closed ? "opacity-80" : ""}`}
    >
      <div className="mb-3 flex items-baseline justify-between gap-2 border-b-2 border-ink px-1 pb-2">
        <div className="flex items-baseline gap-2">
          <h3 className="text-[13px] font-bold">{col.label}</h3>
          <span className="font-mono text-[10px] text-ink/50">{deals.length}</span>
        </div>
        {total > 0 && (
          <span className="font-mono text-[10px] font-semibold text-ink/50">
            {trMoney.format(total)}
          </span>
        )}
      </div>

      <div className="flex min-h-24 flex-col gap-2">
        {deals.map((d) => (
          <DraggableCard key={d.id} deal={d} />
        ))}
        {col.key === "NEW" && (
          <QuickCreate
            contacts={contacts}
            listings={listings}
            onCreated={onCreated}
            onContactCreated={onContactCreated}
          />
        )}
      </div>
    </div>
  );
}

// ── Kart ──
function DraggableCard({ deal }: { deal: DealCard }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...attributes}
      {...listeners}
      className={isDragging ? "opacity-40" : ""}
    >
      <Card deal={deal} />
    </div>
  );
}

function Card({ deal, overlay = false }: { deal: DealCard; overlay?: boolean }) {
  const col = COLUMNS.find((c) => c.key === deal.stage);
  return (
    <div
      className={`cursor-grab overflow-hidden rounded-lg border border-ink/15 bg-white text-sm active:cursor-grabbing ${
        overlay ? "rotate-2 border-ink shadow-lg" : ""
      }`}
    >
      <div className="h-1" style={{ background: col?.accent ?? "#c7d6c2" }} />
      <div className="p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-ink">
          {deal.contact?.fullName ?? "İsimsiz fırsat"}
        </p>
        <GripVertical size={14} className="mt-0.5 shrink-0 text-ink/25" />
      </div>
      {deal.listing && (
        <p className="mt-1 line-clamp-1 text-xs text-ink/55">
          <span className="font-mono text-[10px] text-ink/45">{deal.listing.refCode}</span>{" "}
          {deal.listing.title}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="font-display font-extrabold text-brand-700">
          {deal.value != null ? trMoney.format(deal.value) : "—"}
        </span>
        {deal.contact?.phone && (
          <a
            href={`tel:${deal.contact.phone}`}
            onPointerDown={(e) => e.stopPropagation()}
            className="rounded-lg p-1.5 text-ink/45 hover:bg-brand-50 hover:text-brand-600"
            aria-label="Ara"
          >
            <Phone size={14} />
          </a>
        )}
      </div>
      {deal.agent && (
        <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink/40">
          {deal.agent.name}
        </p>
      )}
      </div>
    </div>
  );
}

// ── Hızlı fırsat oluşturma (Yeni kolonu) ──
function QuickCreate({
  contacts,
  listings,
  onCreated,
  onContactCreated,
}: {
  contacts: ContactOption[];
  listings: ListingOption[];
  onCreated: (d: DealCard) => void;
  onContactCreated: (c: ContactOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [contactId, setContactId] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [listingId, setListingId] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isNewContact = contactId === "__new";
  const canSubmit = isNewContact ? newName.trim().length > 0 : !!contactId;

  function reset() {
    setOpen(false);
    setContactId("");
    setNewName("");
    setNewPhone("");
    setListingId("");
    setValue("");
    setFormError(null);
  }

  async function handleCreate() {
    if (!canSubmit) return;
    setSaving(true);
    setFormError(null);

    let useContactId = contactId;
    if (isNewContact) {
      const cRes = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: newName, phone: newPhone || undefined }),
      });
      if (!cRes.ok) {
        setSaving(false);
        setFormError("Müşteri oluşturulamadı, tekrar dene.");
        return;
      }
      const { contact } = await cRes.json();
      onContactCreated({ id: contact.id, fullName: contact.fullName });
      useContactId = contact.id;
    }

    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: useContactId,
        listingId: listingId || undefined,
        value: value ? Number(value) : undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      onCreated({ ...data.deal, value: data.deal.value ? Number(data.deal.value) : null });
      reset();
    } else {
      setFormError("Fırsat oluşturulamadı, tekrar dene.");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-ink/25 py-2.5 text-xs font-semibold text-ink/45 transition-colors hover:border-brand-500 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
      >
        <Plus size={14} /> Fırsat ekle
      </button>
    );
  }

  const sel =
    "w-full rounded-lg border border-ink/15 bg-white px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/40";

  return (
    <div className="space-y-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-ink/15">
      <select className={sel} value={contactId} onChange={(e) => setContactId(e.target.value)}>
        <option value="">Müşteri seç *</option>
        <option value="__new">＋ Yeni müşteri oluştur</option>
        {contacts.map((c) => (
          <option key={c.id} value={c.id}>{c.fullName}</option>
        ))}
      </select>
      {isNewContact && (
        <>
          <input
            className={sel}
            placeholder="Ad Soyad *"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <input
            className={sel}
            type="tel"
            placeholder="Telefon (opsiyonel)"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
        </>
      )}
      <select className={sel} value={listingId} onChange={(e) => setListingId(e.target.value)}>
        <option value="">İlan (opsiyonel)</option>
        {listings.map((l) => (
          <option key={l.id} value={l.id}>{l.refCode} — {l.title}</option>
        ))}
      </select>
      <input
        type="number"
        className={sel}
        placeholder="Beklenen bedel (₺)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        min={0}
      />
      {formError && <p className="text-[11px] font-medium text-rose-600">{formError}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          disabled={saving || !canSubmit}
          className="btn-selvi flex-1 rounded-lg py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {saving ? "…" : "Ekle"}
        </button>
        <button
          onClick={reset}
          className="flex-1 rounded-lg bg-brand-50/60 py-1.5 text-xs font-semibold text-ink/65"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
