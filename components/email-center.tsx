"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail, RefreshCw, XCircle } from "lucide-react";

/**
 * E-posta merkezi — sohbet sayfasının "E-postalar" sekmesi.
 * Giden tüm mailler (otomatik + manuel) listelenir; buradan ofis adına
 * serbest e-posta da gönderilir (POST /api/mails/custom).
 */

type MailRow = {
  id: string;
  to: string;
  toName: string | null;
  kind: string;
  subject: string;
  preview: string | null;
  status: string;
  error: string | null;
  createdAt: string;
};

const KIND_TR: Record<string, string> = {
  "office-welcome": "Hoş geldin",
  "site-welcome": "Üyelik hoş geldin",
  "new-listing": "Portföy önerisi",
  "price-drop": "Fiyat düşüşü",
  appointment: "Randevu hatırlatma",
  reengagement: "Kendini hatırlatma",
  custom: "Serbest",
};

const dtFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function EmailCenter() {
  const [mails, setMails] = useState<MailRow[] | null>(null);
  const [to, setTo] = useState("");
  const [toName, setToName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/mails", { cache: "no-store" });
      const data = await res.json();
      setMails(data.mails ?? []);
    } catch {
      setMails([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function send() {
    if (sending) return;
    setSending(true);
    setNotice(null);
    try {
      const res = await fetch("/api/mails/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, toName: toName || undefined, subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gönderilemedi.");
      setNotice({ ok: true, text: `${to} adresine gönderildi.` });
      setTo("");
      setToName("");
      setSubject("");
      setMessage("");
      await load();
    } catch (e) {
      setNotice({
        ok: false,
        text: e instanceof Error ? e.message : "Gönderilemedi.",
      });
    } finally {
      setSending(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/40";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Giden mailler */}
      <section className="rounded-[10px] border border-ink/15 bg-white">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3.5">
          <h2 className="text-sm font-bold">
            Giden E-postalar{mails ? ` (${mails.length})` : ""}
          </h2>
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-xs font-semibold text-ink/50 hover:text-ink"
          >
            <RefreshCw size={12} /> Yenile
          </button>
        </div>

        {mails === null ? (
          <p className="flex items-center gap-2 px-5 py-8 text-sm text-ink/50">
            <Loader2 size={14} className="animate-spin" /> Yükleniyor…
          </p>
        ) : mails.length === 0 ? (
          <p className="px-5 py-8 text-sm text-ink/50">
            Henüz gönderilmiş e-posta yok. Üyelik, fiyat düşüşü ve randevu
            hatırlatmaları otomatik olarak burada listelenecek.
          </p>
        ) : (
          <ul className="divide-y divide-ink/8">
            {mails.map((m) => (
              <li key={m.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {m.status === "sent" ? (
                      <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle size={14} className="shrink-0 text-rose-500" />
                    )}
                    <p className="truncate text-sm font-semibold">{m.subject}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-ink/40">
                    {dtFmt.format(new Date(m.createdAt))}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-ink/55">
                  <span className="rounded bg-ink/[0.05] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide">
                    {KIND_TR[m.kind] ?? m.kind}
                  </span>{" "}
                  → {m.toName ? `${m.toName} · ` : ""}
                  {m.to}
                  {m.status !== "sent" && m.error ? ` · ${m.error}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Yeni e-posta */}
      <section className="h-fit rounded-[10px] border border-ink/15 bg-white p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Mail size={15} className="text-brand-600" /> E-posta Gönder
        </h2>
        <p className="mt-1 text-xs text-ink/50">
          Ofisiniz adına gönderilir; yanıtlar e-posta adresinize düşer.
        </p>
        <div className="mt-4 space-y-3">
          <input
            type="email"
            className={inputCls}
            placeholder="Alıcı e-posta *"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <input
            className={inputCls}
            placeholder="Alıcı adı (opsiyonel)"
            value={toName}
            onChange={(e) => setToName(e.target.value)}
          />
          <input
            className={inputCls}
            placeholder="Konu *"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            className={`${inputCls} min-h-[120px] resize-y`}
            placeholder="Mesajınız *"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          {notice && (
            <p
              className={`rounded-xl px-3.5 py-2.5 text-xs ${
                notice.ok
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {notice.text}
            </p>
          )}
          <button
            onClick={send}
            disabled={sending || !to || !subject || !message}
            className="btn-selvi w-full rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {sending ? "Gönderiliyor…" : "Gönder"}
          </button>
        </div>
      </section>
    </div>
  );
}
