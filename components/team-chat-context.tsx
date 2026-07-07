"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type TeamChatContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  openToSession: (sessionId: string) => void;
  pendingSession: string | null;
  clearPendingSession: () => void;
};

const TeamChatContext = createContext<TeamChatContextValue | null>(null);

export function TeamChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pendingSession, setPendingSession] = useState<string | null>(null);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  const openToSession = useCallback((sessionId: string) => {
    setPendingSession(sessionId);
    setOpen(true);
  }, []);

  const clearPendingSession = useCallback(() => setPendingSession(null), []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggle,
      openToSession,
      pendingSession,
      clearPendingSession,
    }),
    [open, toggle, openToSession, pendingSession, clearPendingSession],
  );

  return (
    <TeamChatContext.Provider value={value}>{children}</TeamChatContext.Provider>
  );
}

export function useTeamChat() {
  const ctx = useContext(TeamChatContext);
  if (!ctx) throw new Error("useTeamChat TeamChatProvider içinde kullanılmalı");
  return ctx;
}

/** Provider dışında güvenli kullanım (opsiyonel). */
export function useTeamChatOptional() {
  return useContext(TeamChatContext);
}
