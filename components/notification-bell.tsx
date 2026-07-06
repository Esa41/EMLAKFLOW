"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { NotificationRow } from "@/components/notification-row";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "az önce";
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`;
  return `${Math.floor(s / 86400)} gün önce`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setItems(data.notifications);
      setUnread(data.unread);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setUnread(0);
    setItems((xs) =>
      xs.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })),
    );
  }

  function onItemRead(id: string) {
    setUnread((u) => Math.max(0, u - 1));
    setItems((xs) =>
      xs.map((x) =>
        x.id === id ? { ...x, readAt: x.readAt ?? new Date().toISOString() } : x,
      ),
    );
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2 text-ink/55 transition-colors hover:bg-white hover:text-ink/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        aria-label={`Bildirimler${unread ? ` (${unread} okunmamış)` : ""}`}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 font-mono text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="glass absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-white/60 shadow-lg">
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
            <h3 className="text-sm font-bold">Bildirimler</h3>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                <CheckCheck size={13} /> Tümünü okundu işaretle
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink/45">
                Henüz bildirim yok.
              </p>
            ) : (
              <ul className="divide-y divide-ink/[0.06]">
                {items.map((n) => (
                  <li key={n.id}>
                    <NotificationRow
                      id={n.id}
                      href={n.href}
                      readAt={n.readAt}
                      onRead={() => onItemRead(n.id)}
                      className="hover:bg-ink/[0.04]"
                    >
                      <div className="flex gap-3 px-4 py-3">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            n.readAt ? "bg-slate-200" : "bg-brand-500"
                          }`}
                        />
                        <div className="min-w-0">
                          <p
                            className={`text-sm ${n.readAt ? "text-ink/65" : "font-semibold text-ink"}`}
                          >
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-ink/55">
                              {n.body}
                            </p>
                          )}
                          <p className="mt-1 text-[10px] uppercase tracking-wider text-ink/45">
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    </NotificationRow>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            href="/merkez"
            onClick={() => setOpen(false)}
            className="block border-t border-ink/10 px-4 py-2.5 text-center text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            Bildirimler &amp; Faaliyet&apos;e git →
          </Link>
        </div>
      )}
    </div>
  );
}
