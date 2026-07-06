"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Trash2,
  Eye,
  UserPlus,
  GitMerge,
  MessageCircle,
  Handshake,
  FileText,
  CalendarClock,
  UsersRound,
  Cog,
  AlertTriangle,
  Info,
  Zap,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

/* ── Tipler ── */
interface Notification {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  category: string;
  severity: string;
  createdAt: string;
}

interface ApiResponse {
  notifications: Notification[];
  total: number;
  totalPages: number;
  page: number;
  unread: number;
}

/* ── Sabitler ── */
const CATEGORIES = [
  { key: "all", label: "Tümü", icon: Bell },
  { key: "lead", label: "Lead'ler", icon: UserPlus },
  { key: "match", label: "Eşleşmeler", icon: GitMerge },
  { key: "chat", label: "Sohbet", icon: MessageCircle },
  { key: "team", label: "Ekip", icon: UsersRound },
  { key: "deal", label: "Fırsatlar", icon: Handshake },
  { key: "contract", label: "Sözleşmeler", icon: FileText },
  { key: "appointment", label: "Randevular", icon: CalendarClock },
  { key: "system", label: "Sistem", icon: Cog },
] as const;

const SEVERITY_ICON: Record<string, typeof Info> = {
  info: Info,
  action: Zap,
  urgent: AlertTriangle,
};

const SEVERITY_STYLE: Record<string, string> = {
  info: "text-slate-500",
  action: "text-brand-600",
  urgent: "text-rose-500",
};

const CATEGORY_ICON: Record<string, typeof Bell> = {
  lead: UserPlus,
  match: GitMerge,
  chat: MessageCircle,
  team: UsersRound,
  deal: Handshake,
  contract: FileText,
  appointment: CalendarClock,
  system: Cog,
};

const CATEGORY_COLOR: Record<string, string> = {
  lead: "bg-emerald-50 text-emerald-600",
  match: "bg-violet-50 text-violet-600",
  chat: "bg-sky-50 text-sky-600",
  team: "bg-teal-50 text-teal-600",
  deal: "bg-amber-50 text-amber-600",
  contract: "bg-indigo-50 text-indigo-600",
  appointment: "bg-rose-50 text-rose-600",
  system: "bg-slate-100 text-slate-500",
};

