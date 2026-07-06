"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Phone,
  Users,
  StickyNote,
  Mail,
  MessageSquare,
  ArrowRightLeft,
  Activity,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertTriangle,
  Clock,
  Table2,
} from "lucide-react";

/* ── Tipler ── */
interface ActivityItem {
  id: string;
  type: string;
  userId: string | null;
  user: { name: string } | null;
  entity: string | null;
  entityId: string | null;
  body: string;
  createdAt: string;
}

interface ListResponse {
  activities: ActivityItem[];
  total: number;
  totalPages: number;
  page: number;
}

interface SummaryResponse {
  scope: "team" | "own";
  today: Record<string, number>;
  total: number;
  team?: Array<{ userId: string; name: string; today: number }>;
  passive?: Array<{ userId: string; name: string }>;
}

/* ── Sabitler ── */
const TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof Activity; color: string }
> = {
  CALL: { label: "Arama", icon: Phone, color: "bg-sky-50 text-sky-600" },
  MEETING: { label: "Görüşme", icon: Users, color: "bg-violet-50 text-violet-600" },
  NOTE: { label: "Not", icon: StickyNote, color: "bg-amber-50 text-amber-600" },
  EMAIL: { label: "E-posta", icon: Mail, color: "bg-indigo-50 text-indigo-600" },
  WHATSAPP: {
    label: "WhatsApp",
    icon: MessageSquare,
    color: "bg-emerald-50 text-emerald-600",
  },
  STATUS_CHANGE: {
    label: "Aşama",
    icon: ArrowRightLeft,
    color: "bg-rose-50 text-rose-600",
  },
};
const TYPE_ORDER = ["CALL", "MEETING", "WHATSAPP", "STATUS_CHANGE", "NOTE", "EMAIL"];

