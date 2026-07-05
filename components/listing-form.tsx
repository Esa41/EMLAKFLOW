"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PURPOSE_TR, TYPE_TR, STATUS_TR, ROOM_OPTIONS } from "@/lib/labels";
import { PhotoUploader, type MediaItem } from "./photo-uploader";

export interface ListingFormValues {
  title: string;
  purpose: string;
  type: string;
  status: string;
  price: string;
  city: string;
  district: string;
  neighborhood: string;
  address: string;
  lat: string;
  lng: string;
  rooms: string;
  grossArea: string;
  netArea: string;
  floor: string;
  totalFloors: string;
  buildingAge: string;
  heating: string;
  dues: string;
  deedStatus: string;
  creditEligible: boolean;
  furnished: boolean;
  inSite: boolean;
  description: string;
}

const EMPTY: ListingFormValues = {
  title: "",
  purpose: "SALE",
  type: "APARTMENT",
  status: "ACTIVE",
  price: "",
  city: "Ankara",
  district: "",
  neighborhood: "",
  address: "",
  lat: "",
  lng: "",
  rooms: "",
  grossArea: "",
  netArea: "",
  floor: "",
  totalFloors: "",
  buildingAge: "",
  heating: "",
  dues: "",
  deedStatus: "",
  creditEligible: true,
  furnished: false,
  inSite: false,
  description: "",
};

const inputCls =
  "w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/40";
const labelCls = "mb-1 block text-sm font-medium text-ink/65";