/* ── Zaman yardımcıları ── */
function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "az önce";
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`;
  return `${Math.floor(s / 86400)} gün önce`;
}

function dateGroup(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (today.getTime() - itemDay.getTime()) / 86400000;

  if (diff === 0) return "Bugün";
  if (diff === 1) return "Dün";
  if (diff <= 7) return "Bu Hafta";
  return "Önceki";
}

function groupNotifications(items: Notification[]) {
  const groups: { label: string; items: Notification[] }[] = [];
  const order = ["Bugün", "Dün", "Bu Hafta", "Önceki"];

  for (const item of items) {
    const label = dateGroup(item.createdAt);
    let group = groups.find((g) => g.label === label);
    if (!group) {
      group = { label, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }

  groups.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
  return groups;
}

/* ── Ana Bileşen ── */
export function NotificationCenter() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (category !== "all") params.set("category", category);
    if (unreadOnly) params.set("unreadOnly", "true");

    const res = await fetch(`/api/notifications?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [page, category, unreadOnly]);

  useEffect(() => {
    load();
  }, [load]);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    load();
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    load();
  }

  async function deleteOne(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    load();
  }

  // Filtre değiştiğinde sayfa 1'e dön
  function changeCategory(cat: string) {
    setCategory(cat);
    setPage(1);
  }

  function toggleUnread() {
    setUnreadOnly((p) => !p);
    setPage(1);
  }

  const groups = data ? groupNotifications(data.notifications) : [];

  return (
    <div>
      {/* ── Başlık ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Bell size={20} />
          </div>
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-tight">
              Bildirim Merkezi
            </h1>
            {data && data.unread > 0 && (
              <p className="mt-0.5 font-mono text-xs text-ink/50">
                {data.unread} okunmamış bildirim
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data && data.unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 rounded-lg border border-brand-600/30 px-3 py-2 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50"
            >
              <CheckCheck size={14} />
              Tümünü Okundu İşaretle
            </button>
          )}
        </div>
      </div>

      {/* ── Filtre çubuğu ── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Kategori tabları */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => changeCategory(key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                category === key
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-ink/60 hover:bg-brand-50 hover:text-brand-600"
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Okunmadı toggle */}
        <button
          onClick={toggleUnread}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
            unreadOnly
              ? "border-brand-600 bg-brand-50 text-brand-700"
              : "border-ink/15 bg-white text-ink/55 hover:border-brand-600/30 hover:text-brand-600"
          }`}
        >
          <Filter size={13} />
          Sadece okunmamış
        </button>
      </div>

      {/* ── Bildirim Listesi ── */}
      <div className="overflow-hidden rounded-xl border border-ink/15 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <Bell size={40} className="mx-auto mb-3 text-ink/20" />
            <p className="text-sm font-semibold text-ink/50">
              {unreadOnly ? "Okunmamış bildirim yok" : "Henüz bildirim yok"}
            </p>
            <p className="mt-1 text-xs text-ink/35">
              Yeni talep veya eşleşme olduğunda burada göreceksin.
            </p>
          </div>
        ) : (
          <div>
            {groups.map((group) => (
              <div key={group.label}>
                {/* Tarih grup başlığı */}
                <div className="border-b border-ink/[0.06] bg-slate-50/80 px-4 py-2">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/40">
                    {group.label}
                  </p>
                </div>

                <ul className="divide-y divide-ink/[0.06]">
                  {group.items.map((n) => {
                    const CatIcon =
                      CATEGORY_ICON[n.category] ?? Bell;
                    const catColor =
                      CATEGORY_COLOR[n.category] ?? CATEGORY_COLOR.system;
                    const SevIcon = SEVERITY_ICON[n.severity] ?? Info;
                    const sevStyle = SEVERITY_STYLE[n.severity] ?? "";

                    return (
                      <li
                        key={n.id}
                        className={`group relative transition-colors hover:bg-ink/[0.02] ${
                          !n.readAt ? "bg-brand-50/30" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3 px-4 py-3">
                          {/* Okundu dot */}
                          <span
                            className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                              n.readAt ? "bg-slate-200" : "bg-brand-500"
                            }`}
                          />

                          {/* Kategori ikon */}
                          <div
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${catColor}`}
                          >
                            <CatIcon size={15} />
                          </div>

                          {/* İçerik */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                {n.href ? (
                                  <Link
                                    href={n.href}
                                    className={`text-sm hover:underline ${
                                      n.readAt
                                        ? "text-ink/65"
                                        : "font-semibold text-ink"
                                    }`}
                                  >
                                    {n.title}
                                  </Link>
                                ) : (
                                  <p
                                    className={`text-sm ${
                                      n.readAt
                                        ? "text-ink/65"
                                        : "font-semibold text-ink"
                                    }`}
                                  >
                                    {n.title}
                                  </p>
                                )}
                                {n.body && (
                                  <p className="mt-0.5 line-clamp-2 text-xs text-ink/55">
                                    {n.body}
                                  </p>
                                )}
                                <div className="mt-1.5 flex items-center gap-2">
                                  <SevIcon
                                    size={11}
                                    className={sevStyle}
                                  />
                                  <span className="text-[10px] uppercase tracking-wider text-ink/40">
                                    {timeAgo(n.createdAt)}
                                  </span>
                                </div>
                              </div>

                              {/* Aksiyon butonları */}
                              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                {!n.readAt && (
                                  <button
                                    onClick={() => markRead(n.id)}
                                    className="rounded-lg p-1.5 text-ink/30 transition-colors hover:bg-brand-50 hover:text-brand-600"
                                    title="Okundu işaretle"
                                  >
                                    <Eye size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteOne(n.id)}
                                  className="rounded-lg p-1.5 text-ink/30 transition-colors hover:bg-rose-50 hover:text-rose-500"
                                  title="Sil"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* ── Sayfalama ── */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-ink/[0.06] px-4 py-3">
            <p className="font-mono text-xs text-ink/40">
              {data.total} bildirim · Sayfa {data.page}/{data.totalPages}
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
