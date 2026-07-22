"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Building2,
  Contact as ContactIcon,
  CornerDownLeft,
  type LucideIcon,
} from "lucide-react";
import { getNav } from "@/components/nav-items";

type SearchResult = {
  type: "listing" | "contact";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

type FlatItem = {
  key: string;
  label: string;
  sub?: string;
  href: string;
  Icon: LucideIcon;
};

/** Türkçe-duyarlı küçük harf (İ/ı) — yerel arama filtresi için. */
const norm = (s: string) => s.toLocaleLowerCase("tr");

export function CommandPalette({ vertical }: { vertical: string }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const [isMac, setIsMac] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof navigator !== "undefined") {
      setIsMac(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent));
    }
  }, []);

  // Statik komutlar: hızlı işlem + navigasyon (dikeye göre etiketli).
  const staticCommands = useMemo(() => {
    const nav = getNav(vertical);
    const actions: FlatItem[] = [
      { key: "new-listing", label: "Yeni ilan ekle", href: "/portfoy/yeni", Icon: Plus },
    ];
    const pages: FlatItem[] = nav.map((n) => ({
      key: `nav-${n.href}`,
      label: n.label,
      href: n.href,
      Icon: n.icon,
    }));
    return { actions, pages };
  }, [vertical]);

  const openPalette = useCallback(() => {
    restoreFocus.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActive(0);
    restoreFocus.current?.focus?.();
  }, []);

  // Global ⌘K / Ctrl+K.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => {
          if (!v) restoreFocus.current = document.activeElement as HTMLElement | null;
          return !v;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Açılınca input'a odaklan; kapanınca body scroll'u geri ver.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  // Debounce'lu uzak arama (>= 2 karakter).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        setResults(Array.isArray(data.results) ? data.results : []);
      } catch {
        /* abort/hata sessiz */
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  // Görünür düz liste: sonuçlar (uzak) → işlemler → sayfalar (yerel filtre).
  const { flat, groups } = useMemo(() => {
    const q = norm(query.trim());
    const match = (i: FlatItem) => q === "" || norm(i.label).includes(q);

    const remote: FlatItem[] = results.map((r) => ({
      key: `${r.type}-${r.id}`,
      label: r.title,
      sub: r.subtitle,
      href: r.href,
      Icon: r.type === "listing" ? Building2 : ContactIcon,
    }));
    const actions = staticCommands.actions.filter(match);
    const pages = staticCommands.pages.filter(match);

    const g: { title: string; items: FlatItem[] }[] = [];
    if (remote.length) g.push({ title: "Sonuçlar", items: remote });
    if (actions.length) g.push({ title: "Hızlı işlem", items: actions });
    if (pages.length) g.push({ title: "Sayfalar", items: pages });

    return { flat: g.flatMap((x) => x.items), groups: g };
  }, [results, query, staticCommands]);

  // Liste değişince aktif index'i sınırla.
  useEffect(() => {
    setActive((a) => (flat.length === 0 ? 0 : Math.min(a, flat.length - 1)));
  }, [flat.length]);

  const go = useCallback(
    (href: string) => {
      closePalette();
      router.push(href);
    },
    [router, closePalette],
  );

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (flat.length ? (a + 1) % flat.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[active];
      if (item) go(item.href);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closePalette();
    }
  };

  // Aktif satırı görünür tut.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const modKey = isMac ? "⌘" : "Ctrl";

  // Header'daki arama input'unun yerine geçen tetikleyici (görsel olarak aynı).
  const trigger = (
    <button
      type="button"
      onClick={openPalette}
      className="dash-input hidden w-72 items-center gap-2 rounded-full text-left text-ink/40 sm:flex"
      aria-label="Ara (komut paleti)"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">İlan, müşteri veya künye ara…</span>
      <kbd className="rounded border border-[var(--app-border)] px-1.5 py-0.5 text-[10px] font-medium text-ink/40">
        {modKey}K
      </kbd>
    </button>
  );

  const overlay =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closePalette();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Komut paleti"
              className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-2xl"
            >
              <div className="flex items-center gap-2 border-b border-[var(--app-border)] px-4">
                <Search className="h-4 w-4 shrink-0 text-ink/40" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onInputKey}
                  placeholder="İlan, müşteri, sayfa ara veya işlem yaz…"
                  className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink/40"
                  autoComplete="off"
                  spellCheck={false}
                />
                <kbd className="rounded border border-[var(--app-border)] px-1.5 py-0.5 text-[10px] font-medium text-ink/40">
                  esc
                </kbd>
              </div>

              <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
                {flat.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-ink/40">
                    {query.trim().length >= 2 ? "Sonuç bulunamadı." : "Aramaya başlayın…"}
                  </div>
                ) : (
                  groups.map((group) => (
                    <div key={group.title} className="mb-1">
                      <div className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-ink/40">
                        {group.title}
                      </div>
                      {group.items.map((item) => {
                        const idx = flat.indexOf(item);
                        const isActive = idx === active;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            data-idx={idx}
                            onMouseMove={() => setActive(idx)}
                            onClick={() => go(item.href)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                              isActive
                                ? "bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)] text-ink"
                                : "text-ink/80"
                            }`}
                          >
                            <item.Icon className="h-4 w-4 shrink-0 text-ink/50" />
                            <span className="flex-1 truncate">
                              {item.label}
                              {item.sub ? (
                                <span className="ml-2 text-ink/40">{item.sub}</span>
                              ) : null}
                            </span>
                            {isActive ? (
                              <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-ink/40" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {trigger}
      {overlay}
    </>
  );
}
