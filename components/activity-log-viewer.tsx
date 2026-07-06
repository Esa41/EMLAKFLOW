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
  Calendar,
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

interface ApiResponse {
  activities: ActivityItem[];
  total: number;
  totalPages: number;
  page: number;
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
    label: "Durum Değişikliği",
    icon: ArrowRightLeft,
    color: "bg-rose-50 text-rose-600",
  },
};

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Ana Bileşen ── */
export function ActivityLogViewer() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [entity, setEntity] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (type) params.set("type", type);
    if (entity) params.set("entity", entity);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);

    const res = await fetch(`/api/activity-log?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [page, type, entity, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  function resetFilters() {
    setType("");
    setEntity("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const hasFilters = type || entity || dateFrom || dateTo;

  return (
    <div>
      {/* ── Başlık ── */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Activity size={20} />
        </div>
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight">
            Faaliyet Geçmişi
          </h1>
          {data && (
            <p className="mt-0.5 font-mono text-xs text-ink/50">
              {data.total} kayıt
            </p>
          )}
        </div>
      </div>

      {/* ── Filtreler ── */}
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-ink/15 bg-white p-4 shadow-sm">
        {/* Tür */}
        <div className="min-w-[140px]">
          <label className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">
            Tür
          </label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            <option value="">Tümü</option>
            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {/* Varlık */}
        <div className="min-w-[130px]">
          <label className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">
            Kaynak
          </label>
          <select
            value={entity}
            onChange={(e) => {
              setEntity(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            <option value="">Tümü</option>
            {Object.entries(ENTITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Tarih aralığı */}
        <div className="min-w-[140px]">
          <label className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">
            Başlangıç
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">
            Bitiş
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </div>

        {/* Temizle */}
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="rounded-lg border border-ink/15 px-3 py-2 text-xs font-medium text-ink/55 transition-colors hover:bg-slate-50 hover:text-ink"
          >
            Temizle
          </button>
        )}
      </div>

      {/* ── Log Tablosu ── */}
      <div className="overflow-hidden rounded-xl border border-ink/15 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          </div>
        ) : !data || data.activities.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <Search size={40} className="mx-auto mb-3 text-ink/20" />
            <p className="text-sm font-semibold text-ink/50">
              Kayıt bulunamadı
            </p>
            <p className="mt-1 text-xs text-ink/35">
              {hasFilters
                ? "Farklı filtreler deneyin."
                : "Sistem logları burada görünecek."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink/[0.06] bg-slate-50/80">
                  <th className="px-4 py-3 text-left">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/40">
                      Tür
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/40">
                      Açıklama
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/40">
                      Kullanıcı
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/40">
                      Kaynak
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/40">
                      Tarih
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.06]">
                {data.activities.map((act) => {
                  const config = TYPE_CONFIG[act.type] ?? {
                    label: act.type,
                    icon: Activity,
                    color: "bg-slate-100 text-slate-500",
                  };
                  const TypeIcon = config.icon;
                  const entityLabel = act.entity
                    ? ENTITY_LABELS[act.entity] ?? act.entity
                    : null;
                  const entityHref =
                    act.entity && act.entityId
                      ? `${ENTITY_HREF[act.entity] ?? ""}/${act.entityId}`
                      : null;

                  return (
                    <tr
                      key={act.id}
                      className="transition-colors hover:bg-ink/[0.02]"
                    >
                      {/* Tür */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${config.color}`}
                          >
                            <TypeIcon size={13} />
                          </div>
                          <span className="text-xs font-medium text-ink/70">
                            {config.label}
                          </span>
                        </div>
                      </td>

                      {/* Açıklama */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-ink/80 line-clamp-2">
                          {act.body}
                        </p>
                      </td>

                      {/* Kullanıcı */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-ink/70">
                          {act.user?.name ?? "Sistem"}
                        </span>
                      </td>

                      {/* Kaynak */}
                      <td className="px-4 py-3">
                        {entityLabel && entityHref ? (
                          <Link
                            href={entityHref}
                            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-100"
                          >
                            {entityLabel}
                            <ChevronRight size={11} />
                          </Link>
                        ) : (
                          <span className="text-xs text-ink/35">—</span>
                        )}
                      </td>

                      {/* Tarih */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-ink/50">
                          <Calendar size={11} />
                          <time dateTime={act.createdAt}>
                            {formatDate(act.createdAt)}
                          </time>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Sayfalama ── */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-ink/[0.06] px-4 py-3">
            <p className="font-mono text-xs text-ink/40">
              {data.total} kayıt · Sayfa {data.page}/{data.totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg p-1.5 text-ink/40 transition-colors hover:bg-brand-50 hover:text-brand-600 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg p-1.5 text-ink/40 transition-colors hover:bg-brand-50 hover:text-brand-600 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
