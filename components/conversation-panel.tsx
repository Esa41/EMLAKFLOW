"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send,
  Phone,
  Users,
  StickyNote,
  MessageSquare,
  Mail,
  type LucideIcon,
} from "lucide-react";

/* ── Ortak konuşma/not paneli ──
 * İki kullanım:
 *   variant="chat"  → ekip sohbeti (balonlar, sağ/sol hizalı)
 *   variant="notes" → müşteri/fırsat notları (tipli satırlar + hızlı aksiyon)
 */

export interface PanelEntry {
  id: string | number;
  body: string;
  author?: string | null;
  mine?: boolean;
  createdAt: string;
  type?: string; // NOTE | CALL | MEETING | WHATSAPP | EMAIL
}

/** Elle eklenebilen faaliyet tipleri — notes varyantında hızlı aksiyon çipleri */
export const NOTE_TYPES: Array<{
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
}> = [
  { key: "NOTE", label: "Not", icon: StickyNote, color: "bg-amber-50 text-amber-600" },
  { key: "CALL", label: "Arama", icon: Phone, color: "bg-sky-50 text-sky-600" },
  { key: "MEETING", label: "Görüşme", icon: Users, color: "bg-violet-50 text-violet-600" },
  { key: "WHATSAPP", label: "WhatsApp", icon: MessageSquare, color: "bg-emerald-50 text-emerald-600" },
  { key: "EMAIL", label: "E-posta", icon: Mail, color: "bg-indigo-50 text-indigo-600" },
];
const NOTE_TYPE_MAP = Object.fromEntries(NOTE_TYPES.map((t) => [t.key, t]));

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function ConversationPanel({
  entries,
  onSend,
  variant = "chat",
  placeholder = "Mesajınız…",
  emptyText = "Henüz mesaj yok.",
  showTypePicker = false,
  heightClass = "h-80",
}: {
  entries: PanelEntry[];
  onSend: (body: string, type: string) => Promise<{ ok: boolean; error?: string }>;
  variant?: "chat" | "notes";
  placeholder?: string;
  emptyText?: string;
  /** notes varyantında tip seçici çipleri göster */
  showTypePicker?: boolean;
  heightClass?: string;
}) {
  const [body, setBody] = useState("");
  const [type, setType] = useState("NOTE");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [body]);

  async function submit() {
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    const res = await onSend(text, type);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Gönderilemedi.");
      return;
    }
    setBody("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-2xl border border-ink/[0.06] bg-[var(--app-surface)] shadow-sm dark:border-white/[0.07] ${heightClass.includes("h-full") ? "h-full" : ""}`}>
      <div className={`flex-1 space-y-3 overflow-y-auto bg-ink/[0.02] p-3 ${heightClass.includes("h-full") ? "min-h-0" : heightClass}`}>
        {entries.length === 0 ? (
          <p className="mt-8 text-center text-xs text-ink/40">{emptyText}</p>
        ) : variant === "chat" ? (
          entries.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}
            >
              {m.author && (
                <span className="mb-0.5 px-1 text-[10px] text-ink/50">
                  {m.author}
                </span>
              )}
              <div
                className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                  m.mine
                    ? "bg-brand-600 text-white"
                    : "bg-[var(--app-surface-hover)] text-ink shadow-sm ring-1 ring-ink/[0.05] dark:ring-white/[0.06]"
                }`}
              >
                {m.body}
              </div>
              <span className="mt-0.5 px-1 text-[10px] text-ink/40">
                {fmtTime(m.createdAt)}
              </span>
            </div>
          ))
        ) : (
          entries.map((a) => {
            const t = NOTE_TYPE_MAP[a.type ?? "NOTE"] ?? NOTE_TYPE_MAP.NOTE;
            const Icon = t.icon;
            return (
              <div key={a.id} className="flex gap-2.5">
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${t.color}`}
                >
                  <Icon size={13} />
                </span>
                <div className="min-w-0 flex-1 rounded-lg bg-[var(--app-surface-hover)] px-3 py-2 shadow-sm">
                  <p className="whitespace-pre-wrap break-words text-sm text-ink/80">
                    {a.body}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-ink/40">
                    <span className="font-semibold text-ink/55">{t.label}</span>
                    {a.author && <span>· {a.author}</span>}
                    <span>· {fmtTime(a.createdAt)}</span>
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-ink/[0.06] bg-[var(--app-surface)] p-2.5 dark:border-white/[0.07]">
        {showTypePicker && (
          <div className="mb-2 flex flex-wrap gap-1">
            {NOTE_TYPES.map((t) => {
              const Icon = t.icon;
              const on = type === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                    on
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-ink/15 text-ink/55 hover:border-brand-400"
                  }`}
                >
                  <Icon size={12} /> {t.label}
                </button>
              );
            })}
          </div>
        )}
        {error && <p className="mb-1.5 text-[11px] text-rose-600">{error}</p>}
        <div className="flex gap-2">
          <textarea
            ref={taRef}
            rows={1}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="dash-input flex-1 resize-none py-2"
          />
          <button
            type="button"
            onClick={submit}
            disabled={busy || !body.trim()}
            className="flex items-center justify-center rounded-lg bg-brand-600 p-2 text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            aria-label="Gönder"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
