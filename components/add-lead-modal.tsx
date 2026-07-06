"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { ROOM_OPTIONS } from "@/lib/labels";
import { getVertical, FUEL_OPTIONS, TRANSMISSION_OPTIONS } from "@/lib/verticals";

const input =
  "w-full rounded-xl border border-ink/15 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function AddLeadModal({
  contactId,
  isAuto,
  defaultCity,
}: {
  contactId: string;
  isAuto: boolean;
  defaultCity?: string | null;
}) {
  const router = useRouter();
  const vertical = getVertical(isAuto ? "AUTO_DEALER" : "REAL_ESTATE");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      contactId,
      purpose: fd.get("purpose"),
      type: fd.get("type") || undefined,
      source: fd.get("source") || "panel",
      note: fd.get("note") || undefined,
      minPrice: fd.get("minPrice") || undefined,
      maxPrice: fd.get("maxPrice") || undefined,
    };

    if (isAuto) {
      payload.vehicleBrand = fd.get("vehicleBrand") || undefined;
      payload.vehicleModel = fd.get("vehicleModel") || undefined;
      payload.minYear = fd.get("minYear") || undefined;
      payload.maxKm = fd.get("maxKm") || undefined;
      payload.fuel = fd.get("fuel") || undefined;
      payload.transmission = fd.get("transmission") || undefined;
    } else {
      payload.city = fd.get("city") || defaultCity || undefined;
      payload.district = fd.get("district") || undefined;
      payload.rooms = fd.get("rooms") || undefined;
      payload.minArea = fd.get("minArea") || undefined;
      payload.maxArea = fd.get("maxArea") || undefined;
      payload.needsCredit = fd.get("needsCredit") === "on";
    }

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Talep oluşturulamadı.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
      >
        <Plus size={14} /> Talep ekle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">
                Yeni {isAuto ? "araç" : "emlak"} talebi
              </h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-ink/50 hover:bg-ink/5">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink/60">İşlem</label>
                  <select name="purpose" className={input} defaultValue="SALE">
                    <option value="SALE">{isAuto ? "Satılık araç" : "Satılık"}</option>
                    <option value="RENT">{isAuto ? "Kiralık araç" : "Kiralık"}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink/60">Tip</label>
                  <select name="type" className={input} defaultValue="">
                    <option value="">Fark etmez</option>
                    {Object.entries(vertical.listingTypes).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isAuto ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <input name="vehicleBrand" className={input} placeholder="Marka" />
                    <input name="vehicleModel" className={input} placeholder="Model" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input name="minYear" type="number" className={input} placeholder="Min yıl" min={1990} />
                    <input name="maxKm" type="number" className={input} placeholder="Max km" min={0} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select name="fuel" className={input} defaultValue="">
                      <option value="">Yakıt (fark etmez)</option>
                      {FUEL_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                    <select name="transmission" className={input} defaultValue="">
                      <option value="">Vites (fark etmez)</option>
                      {TRANSMISSION_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <input name="city" className={input} placeholder="İl" defaultValue={defaultCity ?? ""} />
                    <input name="district" className={input} placeholder="İlçe / semt" />
                  </div>
                  <select name="rooms" className={input} defaultValue="">
                    <option value="">Oda (fark etmez)</option>
                    {ROOM_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <input name="minArea" type="number" className={input} placeholder="Min m²" min={0} />
                    <input name="maxArea" type="number" className={input} placeholder="Max m²" min={0} />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-ink/70">
                    <input type="checkbox" name="needsCredit" className="rounded border-ink/20" />
                    Krediye uygun olmalı
                  </label>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <input name="minPrice" type="number" className={input} placeholder="Min bütçe (₺)" min={0} />
                <input name="maxPrice" type="number" className={input} placeholder="Max bütçe (₺)" min={0} />
              </div>

              <input name="source" className={input} placeholder="Kaynak (referans, sahibinden…)" defaultValue="panel" />
              <textarea name="note" className={`${input} min-h-[72px]`} placeholder="Not (opsiyonel)" />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-ink/60 hover:bg-ink/5">
                  İptal
                </button>
                <button type="submit" disabled={loading} className="btn-selvi rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {loading ? "Kaydediliyor…" : "Talep oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
