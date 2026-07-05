"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createManualDeal } from "@/app/actions/deal";

export function AddDealModal({ contactId, listings }: { contactId: string, listings: { id: string, title: string, refCode: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await createManualDeal(formData);
    setLoading(false);
    setIsOpen(false);
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
      >
        <Plus size={14} /> Fırsat Ekle
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-xl font-bold mb-4">Yeni Fırsat Ekle</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="contactId" value={contactId} />
              
              <div>
                <label className="block text-sm font-semibold mb-1">İlgilendiği İlan (İsteğe bağlı)</label>
                <select name="listingId" className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm focus:border-brand-600 focus:ring-1 focus:ring-brand-600">
                  <option value="">-- İlan Seçilmedi (Genel Arayış) --</option>
                  {listings.map(l => (
                    <option key={l.id} value={l.id}>{l.refCode} - {l.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Tahmini Değer (₺)</label>
                <input 
                  type="number" 
                  name="value" 
                  placeholder="Örn: 5000000"
                  className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-100">
                  İptal
                </button>
                <button type="submit" disabled={loading} className="btn-selvi rounded-lg px-4 py-2 text-sm font-semibold text-white">
                  {loading ? "Ekleniyor..." : "Fırsat Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
