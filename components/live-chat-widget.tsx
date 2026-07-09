"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { sendVitrinMessage } from "@/app/actions/chat";

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

function storageKey(tenantId: string, suffix: string) {
  return `emlakflow_${suffix}_${tenantId}`;
}

/** Kalıcı vitrin sohbet oturumu — localStorage'da saklanır, /sohbet ile senkron. */
function resolveSessionId(tenantId: string): string {
  const key = storageKey(tenantId, "chat_sid");
  let sid = localStorage.getItem(key);
  if (!sid) {
    sid =
      sessionStorage.getItem("emlakflow_chat_sid") ??
      sessionStorage.getItem("emlakflow_vid") ??
      `v_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(key, sid);
  }
  sessionStorage.setItem("emlakflow_vid", sid);
  sessionStorage.setItem("emlakflow_chat_sid", sid);
  return sid;
}

export function LiveChatWidget({ tenantId }: { tenantId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [sessionId, setSessionId] = useState<string>("");
  const [nameLocked, setNameLocked] = useState(false);

  useEffect(() => {
    const sid = resolveSessionId(tenantId);
    setSessionId(sid);

    const savedName = localStorage.getItem(storageKey(tenantId, "chat_name"));
    if (savedName) {
      setName(savedName);
      setNameLocked(true);
    }
    const savedPhone = localStorage.getItem(storageKey(tenantId, "chat_phone"));
    if (savedPhone) setPhone(savedPhone);
  }, [tenantId]);

  const load = useCallback(() => {
    if (!sessionId) return;
    fetch(`/api/chat/${sessionId}?t=${tenantId}`)
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setMessages(data))
      .catch(() => {});
  }, [sessionId, tenantId]);

  // Sayfa açılınca geçmişi yükle — panel kapalı olsa da sohbet yedekte kalır
  useEffect(() => {
    if (!sessionId) return;
    load();
  }, [sessionId, load]);

  useEffect(() => {
    if (!sessionId) return;

    let interval: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (interval) return;
      load();
      interval = setInterval(load, isOpen ? 5000 : 15000);
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
  }, [sessionId, isOpen, load]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [body]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !name.trim() || !sessionId) return;

    setError(null);

    const tempId = Date.now();
    const tempMsg: Msg = {
      id: tempId,
      body,
      senderName: name,
      senderId: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    const textToSend = body;
    const phoneToSend = phone.trim();
    setBody("");

    if (!nameLocked) {
      localStorage.setItem(storageKey(tenantId, "chat_name"), name.trim());
      if (phoneToSend) {
        localStorage.setItem(storageKey(tenantId, "chat_phone"), phoneToSend);
      }
      setNameLocked(true);
    }

    const result = await sendVitrinMessage(
      tenantId,
      sessionId,
      name,
      textToSend,
      phoneToSend || null,
    );
    if (!result.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError(result.error);
      return;
    }
    load();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="flex h-[420px] w-80 flex-col overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
            <h3 className="font-bold">Canlı Destek</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition-colors hover:bg-brand-700"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-ink/[0.02] p-4">
            {messages.length === 0 ? (
              <p className="mt-10 text-center text-xs text-ink/45">
                Bize bir mesaj gönderin — yazışmalarınız kayıt altında kalır.
              </p>
            ) : (
              messages.map((m) => {
                const isAgent = !!m.senderId;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isAgent ? "items-start" : "items-end"}`}
                  >
                    <span className="mb-0.5 px-1 text-[10px] text-ink/45">
                      {m.senderName || "Ziyaretçi"}
                    </span>
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                        isAgent
                          ? "bg-white text-ink shadow-sm ring-1 ring-ink/[0.06]"
                          : "bg-brand-600 text-white"
                      }`}
                    >
                      {m.body}
                    </div>
                    <span className="mt-0.5 px-1 text-[10px] text-ink/35">
                      {fmtTime(m.createdAt)}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-ink/[0.06] bg-white p-3">
            {error && <p className="mb-2 text-[11px] text-rose-600">{error}</p>}
            <form onSubmit={handleSend} className="space-y-2">
              {nameLocked ? (
                <div className="flex items-center justify-between px-1">
                  <span className="truncate text-[11px] text-ink/50">
                    Sohbet eden: <b className="text-ink/70">{name}</b>
                    {phone ? (
                      <span className="text-ink/40"> · {phone}</span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(storageKey(tenantId, "chat_name"));
                      localStorage.removeItem(storageKey(tenantId, "chat_phone"));
                      setName("");
                      setPhone("");
                      setNameLocked(false);
                    }}
                    className="shrink-0 text-[11px] text-brand-600 hover:underline"
                  >
                    değiştir
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Adınız Soyadınız *"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="dash-input text-xs"
                  />
                  <input
                    type="tel"
                    placeholder="Telefon (isteğe bağlı)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                    className="dash-input text-xs"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  placeholder="Mesajınız…"
                  required
                  rows={1}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="dash-input flex-1 resize-none py-2 text-xs"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center rounded-xl bg-brand-600 p-2 text-white transition-colors hover:bg-brand-700"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl transition-transform hover:scale-105 hover:bg-brand-700"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
}
