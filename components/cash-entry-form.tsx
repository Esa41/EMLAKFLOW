"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

const CATEGORIES = [
  { value: "reklam", label: "Reklam" },
  { value: "kira", label: "Kira" },
  { value: "ofis", label: "Ofis gideri" },
  { value: "maas", label: "Maaş / prim" },
  { value: "vergi", label: "Vergi / harç" },
  { value: "komisyon-disi", label: "Komisyon dışı gelir" },
  { value: "diger", label: "Diğer" },
] as const;

/**
 * Kasa sayfasından manuel gelir veya gider ekleme formu.
 */
export function CashEntryForm({ canManage }: { canManage: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("income");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("diger");
  const [note, setNote] = useState("");
  const [occurredAt, setOccurredAt] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canManage) return null;

  function reset() {
    setType("income");
    setTitle("");
    setAmount("");
    setCategory("diger");
    setNote("");
    setOccurredAt(new Date().toISOString().slice(0, 10));
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cash-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          amount: Number(amount),
          category,
          note: note || undefined,
          occurredAt: occurredAt || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Kaydedilemedi.");
      reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="dash-btn-primary inline-flex items-center gap-1.5"
      >
        <Plus size={15} /> Gelir / Gider
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold">Manuel kayıt</h3>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="rounded-lg p-1.5 text-ink/40 hover:bg-ink/[0.05] hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    type === "income"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-ink/15 text-ink/55 hover:bg-ink/[0.03]"
                  }`}
                >
                  Gelir
                </button>
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    type === "expense"
                      ? "border-rose-600 bg-rose-50 text-rose-800"
                      : "border-ink/15 text-ink/55 hover:bg-ink/[0.03]"
                  }`}
                >
                  Gider
                </button>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Başlık *</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    type === "income"
                      ? "Örn: Kapora / danışmanlık ücreti"
                      : "Örn: Sahibinden reklam"
                  }
                  className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Tutar (₺) *</label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Tarih</label>
                  <input
                    type="date"
                    value={occurredAt}
                    onChange={(e) => setOccurredAt(e.target.value)}
                    className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Not</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="İsteğe bağlı açıklama"
                  className="w-full resize-none rounded-lg border border-ink/20 px-3 py-2 text-sm focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-100"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={busy || !title || !amount}
                  className="btn-selvi rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "Kaydediliyor…" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
