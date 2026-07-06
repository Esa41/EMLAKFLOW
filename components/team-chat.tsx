"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { sendTeamMessage } from "@/app/actions/chat";
import { ConversationPanel, type PanelEntry } from "./conversation-panel";

type Msg = {
  id: string | number;
  body: string;
  senderId: string | null;
  senderName: string | null;
  createdAt: string;
};

export function TeamChat({ currentUserId }: { currentUserId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const lastMarkedRef = useRef<string | number | null>(null);

  const load = useCallback(() => {
    fetch(`/api/chat/team`)
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setMessages(data))
      .catch((err) => console.error(err));
  }, []);

  // Yeni mesaj göründükçe ekip sohbetini "okundu" işaretle (sidebar rozeti düşer)
  useEffect(() => {
    if (document.hidden || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.id === lastMarkedRef.current) return;
    lastMarkedRef.current = last.id;
    fetch("/api/chat/team/unread", { method: "POST" }).catch(() => {});
  }, [messages]);

  useEffect(() => {
    // 5 saniyede bir polling; sekme arka plandayken durur, geri gelince hemen yeniler.
    let interval: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (interval) return;
      load();
      interval = setInterval(load, 5000);
    };
    const stop = () => {
      if (interval) clearInterval(interval);
      interval = null;
    };

    if (!document.hidden) start();

    const onVisibility = () => {
      if (document.hidden) stop();
      else {
        load();
        start();
      }
    };
    const onFocus = () => load();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const entries: PanelEntry[] = messages.map((m) => ({
    id: m.id,
    body: m.body,
    author: m.senderId === currentUserId ? undefined : m.senderName,
    mine: m.senderId === currentUserId,
    createdAt: m.createdAt,
  }));

  async function handleSend(body: string) {
    // Optimistic UI
    const tempId = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        body,
        senderName: "Siz",
        senderId: currentUserId,
        createdAt: new Date().toISOString(),
      },
    ]);

    const formData = new FormData();
    formData.append("body", body);
    const result = await sendTeamMessage(formData);
    if (!result.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return { ok: false, error: result.error };
    }
    load();
    return { ok: true };
  }

  return (
    <div>
      <div className="mb-2 rounded-t-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white">
        Ofis İçi Ekip Sohbeti
      </div>
      <ConversationPanel
        variant="chat"
        entries={entries}
        onSend={handleSend}
        placeholder="Mesajınız… (Enter: gönder, Shift+Enter: yeni satır)"
        emptyText="Ekibinizle sohbete başlayın."
        heightClass="h-[520px]"
      />
    </div>
  );
}