export function ListingForm({
  listingId,
  initial,
  initialMedia = [],
}: {
  listingId?: string;
  initial?: Partial<ListingFormValues>;
  initialMedia?: MediaItem[];
}) {
  const router = useRouter();
  const [v, setV] = useState<ListingFormValues>({ ...EMPTY, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [matched, setMatched] = useState<number | null>(null);

  const set = <K extends keyof ListingFormValues>(k: K, val: ListingFormValues[K]) =>
    setV((s) => ({ ...s, [k]: val }));

  async function handleSubmit() {
    if (!v.title || !v.price || !v.district) {
      setError("Başlık, fiyat ve ilçe zorunlu.");
      return;
    }
    setSaving(true);
    setError(null);

    const res = await fetch(listingId ? `/api/listings/${listingId}` : "/api/listings", {
      method: listingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...v, price: Number(v.price) }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Kaydedilemedi.");
      return;
    }

    if (!listingId && data.matchedLeads > 0) {
      // Yeni ilan açık taleplerle eşleşti — kullanıcıya göster, sonra yönlendir
      setMatched(data.matchedLeads);
      setTimeout(() => {
        router.push(`/portfoy/${data.listing.id}`);
        router.refresh();
      }, 1600);
      return;
    }
    router.push(listingId ? `/portfoy/${listingId}` : `/portfoy/${data.listing.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Temel bilgiler */}
      <section className="rounded-2xl bg-white p-5 border border-ink/15">
        <h2 className="bolum mb-4">
          Temel Bilgiler
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>İlan başlığı *</label>
            <input
              className={inputCls}
              value={v.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Örn. Park Oran'da Güney Cephe 3+1"
            />
          </div>
          <div>
            <label className={labelCls}>Amaç</label>
            <select
              className={inputCls}
              value={v.purpose}
              onChange={(e) => set("purpose", e.target.value)}
            >
              {Object.entries(PURPOSE_TR).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tip</label>
            <select
              className={inputCls}
              value={v.type}
              onChange={(e) => set("type", e.target.value)}
            >
              {Object.entries(TYPE_TR).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>
              Fiyat (₺{v.purpose === "RENT" ? "/ay" : ""}) *
            </label>
            <input
              type="number"
              className={inputCls}
              value={v.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="9750000"
              min={0}
            />
          </div>
          <div>
            <label className={labelCls}>Durum</label>
            <select
              className={inputCls}
              value={v.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {Object.entries(STATUS_TR).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Lokasyon */}
      <section className="rounded-2xl bg-white p-5 border border-ink/15">
        <h2 className="bolum mb-4">
          Lokasyon
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>İl</label>
            <input className={inputCls} value={v.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>İlçe *</label>
            <input
              className={inputCls}
              value={v.district}
              onChange={(e) => set("district", e.target.value)}
              placeholder="Çankaya"
            />
          </div>
          <div>
            <label className={labelCls}>Mahalle</label>
            <input
              className={inputCls}
              value={v.neighborhood}
              onChange={(e) => set("neighborhood", e.target.value)}
              placeholder="Oran"
            />
          </div>
          <div className="sm:col-span-3">
            <label className={labelCls}>Açık adres</label>
            <input className={inputCls} value={v.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Enlem (lat)</label>
            <input type="number" step="any" className={inputCls} value={v.lat}
              onChange={(e) => set("lat", e.target.value)} placeholder="40.7663" />
          </div>
          <div>
            <label className={labelCls}>Boylam (lng)</label>
            <input type="number" step="any" className={inputCls} value={v.lng}
              onChange={(e) => set("lng", e.target.value)} placeholder="29.9167" />
          </div>
          <div className="flex items-end pb-1">
            <p className="text-xs text-ink/45">
              Koordinat girilen ilan vitrindeki haritada fiyat plakasıyla görünür.
              Google Maps'te konuma sağ tıkla → kopyala.
            </p>
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section className="rounded-2xl bg-white p-5 border border-ink/15">
        <h2 className="bolum mb-4">
          Özellikler
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className={labelCls}>Oda</label>
            <select className={inputCls} value={v.rooms} onChange={(e) => set("rooms", e.target.value)}>
              <option value="">—</option>
              {ROOM_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Brüt m²</label>
            <input type="number" className={inputCls} value={v.grossArea} onChange={(e) => set("grossArea", e.target.value)} min={0} />
          </div>
          <div>
            <label className={labelCls}>Net m²</label>
            <input type="number" className={inputCls} value={v.netArea} onChange={(e) => set("netArea", e.target.value)} min={0} />
          </div>
          <div>
            <label className={labelCls}>Bina yaşı</label>
            <input type="number" className={inputCls} value={v.buildingAge} onChange={(e) => set("buildingAge", e.target.value)} min={0} />
          </div>
          <div>
            <label className={labelCls}>Bulunduğu kat</label>
            <input type="number" className={inputCls} value={v.floor} onChange={(e) => set("floor", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Toplam kat</label>
            <input type="number" className={inputCls} value={v.totalFloors} onChange={(e) => set("totalFloors", e.target.value)} min={0} />
          </div>
          <div>
            <label className={labelCls}>Isıtma</label>
            <input className={inputCls} value={v.heating} onChange={(e) => set("heating", e.target.value)} placeholder="Kombi (Doğalgaz)" />
          </div>
          <div>
            <label className={labelCls}>Aidat (₺)</label>
            <input type="number" className={inputCls} value={v.dues} onChange={(e) => set("dues", e.target.value)} min={0} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Tapu durumu</label>
            <input className={inputCls} value={v.deedStatus} onChange={(e) => set("deedStatus", e.target.value)} placeholder="Kat Mülkiyeti" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {(
            [
              ["creditEligible", "Krediye uygun"],
              ["furnished", "Eşyalı"],
              ["inSite", "Site içinde"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-ink/80">
              <input
                type="checkbox"
                checked={v[key]}
                onChange={(e) => set(key, e.target.checked)}
                className="h-4 w-4 rounded border-ink/25 accent-[#3b55e6]"
              />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-4">
          <label className={labelCls}>Açıklama</label>
          <textarea
            className={`${inputCls} min-h-24`}
            value={v.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
      </section>

      {/* Fotoğraflar — düzenleme modunda */}
      {listingId && (
        <section className="rounded-2xl bg-white p-5 border border-ink/15">
          <h2 className="bolum mb-4">
            Fotoğraflar
          </h2>
          <PhotoUploader listingId={listingId} initialMedia={initialMedia} />
        </section>
      )}
      {!listingId && (
        <p className="text-sm text-ink/55">
          Fotoğraflar, ilan kaydedildikten sonra detay sayfasından yüklenir.
        </p>
      )}

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">{error}</p>
      )}
      {matched !== null && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          ✓ İlan kaydedildi — {matched} açık taleple eşleşti! Detaya yönlendiriliyorsun…
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="btn-selvi rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
        >
          {saving ? "Kaydediliyor…" : listingId ? "Değişiklikleri kaydet" : "İlanı kaydet"}
        </button>
        <button
          onClick={() => router.back()}
          className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-ink/65 ring-1 ring-ink/20 hover:bg-ink/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
