"use client";

import { useMemo, useState, useCallback } from "react";
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
import { Plus, Phone, GripVertical, Search, ChevronDown } from "lucide-react";
import { trMoney, STAGE_COLOR } from "@/lib/labels";
import { getVertical } from "@/lib/verticals";
import { DealDrawer } from "./deal-drawer";
import { DealListView } from "./deal-list-view";
import { logActivity } from "@/app/actions/activity";

export interface DealCard {
  id: string;
  stage: string;
  value: number | null;
  lostReason: string | null;
  stageChangedAt: string | null;
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
export interface AgentOption {
  id: string;
  name: string;
}

const OPEN_STAGES = ["NEW", "CONTACTED", "VIEWING", "OFFER", "CONTRACT"] as const;
const CLOSED_STAGES = ["CLOSED_WON", "CLOSED_LOST"] as const;

function daysInStage(iso: string | null | undefined): number {
  if (!iso) return 0;
  return Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function KanbanBoard({
  initialDeals,
  contacts,
  listings,
  agents,
  vertical = "REAL_ESTATE",
  currentUserId,
}: {
  initialDeals: DealCard[];
  contacts: ContactOption[];
  listings: ListingOption[];
  agents: AgentOption[];
  vertical?: string | null;
  currentUserId: string;
}) {
  const v = getVertical(vertical);
  const stageLabels = v.stageLabels;

  const OPEN_COLUMNS = OPEN_STAGES.map((key) => ({
    key,
    label: stageLabels[key] ?? key,
    accent: STAGE_COLOR[key] ?? "#c7d6c2",
  }));

  const [deals, setDeals] = useState<DealCard[]>(initialDeals);
  const [contactList, setContactList] = useState(contacts);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"board" | "list" | "closed">("board");
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [drawerDeal, setDrawerDeal] = useState<DealCard | null>(null);
  const [drawerActivities, setDrawerActivities] = useState<
    Array<{ id: string; body: string; createdAt: string; type?: string; author?: string | null }>
  >([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter((d) => {
      if (mineOnly && d.agent?.id !== currentUserId) return false;
      if (agentFilter && d.agent?.id !== agentFilter) return false;
      if (!q) return true;
      const hay = [
        d.contact?.fullName,
        d.listing?.title,
        d.listing?.refCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [deals, search, agentFilter, mineOnly, currentUserId]);

  const byStage = useMemo(() => {
    const map: Record<string, DealCard[]> = {};
    for (const key of [...OPEN_STAGES, ...CLOSED_STAGES]) map[key] = [];
    for (const d of filtered) (map[d.stage] ?? (map[d.stage] = [])).push(d);
    return map;
  }, [filtered]);

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;
  const closedDeals = [
    ...(byStage.CLOSED_WON ?? []),
    ...(byStage.CLOSED_LOST ?? []),
  ];

  const patchDeal = useCallback(
    async (dealId: string, patch: Partial<DealCard>) => {
      const prev = deals;
      setDeals((ds) =>
        ds.map((d) => (d.id === dealId ? { ...d, ...patch } : d)),
      );
      setError(null);
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: patch.stage,
          lostReason: patch.lostReason,
          value: patch.value,
        }),
      });
      if (!res.ok) {
        setDeals(prev);
        setError("Güncellenemedi, tekrar dene.");
        return false;
      }
      const data = await res.json();
      const updated = data.deal;
      setDeals((ds) =>
        ds.map((d) =>
          d.id === dealId
            ? {
                ...d,
                stage: updated.stage,
                lostReason: updated.lostReason,
                value: updated.value ? Number(updated.value) : null,
                stageChangedAt: updated.stageChangedAt,
              }
            : d,
        ),
      );
      if (drawerDeal?.id === dealId) {
        setDrawerDeal((d) =>
          d
            ? {
                ...d,
                stage: updated.stage,
                lostReason: updated.lostReason,
                stageChangedAt: updated.stageChangedAt,
              }
            : null,
        );
      }
      return true;
    },
    [deals, drawerDeal],
  );

  async function openDrawer(deal: DealCard) {
    setDrawerDeal(deal);
    const res = await fetch(
      `/api/activity-log?entity=deal&entityId=${deal.id}&page=1`,
    );
    if (res.ok) {
      const data = await res.json();
      setDrawerActivities(
        (data.activities ?? []).map(
          (a: {
            id: string;
            body: string;
            createdAt: string;
            type?: string;
            user?: { name: string } | null;
          }) => ({
            id: a.id,
            body: a.body,
            createdAt: a.createdAt,
            type: a.type,
            author: a.user?.name ?? null,
          }),
        ),
      );
    } else {
      setDrawerActivities([]);
    }
  }

  // Fırsat notu ekle (deal drawer'dan) — optimistic olarak listeye ekle
  async function addDealNote(dealId: string, type: string, body: string) {
    const res = await logActivity({ entity: "deal", entityId: dealId, type, body });
    if (res.ok) {
      setDrawerActivities((prev) => [
        ...prev,
        {
          id: res.activity.id,
          body: res.activity.body,
          createdAt: res.activity.createdAt,
          type: res.activity.type,
          author: "Siz",
        },
      ]);
    }
    return res;
  }

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
    await patchDeal(dealId, {
      stage: target,
      stageChangedAt: new Date().toISOString(),
    });
  }

  function handleCreated(deal: DealCard) {
    setDeals((ds) => [deal, ...ds]);
  }

  function handleContactCreated(c: ContactOption) {
    setContactList((cs) =>
      [...cs, c].sort((a, b) => a.fullName.localeCompare(b.fullName, "tr")),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Müşteri veya ilan ara…"
            className="dash-input py-2 pl-9 pr-3"
          />
        </div>
        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="dash-select"
        >
          <option value="">Tüm danışmanlar</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-[13px] text-ink/50">
          <input
            type="checkbox"
            checked={mineOnly}
            onChange={(e) => setMineOnly(e.target.checked)}
            className="rounded accent-brand-600"
          />
          Benimkiler
        </label>
      </div>

      <div className="dash-segmented w-fit">
        {(
          [
            ["board", "Pano"],
            ["list", "Liste"],
            ["closed", `Sonuçlar (${closedDeals.length})`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`dash-segmented-btn ${tab === k ? "dash-segmented-btn-active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl bg-rose-500/8 px-4 py-2.5 text-[13px] text-rose-600">
          {error}
        </p>
      )}

      {tab === "list" && (
        <DealListView
          deals={filtered.filter(
            (d) => !CLOSED_STAGES.includes(d.stage as (typeof CLOSED_STAGES)[number]),
          )}
          stageLabels={stageLabels}
          onSelect={openDrawer}
        />
      )}

      {tab === "closed" && (
        <DealListView
          deals={closedDeals}
          stageLabels={stageLabels}
          onSelect={openDrawer}
        />
      )}

      {tab === "board" && (
        <>
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
              {OPEN_COLUMNS.map((col) => (
                <Column
                  key={col.key}
                  col={col}
                  deals={byStage[col.key] ?? []}
                  contacts={contactList}
                  listings={listings}
                  onCreated={handleCreated}
                  onContactCreated={handleContactCreated}
                  onSelect={openDrawer}
                />
              ))}
            </div>
            <DragOverlay>
              {activeDeal ? (
                <Card deal={activeDeal} stageLabels={stageLabels} overlay />
              ) : null}
            </DragOverlay>
          </DndContext>

          <div className="dash-surface mt-6 p-2">
            <button
              onClick={() => setShowClosed(!showClosed)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-[13px] font-semibold text-ink/50 transition-colors hover:bg-ink/[0.03] hover:text-ink/70"
            >
              <span>Bitti — kazanılan / kaybedilen</span>
              <ChevronDown size={18} className={`transition-transform ${showClosed ? "rotate-180" : ""}`} />
            </button>
            <div className={`grid grid-cols-2 gap-3 transition-all ${showClosed ? "mt-2" : "mt-2 opacity-80"}`}>
              <DropCloseZone
                id="CLOSED_WON"
                label={stageLabels.CLOSED_WON}
                color="#b4652a"
                deals={showClosed ? byStage.CLOSED_WON : []}
                stageLabels={stageLabels}
                onSelect={openDrawer}
                onDrop={(id) => {
                  patchDeal(id, {
                    stage: "CLOSED_WON",
                    stageChangedAt: new Date().toISOString(),
                  });
                  setShowClosed(true);
                }}
              />
              <DropCloseZone
                id="CLOSED_LOST"
                label={stageLabels.CLOSED_LOST}
                color="#c8beb4"
                hint={!showClosed ? "Sürükleyip bırakın" : undefined}
                deals={showClosed ? byStage.CLOSED_LOST : []}
                stageLabels={stageLabels}
                onSelect={openDrawer}
                onDrop={(id) => {
                  patchDeal(id, {
                    stage: "CLOSED_LOST",
                    stageChangedAt: new Date().toISOString(),
                  });
                  setShowClosed(true);
                }}
              />
            </div>
          </div>
        </>
      )}

      <DealDrawer
        deal={drawerDeal}
        stageLabels={stageLabels}
        listingLabel={v.labels.listing}
        open={!!drawerDeal}
        onClose={() => setDrawerDeal(null)}
        onStageChange={async (id, stage, lostReason) => {
          await patchDeal(id, {
            stage,
            lostReason: lostReason ?? null,
            stageChangedAt: new Date().toISOString(),
          });
          if (stage === "CLOSED_WON" || stage === "CLOSED_LOST") {
            setShowClosed(true);
          }
        }}
        onDelete={async (id) => {
          const res = await fetch(`/api/deals/${id}`, { method: "DELETE" });
          if (res.ok) {
            setDeals((ds) => ds.filter((d) => d.id !== id));
            setDrawerDeal(null);
          }
        }}
        activities={drawerActivities}
        onAddNote={addDealNote}
      />
    </div>
  );
}

function Column({
  col,
  deals,
  contacts,
  listings,
  onCreated,
  onContactCreated,
  onSelect,
}: {
  col: { key: string; label: string; accent: string };
  deals: DealCard[];
  contacts: ContactOption[];
  listings: ListingOption[];
  onCreated: (d: DealCard) => void;
  onContactCreated: (c: ContactOption) => void;
  onSelect: (d: DealCard) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  const total = deals.reduce((s, d) => s + (d.value ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-2xl p-2 transition-colors ${
        isOver ? "bg-brand-50 ring-2 ring-brand-500/30" : ""
      }`}
    >
      <div className="mb-3 flex items-baseline justify-between gap-2 px-1 pb-2">
        <div className="flex items-baseline gap-2">
          <h3 className="text-[13px] font-semibold">{col.label}</h3>
          <span className="text-[11px] tabular-nums text-ink/40">{deals.length}</span>
        </div>
        {total > 0 && (
          <span className="text-[11px] font-medium tabular-nums text-ink/40">
            {trMoney.format(total)}
          </span>
        )}
      </div>
      <div className="flex min-h-24 flex-col gap-2">
        {deals.map((d) => (
          <DraggableCard
            key={d.id}
            deal={d}
            stageLabels={{}}
            onSelect={onSelect}
          />
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

function DraggableCard({
  deal,
  stageLabels,
  onSelect,
}: {
  deal: DealCard;
  stageLabels: Record<string, string>;
  onSelect: (d: DealCard) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: deal.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={isDragging ? "opacity-40" : ""}
    >
      <div {...attributes} {...listeners}>
        <Card deal={deal} stageLabels={stageLabels} onClick={() => onSelect(deal)} />
      </div>
    </div>
  );
}

function Card({
  deal,
  stageLabels,
  overlay = false,
  onClick,
}: {
  deal: DealCard;
  stageLabels: Record<string, string>;
  overlay?: boolean;
  onClick?: () => void;
}) {
  const col = STAGE_COLOR[deal.stage];
  const days = daysInStage(deal.stageChangedAt);
  const stale =
    days >= 7 && !["CLOSED_WON", "CLOSED_LOST"].includes(deal.stage);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className={`dash-deal-card active:cursor-grabbing ${
        stale ? "dash-deal-card-stale" : ""
      } ${overlay ? "rotate-2 shadow-lg" : ""}`}
    >
      <div className="h-1" style={{ background: col ?? "#c7d6c2" }} />
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-ink">
            {deal.contact?.fullName ?? "İsimsiz fırsat"}
          </p>
          <GripVertical size={14} className="mt-0.5 shrink-0 text-ink/25" />
        </div>
        {stale && (
          <span className="mt-1 inline-block rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
            {days} gün
          </span>
        )}
        {deal.listing && (
          <p className="mt-1 line-clamp-1 text-[11px] text-ink/45">
            <span className="text-[10px] text-ink/35">{deal.listing.refCode}</span>{" "}
            {deal.listing.title}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="font-display text-[14px] font-bold tabular-nums text-brand-700">
            {deal.value != null ? trMoney.format(deal.value) : "—"}
          </span>
          {deal.contact?.phone && (
            <a
              href={`tel:${deal.contact.phone}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="rounded-lg p-1.5 text-ink/45 hover:bg-brand-50 hover:text-brand-600"
              aria-label="Ara"
            >
              <Phone size={14} />
            </a>
          )}
        </div>
        {deal.agent && (
          <p className="mt-1.5 text-[10px] font-medium text-ink/35">{deal.agent.name}</p>
        )}
      </div>
    </div>
  );
}

function DropCloseZone({
  id,
  label,
  color,
  hint,
  deals = [],
  stageLabels = {},
  onDrop,
  onSelect,
}: {
  id: string;
  label: string;
  color: string;
  hint?: string;
  deals?: DealCard[];
  stageLabels?: Record<string, string>;
  onDrop?: (dealId: string) => void;
  onSelect?: (d: DealCard) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 rounded-2xl border-2 border-dashed p-3 transition-colors ${
        isOver ? "border-brand-500 bg-brand-50/50" : "border-ink/10 bg-white/60"
      }`}
      style={{ borderColor: isOver ? undefined : color + "66", minHeight: "68px" }}
    >
      <div className="text-center">
        <p className="text-sm font-bold" style={{ color }}>
          {label} {deals.length > 0 ? `(${deals.length})` : ""}
        </p>
        {hint && deals.length === 0 && <p className="mt-0.5 text-[11px] text-ink/45">{hint}</p>}
      </div>
      {deals.length > 0 && (
        <div className="mt-2 grid grid-cols-1 gap-2 xl:grid-cols-2">
          {deals.map((d) => (
            <Card key={d.id} deal={d} stageLabels={stageLabels} onClick={() => onSelect?.(d)} />
          ))}
        </div>
      )}
    </div>
  );
}

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
        setFormError("Müşteri oluşturulamadı.");
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
      onCreated({
        ...data.deal,
        value: data.deal.value ? Number(data.deal.value) : null,
        stageChangedAt: data.deal.stageChangedAt ?? new Date().toISOString(),
      });
      reset();
    } else {
      setFormError("Fırsat oluşturulamadı.");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-ink/15 py-2.5 text-[12px] font-semibold text-ink/40 hover:border-brand-500/40 hover:text-brand-600"
      >
        <Plus size={14} /> Fırsat ekle
      </button>
    );
  }

  const sel = "dash-input text-[12px]";

  return (
    <div className="space-y-2 rounded-2xl bg-white/90 p-3 shadow-sm ring-1 ring-ink/[0.05]">
      <select className={sel} value={contactId} onChange={(e) => setContactId(e.target.value)}>
        <option value="">Müşteri seç *</option>
        <option value="__new">＋ Yeni müşteri</option>
        {contacts.map((c) => (
          <option key={c.id} value={c.id}>{c.fullName}</option>
        ))}
      </select>
      {isNewContact && (
        <>
          <input className={sel} placeholder="Ad Soyad *" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input className={sel} type="tel" placeholder="Telefon" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
        </>
      )}
      <select className={sel} value={listingId} onChange={(e) => setListingId(e.target.value)}>
        <option value="">İlan (opsiyonel)</option>
        {listings.map((l) => (
          <option key={l.id} value={l.id}>{l.refCode} — {l.title}</option>
        ))}
      </select>
      <input type="number" className={sel} placeholder="Beklenen bedel (₺)" value={value} onChange={(e) => setValue(e.target.value)} min={0} />
      {formError && <p className="text-[11px] text-rose-600">{formError}</p>}
      <div className="flex gap-2">
        <button onClick={handleCreate} disabled={saving || !canSubmit} className="dash-btn-primary flex-1 justify-center py-1.5 text-[12px] disabled:opacity-50">
          {saving ? "…" : "Ekle"}
        </button>
        <button onClick={reset} className="dash-btn-secondary flex-1 justify-center py-1.5 text-[12px]">Vazgeç</button>
      </div>
    </div>
  );
}