const ENTITY_LABELS: Record<string, string> = {
  listing: "İlan",
  deal: "Fırsat",
  lead: "Talep",
  contact: "Müşteri",
};
const ENTITY_HREF: Record<string, string> = {
  listing: "/portfoy",
  deal: "/musteriler",
  lead: "/musteriler",
  contact: "/kisiler",
};

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - dd.getTime()) / 86400000);
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Dün";
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Ana bileşen ── */
export function ActivityCenter({ canViewTeam }: { canViewTeam: boolean }) {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [entity, setEntity] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [view, setView] = useState<"timeline" | "table">("timeline");

  // Özet — bir kez (bugün sabit)
  useEffect(() => {
    fetch("/api/activity-log/summary")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (type) params.set("type", type);
    if (entity) params.set("entity", entity);
    if (canViewTeam && selectedUsers.length) {
      params.set("userIds", selectedUsers.join(","));
    }
    const res = await fetch(`/api/activity-log?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [page, type, entity, selectedUsers, canViewTeam]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleUser(id: string) {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id],
    );
    setPage(1);
  }

  const cards = TYPE_ORDER.filter((k) => TYPE_CONFIG[k]);

  return (
    <div>
      {/* ── Özet kartlar ── */}
      <div className="mb-5">
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">
          {canViewTeam ? "Bugün · tüm ekip" : "Bugün · siz"}
        </p>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {cards.map((k) => {
            const c = TYPE_CONFIG[k];
            const Icon = c.icon;
            const n = summary?.today?.[k] ?? 0;
            return (
              <div
                key={k}
                className="rounded-xl border border-ink/10 bg-white p-3 shadow-sm"
              >
                <div
                  className={`mb-2 flex h-7 w-7 items-center justify-center rounded-lg ${c.color}`}
                >
                  <Icon size={14} />
                </div>
                <p className="font-display text-xl font-extrabold tracking-tight">
                  {n}
                </p>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink/45">
                  {c.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pasif danışman uyarısı (yönetici) ── */}
      {canViewTeam && summary?.passive && summary.passive.length > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            Bugün faaliyeti olmayan:{" "}
            <span className="font-semibold">
              {summary.passive.map((p) => p.name).join(", ")}
            </span>
          </span>
        </div>
      )}

      {/* ── Danışman filtresi (yönetici) ── */}
      {canViewTeam && summary?.team && summary.team.length > 1 && (
        <div className="mb-4">
          <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">
            Danışman
          </p>
          <div className="flex flex-wrap gap-1.5">
            {summary.team.map((u) => {
              const on = selectedUsers.includes(u.userId);
              return (
                <button
                  key={u.userId}
                  type="button"
                  onClick={() => toggleUser(u.userId)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    on
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-ink/15 bg-white text-ink/60 hover:border-brand-400"
                  }`}
                >
                  {u.name}
                  <span className={on ? "text-white/70" : "text-ink/35"}>
                    {" "}
                    · {u.today}
                  </span>
                </button>
              );
            })}
            {selectedUsers.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedUsers([]);
                  setPage(1);
                }}
                className="rounded-full px-2.5 py-1 text-xs font-medium text-ink/45 hover:text-ink"
              >
                Temizle
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Tür filtresi + görünüm değiştirici ── */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setType("");
              setPage(1);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              type === ""
                ? "border-ink/70 bg-ink text-white"
                : "border-ink/15 bg-white text-ink/60 hover:border-ink/40"
            }`}
          >
            Tümü
          </button>
          {TYPE_ORDER.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setType(k);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                type === k
                  ? "border-ink/70 bg-ink text-white"
                  : "border-ink/15 bg-white text-ink/60 hover:border-ink/40"
              }`}
            >
              {TYPE_CONFIG[k].label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-ink/15 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setView("timeline")}
            aria-pressed={view === "timeline"}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              view === "timeline" ? "bg-brand-600 text-white" : "text-ink/55"
            }`}
          >
            <Clock size={13} /> Zaman
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            aria-pressed={view === "table"}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              view === "table" ? "bg-brand-600 text-white" : "text-ink/55"
            }`}
          >
            <Table2 size={13} /> Tablo
          </button>
        </div>
      </div>

      {/* ── İçerik ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      ) : !data || data.activities.length === 0 ? (
        <div className="rounded-xl border border-ink/15 bg-white px-6 py-20 text-center shadow-sm">
          <Search size={40} className="mx-auto mb-3 text-ink/20" />
          <p className="text-sm font-semibold text-ink/50">Kayıt bulunamadı</p>
          <p className="mt-1 text-xs text-ink/35">
            Faaliyetler (arama, görüşme, not, aşama değişimi) burada listelenir.
          </p>
        </div>
      ) : view === "timeline" ? (
        <Timeline activities={data.activities} showUser={canViewTeam} />
      ) : (
        <TableView activities={data.activities} showUser={canViewTeam} />
      )}

      {/* ── Sayfalama ── */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="font-mono text-xs text-ink/40">
            {data.total} kayıt · Sayfa {data.page}/{data.totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-ink/15 p-1.5 text-ink/40 transition hover:bg-brand-50 hover:text-brand-600 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-ink/15 p-1.5 text-ink/40 transition hover:bg-brand-50 hover:text-brand-600 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Zaman çizelgesi ── */
function Timeline({
  activities,
  showUser,
}: {
  activities: ActivityItem[];
  showUser: boolean;
}) {
  // Güne göre grupla
  const groups: Array<{ label: string; items: ActivityItem[] }> = [];
  for (const a of activities) {
    const label = dayLabel(a.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(a);
    else groups.push({ label, items: [a] });
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">
            {g.label}
          </p>
          <div className="ml-1.5 border-l border-ink/15">
            {g.items.map((a) => {
              const c = TYPE_CONFIG[a.type] ?? {
                label: a.type,
                icon: Activity,
                color: "bg-slate-100 text-slate-500",
              };
              const Icon = c.icon;
              const entityHref =
                a.entity && a.entityId
                  ? `${ENTITY_HREF[a.entity] ?? ""}/${a.entityId}`
                  : null;
              const entityLabel = a.entity
                ? ENTITY_LABELS[a.entity] ?? a.entity
                : null;
              return (
                <div key={a.id} className="relative py-2.5 pl-5">
                  <span
                    className={`absolute -left-[9px] top-3 flex h-[18px] w-[18px] items-center justify-center rounded-full ring-2 ring-paper ${c.color}`}
                  >
                    <Icon size={10} />
                  </span>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-ink/85">{a.body}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink/45">
                        <span className="font-medium text-ink/60">{c.label}</span>
                        {showUser && <span>· {a.user?.name ?? "Sistem"}</span>}
                        {entityLabel && entityHref && (
                          <Link
                            href={entityHref}
                            className="text-brand-600 hover:underline"
                          >
                            · {entityLabel}
                          </Link>
                        )}
                      </div>
                    </div>
                    <time
                      dateTime={a.createdAt}
                      className="shrink-0 font-mono text-[11px] text-ink/40"
                    >
                      {timeOf(a.createdAt)}
                    </time>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Tablo görünümü ── */
function TableView({
  activities,
  showUser,
}: {
  activities: ActivityItem[];
  showUser: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink/15 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink/[0.06] bg-slate-50/80">
              {["Tür", "Açıklama", ...(showUser ? ["Danışman"] : []), "Kaynak", "Tarih"].map(
                (h) => (
                  <th key={h} className="px-4 py-3 text-left">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/40">
                      {h}
                    </span>
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/[0.06]">
            {activities.map((a) => {
              const c = TYPE_CONFIG[a.type] ?? {
                label: a.type,
                icon: Activity,
                color: "bg-slate-100 text-slate-500",
              };
              const Icon = c.icon;
              const entityHref =
                a.entity && a.entityId
                  ? `${ENTITY_HREF[a.entity] ?? ""}/${a.entityId}`
                  : null;
              const entityLabel = a.entity
                ? ENTITY_LABELS[a.entity] ?? a.entity
                : null;
              return (
                <tr key={a.id} className="transition-colors hover:bg-ink/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${c.color}`}
                      >
                        <Icon size={13} />
                      </div>
                      <span className="text-xs font-medium text-ink/70">
                        {c.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="line-clamp-2 text-sm text-ink/80">{a.body}</p>
                  </td>
                  {showUser && (
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-ink/70">
                        {a.user?.name ?? "Sistem"}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    {entityLabel && entityHref ? (
                      <Link
                        href={entityHref}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-100"
                      >
                        {entityLabel}
                        <ChevronRight size={11} />
                      </Link>
                    ) : (
                      <span className="text-xs text-ink/35">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-ink/50">
                      {dayLabel(a.createdAt)} {timeOf(a.createdAt)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
