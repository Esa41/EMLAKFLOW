"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { CONTACT_TYPE_TR } from "@/lib/labels";

export function AddContactButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("BUYER");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        type,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Kayıt oluşturulamadı.");
      return;
    }
    const { contact } = await res.json();
    setOpen(false);
    setFullName("");
    setPhone("");
    setEmail("");
    setType("BUYER");
    router.push(`/kisiler/${contact.id}`);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        <Plus size={16} />
        Kişi ekle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Yeni müşteri</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-ink/50 hover:bg-ink/5"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/60">Ad Soyad *</label>
                <input
                  className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/60">Telefon</label>
                <input
                  className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xx xxx xx xx"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/60">E-posta</label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/60">Tip</label>
                <select
                  className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {Object.entries(CONTACT_TYPE_TR).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-ink/60 hover:bg-ink/5"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {loading ? "Kaydediliyor…" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
