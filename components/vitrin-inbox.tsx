"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Send, MessageSquare, User, Eye } from "lucide-react";
import { sendAgentReply } from "@/app/actions/chat";

type SessionRow = {
  sessionId: string;
  visitorName: string | null;
  lastBody: string;
  lastAt: string | Date;
};

type TrailItem = {
  listingId: string;
  refCode: string;
  title: string;
  durationMs: number;
  at: string | Date;
};

function fmtDur(ms: number): string {
  if (ms < 1000) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} sn`;
  return `${Math.floor(s / 60)} dk ${s % 60 ? `${s % 60} sn` : ""}`.trim();
}

type Msg = {
  id: string | number;
  body: string;
  senderId: string | null;
  senderName: string | null;
  createdAt: string;
};

function timeAgo(d: string | Date) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa`;
  return `${Math.floor(h / 24)} gün`;
}

export function VitrinInbox({
  tenantId,
  sessions,
  trails = {},
}: {
  tenantId: string;
  sessions: SessionRow[];
  trails?: Record<string, TrailItem[]>;
}) {
  const [activeId, setActiveId] = useState<string | null>(sessions[0]?.sessionId ?? null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const active = sessions.find((s) => s.sessionId === activeId);

  useEffect(() => {
    if (!activeId) return;
    const load = () =>
      fetch(`/api/chat/${activeId}?t=${tenantId}`)
        .then((r) => r.json())
        .then((d) => Array.isArray(d) && setMessages(d))
        .catch((e) => console.error(e));
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [activeId, tenantId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !activeId) return;
    const text = body;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), body: text, senderId: "me", senderName: "Siz", createdAt: new Date().toISOString() },
    ]);
    setBody("");
    await sendAgentReply(activeId, text);
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ink/25 bg-white/50 px-4 py-16 text-center">
        <MessageSquare size={28} className="mx-auto mb-3 text-ink/30" />
        <p className="text-sm text-ink/55">Henüz vitrin sohbeti yok.</p>
        <p className="mt-1 text-xs text-ink/40">
          Vitrininizi gezen ziyaretçiler canlı destek balonundan yazdığında burada görünür.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[620px]">
      {/* Oturum listesi */}
      <div className="md:col-span-1 overflow-y-auto rounded-xl border border-ink/15 bg-white shadow-sm">
        {sessions.map((s) => {
          const isActive = s.sessionId === activeId;
          return (
            <button
              key={s.sessionId}
              onClick={() => setActiveId(s.sessionId)}
              className={`flex w-full items-start gap-3 border-b border-ink/10 px-4 py-3 text-left transition-colors ${
                isActive ? "bg-brand-50" : "hover:bg-slate-50"
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                <User size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{s.visitorName || "Ziyaretçi"}</p>
                  <span className="shrink-0 text-[10px] text-ink/40">{timeAgo(s.lastAt)}</span>
                </div>
                <p className="truncate text-xs text-ink/55">{s.lastBody}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Konuşma */}
      <div className="md:col-span-2 flex flex-col overflow-hidden rounded-xl border border-ink/15 bg-white shadow-sm">
        <div className="border-b border-ink/15 bg-brand-600 px-4 py-3 text-white">
          <h2 className="text-sm font-bold">{active?.visitorName || "Ziyaretçi"}</h2>
        </div>

        {/* Ziyaretçi izi: vitrinde baktığı ilanlar + kalma süresi */}
        {activeId && (trails[activeId]?.length ?? 0) > 0 && (
          <div className="border-b border-ink/10 bg-brand-50/60 px-4 py-2.5">
            <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink/50">
              <Eye size={12} /> Baktığı ilanlar
            </p>
            <div className="flex flex-wrap gap-1.5">
              {trails[activeId].slice(0, 6).map((t) => (
                <Link
                  key={t.listingId}
                  href={`/portfoy/${t.listingId}`}
                  title={t.title}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-800 transition-colors hover:border-brand-500"
                >
                  {t.refCode.replace(/^EF-\d{4}-0*/, "EF·")}
                  <span className="font-mono text-[10px] font-normal text-ink/45">
                    {fmtDur(t.durationMs)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
          {messages.map((m) => {
            const isAgent = !!m.senderId;
            return (
              <div key={m.id} className={`flex flex-col ${isAgent ? "items-end" : "items-start"}`}>
                <span className="mb-0.5 px-1 text-[10px] text-ink/50">{m.senderName || "Ziyaretçi"}</span>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    isAgent ? "bg-brand-600 text-white" : "border border-ink/10 bg-white text-ink"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="border-t border-ink/15 bg-white p-3">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              placeholder="Yanıtınızı yazın..."
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="flex-1 rounded-lg border border-ink/20 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1"
            />
            <button
              type="submit"
              className="flex items-center justify-center rounded-lg bg-brand-600 p-2 text-white transition-colors hover:bg-brand-700"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
