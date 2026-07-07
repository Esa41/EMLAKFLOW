"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  Users,
  ChevronLeft,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { ConversationPanel, type PanelEntry } from "./conversation-panel";
import { useTeamChat } from "./team-chat-context";
import { sendDirectMessage, sendTeamMessage } from "@/app/actions/chat";
import { TEAM_SESSION } from "@/lib/chat-sessions";

type Conversation = {
  sessionId: string;
  type: "group" | "dm";
  label: string;
  peerId?: string;
  peerName?: string;
  lastBody: string | null;
  lastAt: string | null;
  unread: number;
};

type Msg = {
  id: string | number;
  body: string;
  senderId: string | null;
  senderName: string | null;
  createdAt: string;
};

function fmtPreview(iso: string | null) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TeamChatDrawer({
  currentUserId,
  currentUserName,
}: {
  currentUserId: string;
  currentUserName: string;
}) {
  const { open, setOpen, pendingSession, clearPendingSession } = useTeamChat();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeSession, setActiveSession] = useState(TEAM_SESSION);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const lastMarkedRef = useRef<string | null>(null);

  const activeConv = conversations.find((c) => c.sessionId === activeSession);

  const loadConversations = useCallback(() => {
    fetch("/api/chat/conversations")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.conversations && setConversations(d.conversations))
      .catch(() => {});
  }, []);

  const loadMessages = useCallback((sessionId: string) => {
    setLoadingMsgs(true);
    fetch(`/api/chat/messages?session=${encodeURIComponent(sessionId)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => Array.isArray(data) && setMessages(data))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsgs(false));
  }, []);

  const markRead = useCallback((sessionId: string) => {
    fetch("/api/chat/team/unread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(() => loadConversations())
      .catch(() => {});
  }, [loadConversations]);

  useEffect(() => {
    if (!open) return;
    setMobileShowChat(false);
    setLoadingList(true);
    loadConversations();
    setLoadingList(false);
  }, [open, loadConversations]);

  useEffect(() => {
    if (pendingSession) {
      setActiveSession(pendingSession);
      setMobileShowChat(true);
      clearPendingSession();
    }
  }, [pendingSession, clearPendingSession]);

  useEffect(() => {
    if (!open) return;
    loadMessages(activeSession);
    const t = setInterval(() => loadMessages(activeSession), 5000);
    return () => clearInterval(t);
  }, [open, activeSession, loadMessages]);

  useEffect(() => {
    if (!open || messages.length === 0) return;
    const key = `${activeSession}:${messages[messages.length - 1]?.id}`;
    if (key === lastMarkedRef.current) return;
    lastMarkedRef.current = key;
    markRead(activeSession);
  }, [open, activeSession, messages, markRead]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  function selectConversation(sessionId: string) {
    setActiveSession(sessionId);
    setMobileShowChat(true);
    loadMessages(sessionId);
  }

  const entries: PanelEntry[] = messages.map((m) => ({
    id: m.id,
    body: m.body,
    author: m.senderId === currentUserId ? undefined : m.senderName,
    mine: m.senderId === currentUserId,
    createdAt: m.createdAt,
  }));

  async function handleSend(body: string) {
    const tempId = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        body,
        senderName: currentUserName,
        senderId: currentUserId,
        createdAt: new Date().toISOString(),
      },
    ]);

    if (activeSession === TEAM_SESSION) {
      const fd = new FormData();
      fd.append("body", body);
      const result = await sendTeamMessage(fd);
      if (!result.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return { ok: false, error: result.error };
      }
    } else {
      const peerId = activeConv?.peerId;
      if (!peerId) return { ok: false, error: "Alıcı bulunamadı." };
      const result = await sendDirectMessage(peerId, body);
      if (!result.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return { ok: false, error: result.error };
      }
    }

    loadMessages(activeSession);
    loadConversations();
    return { ok: true };
  }

  if (!open) return null;

  const chatTitle =
    activeConv?.type === "group"
      ? "Tüm ekip"
      : activeConv?.peerName ?? activeConv?.label ?? "Sohbet";

  return (
    <div className="team-chat-root fixed inset-0 z-[60]">
      <button
        type="button"
        className="absolute inset-0 bg-ink/20 backdrop-blur-[2px]"
        aria-label="Sohbeti kapat"
        onClick={() => setOpen(false)}
      />

      <aside
        className="team-chat-panel absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col border-l border-ink/[0.06] bg-[var(--app-bg)] shadow-[-8px_0_40px_-12px_var(--app-shadow)] dark:border-white/[0.07]"
        role="dialog"
        aria-label="Ekip sohbeti"
      >
        {/* Üst bar */}
        <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-ink/[0.06] bg-[var(--app-header-bg)] px-3 backdrop-blur-xl dark:border-white/[0.07]">
          {(mobileShowChat || activeSession) && (
            <button
              type="button"
              onClick={() => setMobileShowChat(false)}
              className="rounded-xl p-2 text-ink/45 transition hover:bg-ink/[0.04] md:hidden"
              aria-label="Konuşma listesine dön"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-ink">
              {mobileShowChat ? chatTitle : "Ekip sohbeti"}
            </p>
            {!mobileShowChat && (
              <p className="text-[11px] text-ink/40">Grup ve özel mesajlar</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl p-2 text-ink/40 transition hover:bg-ink/[0.04] hover:text-ink/70"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Sol: konuşma listesi */}
          <div
            className={`${
              mobileShowChat ? "hidden md:flex" : "flex"
            } w-full shrink-0 flex-col border-r border-ink/[0.06] bg-[var(--app-sidebar-bg)] md:w-[168px] dark:border-white/[0.07]`}
          >
            <div className="flex-1 overflow-y-auto p-2">
              {loadingList && conversations.length === 0 ? (
                <div className="flex justify-center py-8 text-ink/30">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : (
                conversations.map((c) => {
                  const active = c.sessionId === activeSession;
                  return (
                    <button
                      key={c.sessionId}
                      type="button"
                      onClick={() => selectConversation(c.sessionId)}
                      className={`mb-1 flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition ${
                        active
                          ? "bg-brand-600 text-white"
                          : "hover:bg-ink/[0.04]"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          active
                            ? "bg-white/20 text-white"
                            : c.type === "group"
                              ? "bg-brand-50 text-brand-700"
                              : "bg-ink/[0.06] text-ink/55"
                        }`}
                      >
                        {c.type === "group" ? (
                          <Users size={16} />
                        ) : (
                          initials(c.label)
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-1">
                          <span
                            className={`truncate text-[13px] font-semibold ${
                              active ? "text-white" : "text-ink"
                            }`}
                          >
                            {c.label}
                          </span>
                          {c.unread > 0 && (
                            <span
                              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                active
                                  ? "bg-white text-brand-700"
                                  : "bg-brand-600 text-white"
                              }`}
                            >
                              {c.unread > 9 ? "9+" : c.unread}
                            </span>
                          )}
                        </span>
                        {c.lastBody && (
                          <span
                            className={`mt-0.5 block truncate text-[11px] ${
                              active ? "text-white/70" : "text-ink/40"
                            }`}
                          >
                            {c.lastBody}
                          </span>
                        )}
                        {c.lastAt && (
                          <span
                            className={`text-[10px] ${
                              active ? "text-white/50" : "text-ink/30"
                            }`}
                          >
                            {fmtPreview(c.lastAt)}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Sağ: mesajlar */}
          <div
            className={`${
              mobileShowChat ? "flex" : "hidden md:flex"
            } min-w-0 flex-1 flex-col`}
          >
            {loadingMsgs && messages.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-ink/30">
                <Loader2 size={22} className="animate-spin" />
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col p-3">
                <ConversationPanel
                  variant="chat"
                  entries={entries}
                  onSend={handleSend}
                  placeholder={
                    activeConv?.type === "group"
                      ? "Ekibe yaz…"
                      : `${activeConv?.peerName ?? "Kişi"}ye yaz…`
                  }
                  emptyText={
                    activeConv?.type === "group"
                      ? "Ekiple sohbete başlayın."
                      : "Özel mesaj gönderin."
                  }
                  heightClass="h-full"
                />
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
