"use client";

import { useState } from "react";
import { Bell, Check } from "lucide-react";

/**
 * "Bu aramayı kaydet" butonu — mevcut filtrelerle bildirim aboneliği oluşturur.
 * Lead tablosuna source: "vitrin-alert" olarak kaydeder.
 */
export function SaveSearchButton({
  slug,
  filters,
}: {
  slug: string;
  filters: Record<string, string | undefined>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name || !phone) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/ofis/${slug}/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "alert",
        name,
        phone,
        email,
        filters,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Kaydedilemedi, lütfen tekrar deneyin.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-600/25 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
        <Check size={12} /> Arama kaydedildi
      </span>
    );
  }

  const input =
    "w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm outline-none placeholder:text-ink/35 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/25";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink/60 transition-colors hover:border-brand-600 hover:text-brand-700"
      >
        <Bell size={12} /> Bu aramayı kaydet
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-ink bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-extrabold tracking-tight">
              Arama Bildirimi
            </h3>
            <p className="mt-1 text-xs text-ink/55">
              Bu filtrelere uyan yeni bir ilan portföye girdiğinde sizi
              arayacağız.
            </p>
            <div className="mt-4 space-y-2.5">
              <input
                className={input}
                placeholder="Adınız Soyadınız"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
              <input
                className={input}
                type="tel"
                placeholder="Telefonunuz"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
              <input
                className={input}
                type="email"
                placeholder="E-posta (opsiyonel)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              {error && (
                <p className="rounded-lg bg-[#c13515]/10 px-3 py-2 text-xs text-[#c13515]">
                  {error}
                </p>
              )}
              <button
                onClick={handleSubmit}
                disabled={busy || !name || !phone}
                className="btn-selvi w-full rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? "Kaydediliyor…" : "Bildirim aboneliği oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
