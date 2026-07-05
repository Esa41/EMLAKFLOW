"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X, LogOut, Store, ExternalLink } from "lucide-react";
import { NAV } from "./nav-items";

export function MobileNav({
  tenantName,
  userName,
  showcaseSlug,
}: {
  tenantName: string;
  userName: string;
  showcaseSlug?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl p-2 text-ink/65 transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        aria-label="Menüyü aç"
      >
        <Menu size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="glass absolute inset-y-0 left-0 flex w-72 flex-col border-r border-white/60 shadow-2xl">
            <div className="flex items-center justify-between px-5 pb-4 pt-5">
              <div className="flex items-center gap-3">
                <div className="btn-selvi flex h-9 w-9 items-center justify-center rounded-xl font-extrabold text-white">
                  E
                </div>
                <div>
                  <p className="font-display font-extrabold tracking-tight">
                    EmlakFlow
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
                    {tenantName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-ink/55 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
                aria-label="Menüyü kapat"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
                      active
                        ? "bg-brand-600 text-white"
                        : "text-ink/65 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {showcaseSlug && (
              <div className="px-3 pb-2">
                <a
                  href={`/ofis/${showcaseSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-brand-600/40 px-3 py-3 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
                >
                  <Store size={18} />
                  Vitrini Gör
                  <ExternalLink size={13} className="ml-auto text-brand-600/60" />
                </a>
              </div>
            )}

            <div className="border-t border-ink/15 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">{userName}</p>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="rounded-lg p-2 text-ink/45 hover:bg-rose-50 hover:text-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400"
                  aria-label="Çıkış yap"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
