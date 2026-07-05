"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { sendTeamMessage } from "@/app/actions/chat";

type Msg = {
  id: string | number;
  body: string;
  senderId: string | null;
  senderName: string | null;
  createdAt: string;
};

const timeFmt = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
});
function fmtTime(d: string) {
  try {
    return timeFmt.format(new Date(d));
  } catch {
    return "";
  }
}

export function TeamChat({ currentUserId }: { currentUserId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(() => {
    fetch(`/api/chat/team`)
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setMessages(data))
      .catch((err) => console.error(err));
  }, []);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Textarea otomatik yükseklik ayarı
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [body]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setError(null);

    // Optimistic UI
    const tempId = Date.now();
    const tempMsg: Msg = {
      id: tempId,
      body,
      senderName: "Siz",
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    const formData = new FormData();
    formData.append("body", body);
    setBody("");

    const result = await sendTeamMessage(formData);
    if (!result.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError(result.error);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  return (
    <div className="flex h-[600px] flex-col rounded-xl border border-ink/15 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-ink/15 bg-brand-600 px-4 py-3 text-white">
        <h2 className="font-bold text-sm">Ofis İçi Ekip Sohbeti</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-ink/40 mt-10">
            Ekibinizle sohbete başlayın.
          </p>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <span className="text-[10px] text-ink/50 px-1 mb-0.5">
                  {m.senderName}
                </span>
                <div
                  className={`rounded-xl px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap break-words ${isMe ? "bg-brand-600 text-white" : "bg-white border border-ink/10 text-ink"}`}
                >
                  {m.body}
                </div>
                <span className="text-[10px] text-ink/40 px-1 mt-0.5">
                  {fmtTime(m.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-ink/15 bg-white p-3">
        {error && <p className="mb-2 text-[11px] text-rose-600">{error}</p>}
        <form onSubmit={handleSend} className="flex gap-2">
          <textarea
            ref={textareaRef}
            placeholder="Mesajınız... (Enter: gönder, Shift+Enter: yeni satır)"
            required
            rows={1}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 resize-none rounded-lg border border-ink/20 px-3 py-2 text-sm focus:border-brand-600 focus:ring-1 focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center justify-center rounded-lg bg-brand-600 p-2 text-white hover:bg-brand-700 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
