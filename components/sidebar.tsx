"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Store, ExternalLink } from "lucide-react";
import { getNav } from "./nav-items";
import { BrandLogo } from "./brand-logo";
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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-ink/90 bg-paper lg:flex">
      <div className="border-b border-ink/15 px-6 pb-5 pt-6">
        <BrandLogo vertical={vertical} className="text-xl" />
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">
          {tenantName}
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pt-4">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          const badge = badgeFor(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
                active
                  ? "bg-brand-600 text-white"
                  : "text-ink/65 hover:bg-white hover:text-ink"
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2.4 : 2} />
              {label}
              {badge > 0 && (
                <span
                  className={`ml-auto min-w-[18px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold leading-none ${
                    active ? "bg-white text-brand-700" : "bg-brand-600 text-white"
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
            href={`${v.showcaseBase}/${showcaseSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-dashed border-brand-600/40 px-3 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            <Store size={17} />
            {v.labels.showcase} Gör
            <ExternalLink size={13} className="ml-auto text-brand-600/60" />
          </a>
        </div>
      )}

      <div className="border-t border-ink/15 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">{userName}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink/40">
              Oturum açık
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg p-2 text-ink/40 transition-colors hover:bg-white hover:text-[#c13515] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c13515]"
            aria-label="Çıkış yap"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}
