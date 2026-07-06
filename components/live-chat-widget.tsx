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

export function LiveChatWidget({ tenantId }: { tenantId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [sessionId, setSessionId] = useState<string>("");
  // İsim bir kez alınıp kalıcı saklanır (localStorage) → tekrar sorulmaz.
  const [nameLocked, setNameLocked] = useState(false);

  useEffect(() => {
    // Ziyaretçi kimliği vitrin analitiğiyle (emlakflow_vid) ORTAK — böylece
    // danışman, sohbetteki ziyaretçinin hangi ilanlara baktığını görebilir.
    // Eski anahtar (emlakflow_chat_sid) süren sohbetler için korunur.
    let sid =
      sessionStorage.getItem("emlakflow_chat_sid") ??
      sessionStorage.getItem("emlakflow_vid");
    if (!sid) {
      sid = "v_" + Math.random().toString(36).substring(2, 11);
      sessionStorage.setItem("emlakflow_vid", sid);
    }
    setSessionId(sid);

    // Önceki oturumdan kalan isim → doğrudan yükle, isim sorma
    const savedName = localStorage.getItem("emlakflow_chat_name");
    if (savedName) {
      setName(savedName);
      setNameLocked(true);
    }
  }, []);

  const load = useCallback(() => {
    if (!sessionId) return;
    fetch(`/api/chat/${sessionId}?t=${tenantId}`)
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setMessages(data))
      .catch((err) => console.error(err));
  }, [sessionId, tenantId]);

  useEffect(() => {
    if (!isOpen || !sessionId) return;

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
  }, [isOpen, sessionId, load]);

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
    if (!body.trim() || !name.trim()) return;

    setError(null);

    // Optimistic UI
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
    setBody("");

    // İsmi kalıcı sakla — bir daha sorma
    if (!nameLocked) {
      localStorage.setItem("emlakflow_chat_name", name.trim());
      setNameLocked(true);
    }

    const result = await sendVitrinMessage(
      tenantId,
      sessionId,
      name,
      textToSend,
    );
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
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="flex h-[400px] w-80 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-ink/10">
          <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
            <h3 className="font-bold">Canlı Destek</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-brand-700 rounded-full p-1 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.length === 0 ? (
              <p className="text-center text-xs text-ink/50 mt-10">
                Bize bir mesaj gönderin, anında yanıtlayalım.
              </p>
            ) : (
              messages.map((m) => {
                const isAgent = !!m.senderId;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isAgent ? "items-start" : "items-end"}`}
                  >
                    <span className="text-[10px] text-ink/50 px-1 mb-0.5">
                      {m.senderName || "Ziyaretçi"}
                    </span>
                    <div
                      className={`rounded-xl px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap break-words ${isAgent ? "bg-white border border-ink/10 text-ink" : "bg-brand-600 text-white"}`}
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

          <div className="border-t border-ink/10 bg-white p-3">
            {error && <p className="mb-2 text-[11px] text-rose-600">{error}</p>}
            <form onSubmit={handleSend} className="space-y-2">
              {nameLocked ? (
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] text-ink/55">
                    Sohbet eden: <b className="text-ink/75">{name}</b>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem("emlakflow_chat_name");
                      setName("");
                      setNameLocked(false);
                    }}
                    className="text-[11px] text-brand-600 hover:underline"
                  >
                    değiştir
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Adınız Soyadınız"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-ink/20 px-3 py-2 text-xs focus:border-brand-600 focus:ring-1 focus:outline-none"
                />
              )}
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  placeholder="Mesajınız... (Enter: gönder, Shift+Enter: yeni satır)"
                  required
                  rows={1}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 resize-none rounded-lg border border-ink/20 px-3 py-2 text-xs focus:border-brand-600 focus:ring-1 focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center rounded-lg bg-brand-600 p-2 text-white hover:bg-brand-700 transition-colors"
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
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl hover:bg-brand-700 transition-transform hover:scale-105"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
}
