"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X, LogOut, Store, ExternalLink } from "lucide-react";
import { getNav } from "./nav-items";
import { BrandLogo, BrandMark } from "./brand-logo";
import { showcasePath } from "@/lib/url";
import { getVertical } from "@/lib/verticals";

export function MobileNav({
  tenantName,
  userName,
  showcaseSlug,
  vertical = "REAL_ESTATE",
  whiteLabelName,
}: {
  tenantName: string;
  userName: string;
  showcaseSlug?: string | null;
  vertical?: string | null;
  whiteLabelName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  // Portal hedefi — header'daki backdrop-filter, fixed paneli hapsettiği için
  // çekmece app-shell köküne taşınır (tema değişkenleri korunur)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalTarget(
      (document.querySelector(".app-shell") as HTMLElement) ?? document.body,
    );
  }, []);
  const pathname = usePathname();
  const nav = getNav(vertical);
  const v = getVertical(vertical);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl p-2 text-ink/65 transition-colors hover:bg-[var(--app-input-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        aria-label="Menüyü aç"
      >
        <Menu size={22} />
      </button>

      {open && portalTarget && createPortal(
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-[var(--app-overlay)] backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="glass absolute inset-y-0 left-0 flex w-72 flex-col border-r border-[var(--app-border)] shadow-2xl">
            <div className="flex items-center justify-between px-5 pb-4 pt-5">
              <div className="flex items-center gap-3">
                <BrandMark
                  vertical={vertical}
                  size="sm"
                  whiteLabelName={whiteLabelName}
                />
                <div>
                  <BrandLogo
                    vertical={vertical}
                    whiteLabelName={whiteLabelName}
                  />
                  {!whiteLabelName && (
                    <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">
                      {tenantName}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-ink/55 hover:bg-[var(--app-input-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
                aria-label="Menüyü kapat"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3">
              {nav.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
                      active
                        ? "bg-brand-600 text-white"
                        : "text-ink/65 hover:bg-[var(--app-input-bg)] hover:text-ink"
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
                  href={showcasePath(showcaseSlug, vertical)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-brand-600/40 px-3 py-3 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 dark:border-brand-500/30 dark:text-brand-500 dark:hover:bg-brand-500/10"
                >
                  <Store size={18} />
                  {v.labels.showcase} Gör
                  <ExternalLink size={13} className="ml-auto text-brand-600/60" />
                </a>
              </div>
            )}

            <div className="border-t border-[var(--app-border)] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">{userName}</p>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="rounded-lg p-2 text-ink/45 hover:bg-red-500/10 hover:text-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
                  aria-label="Çıkış yap"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>,
        portalTarget,
      )}
    </div>
  );
}
