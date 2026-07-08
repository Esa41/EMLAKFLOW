"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Vitrin oturumu client tarafında tek fetch ile yüklenir
 * (GET /api/ofis/[slug]/auth/session → kullanıcı + favori id listesi).
 * Sayfalar cookie okumadığı için ilan detayı ISR ile CDN'den servis edilebilir;
 * kullanıcıya özel kısımlar (antet, kalp ikonları) hydration sonrası dolar.
 */

type SiteSessionValue = {
  /** İlk fetch tamamlandı mı — false iken kalpler nötr çizilir */
  ready: boolean;
  user: { name: string } | null;
  favorites: Set<string>;
  refresh: () => Promise<void>;
  /** Optimistic toggle; sunucu reddederse gerçek duruma geri döner */
  toggleFavorite: (listingId: string) => Promise<void>;
};

const SiteSessionContext = createContext<SiteSessionValue>({
  ready: false,
  user: null,
  favorites: new Set(),
  refresh: async () => {},
  toggleFavorite: async () => {},
});

export function useSiteSession() {
  return useContext(SiteSessionContext);
}

export function SiteSessionProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/ofis/${slug}/auth/session`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUser(data.user ?? null);
      setFavorites(new Set<string>(data.favorites ?? []));
    } catch {
      // Ağ hatasında oturumsuz devam — vitrin gezilebilir kalmalı
      setUser(null);
      setFavorites(new Set());
    } finally {
      setReady(true);
    }
  }, [slug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleFavorite = useCallback(
    async (listingId: string) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(listingId)) next.delete(listingId);
        else next.add(listingId);
        return next;
      });
      const res = await fetch(`/api/ofis/${slug}/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      // Reddedilirse (oturum düşmüş vs.) sunucu gerçeğine dön
      if (!res.ok) await refresh();
    },
    [slug, refresh],
  );

  const value = useMemo(
    () => ({ ready, user, favorites, refresh, toggleFavorite }),
    [ready, user, favorites, refresh, toggleFavorite],
  );

  return (
    <SiteSessionContext.Provider value={value}>
      {children}
    </SiteSessionContext.Provider>
  );
}
