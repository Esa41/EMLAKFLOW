"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Store, ExternalLink } from "lucide-react";
import { getNav } from "./nav-items";
import { BrandLogo } from "./brand-logo";
import { showcasePath } from "@/lib/url";
import { getVertical } from "@/lib/verticals";

export function Sidebar({
  tenantName,
  userName,
  showcaseSlug,
  vertical = "REAL_ESTATE",
}: {
  tenantName: string;
  userName: string;
  showcaseSlug?: string | null;
  vertical?: string | null;
}) {
  const pathname = usePathname();
  const nav = getNav(vertical);
  const v = getVertical(vertical);

  // Okunmamış rozetler — "/merkez" (bildirim) ve "/ekip" (ekip sohbeti)
  const [unread, setUnread] = useState(0);
  const [teamUnread, setTeamUnread] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () => {
      fetch("/api/notifications?unreadOnly=true")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => alive && d && setUnread(d.unread ?? 0))
        .catch(() => {});
      fetch("/api/chat/team/unread")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => alive && d && setTeamUnread(d.unread ?? 0))
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [pathname]);

  const badgeFor = (href: string) =>
    href === "/merkez" ? unread : href === "/ekip" ? teamUnread : 0;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-[var(--app-border)] bg-[var(--app-sidebar-bg)] backdrop-blur-2xl lg:flex">
      <div className="px-5 pb-4 pt-7">
        <BrandLogo vertical={vertical} className="text-xl" />
        <p className="mt-1.5 truncate text-[12px] font-medium text-ink/40">
          {tenantName}
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          const badge = badgeFor(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[14px] font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
                active
                  ? "bg-[var(--app-input-bg)] text-ink shadow-sm"
                  : "text-ink/55 hover:bg-[var(--app-input-bg)] hover:text-ink"
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2.25 : 1.75} />
              {label}
              {badge > 0 && (
                <span
                  className={`ml-auto min-w-[18px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold leading-none ${
                    active ? "bg-brand-600 text-white" : "bg-brand-600 text-white"
                  }`}
                >
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {showcaseSlug && (
        <div className="px-3 pb-2">
          <a
            href={showcasePath(showcaseSlug, vertical)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-xl border border-brand-600/15 bg-brand-50/50 px-3 py-2.5 text-[13px] font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-500 dark:hover:bg-brand-500/15"
          >
            <Store size={16} />
            {v.labels.showcase} Gör
            <ExternalLink size={12} className="ml-auto text-brand-600/50" />
          </a>
        </div>
      )}

      <div className="border-t border-[var(--app-border)] p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold">{userName}</p>
            <p className="text-[11px] font-medium text-ink/35">Oturum açık</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="shrink-0 rounded-xl p-2 text-ink/30 transition-colors hover:bg-[var(--app-input-bg)] hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 dark:hover:text-red-400"
            aria-label="Çıkış yap"
          >
            <LogOut size={17} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}
