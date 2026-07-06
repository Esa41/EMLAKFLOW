"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PURPOSE_TR, TYPE_TR, STATUS_TR, ROOM_OPTIONS } from "@/lib/labels";
import { PhotoUploader, type MediaItem } from "./photo-uploader";
import { LocationPicker } from "./location-picker";

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
  parcelGeo: string; // harita ile çizilen alan sınırı (GeoJSON string, "" = yok)
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
  parcelGeo: "",
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
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const set = <K extends keyof ListingFormValues>(
    k: K,
    val: ListingFormValues[K],
  ) => setV((s) => ({ ...s, [k]: val }));

  async function generateWithAI() {
    if (!aiPrompt.trim() || aiPrompt.trim().length < 5) {
      setAiError(
        "En az 5 karakter girin. Örn: 'Kadıköy Moda 3+1 deniz manzaralı'",
      );
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Bir hata oluştu.");
      const l = data.listing;
      setV((prev) => ({
        ...prev,
        title: l.title ?? prev.title,
        description: l.description ?? prev.description,
        purpose: l.purpose ?? prev.purpose,
        type: l.type ?? prev.type,
        city: l.city ?? prev.city,
        district: l.district ?? prev.district,
        neighborhood: l.neighborhood ?? prev.neighborhood,
        rooms: l.rooms ?? prev.rooms,
        grossArea: l.grossArea?.toString() ?? prev.grossArea,
        netArea: l.netArea?.toString() ?? prev.netArea,
        price: l.price?.toString() ?? prev.price,
        heating: l.heating ?? prev.heating,
        buildingAge: l.buildingAge?.toString() ?? prev.buildingAge,
        creditEligible: l.creditEligible ?? prev.creditEligible,
        furnished: l.furnished ?? prev.furnished,
        inSite: l.inSite ?? prev.inSite,
      }));
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "AI hatası.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit() {
    if (!v.title || !v.price || !v.district) {
      setError("Başlık, fiyat ve ilçe zorunlu.");
      return;
    }
    setSaving(true);
    setError(null);

    const res = await fetch(
      listingId ? `/api/listings/${listingId}` : "/api/listings",
      {
        method: listingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...v,
          price: Number(v.price),
          parcelGeo: v.parcelGeo ? JSON.parse(v.parcelGeo) : null,
        }),
      },
    );
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
    router.push(
      listingId ? `/portfoy/${listingId}` : `/portfoy/${data.listing.id}`,
    );
    router.refresh();
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* ✨ Yapay Zeka Sihirli Ekleme */}
      <section className="overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-indigo-50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-indigo-500 text-white text-sm">
            ✦
          </span>
          <h2 className="text-sm font-bold text-ink/80">
            Yapay Zeka ile Sihirli Ekleme
          </h2>
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-600">
            Beta
          </span>
        </div>
        <p className="mb-3 text-xs text-ink/50">
          Kısa bir açıklama yaz, AI tüm formu otomatik doldursun. Örn:
          &quot;Kadıköy Moda 3+1 deniz manzaralı daire 150m2&quot;
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-brand-200 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-ink/35 focus:ring-2 focus:ring-brand-500/40"
            placeholder="İlanı birkaç kelimeyle anlat..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !aiLoading) generateWithAI();
            }}
            disabled={aiLoading}
          />
          <button
            onClick={generateWithAI}
            disabled={aiLoading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:opacity-60"
          >
            {aiLoading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Üretiliyor…
              </>
            ) : (
              <>✦ Oluştur</>
            )}
          </button>
        </div>
        {aiError && (
          <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
            {aiError}
          </p>
        )}
      </section>

      {/* Temel bilgiler */}
      <section className="rounded-2xl bg-white p-5 border border-ink/15">
        <h2 className="bolum mb-4">Temel Bilgiler</h2>
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
                <option key={k} value={k}>
                  {l}
                </option>
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
                <option key={k} value={k}>
                  {l}
                </option>
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
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Lokasyon */}
      <section className="rounded-2xl bg-white p-5 border border-ink/15">
        <h2 className="bolum mb-4">Lokasyon</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>İl</label>
            <input
              className={inputCls}
              value={v.city}
              onChange={(e) => set("city", e.target.value)}
            />
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
            <input
              className={inputCls}
              value={v.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
        </div>

        {/* Harita ile konum / alan seçimi */}
        <div className="mt-4">
          <label className={labelCls}>
            Harita üzerinde konum işaretle
            {v.type === "LAND" || v.type === "COMMERCIAL"
              ? " (arsa/tarla için “Alan çiz” ile sınırı çizebilirsiniz)"
              : ""}
          </label>
          <LocationPicker
            lat={v.lat}
            lng={v.lng}
            parcelGeo={v.parcelGeo}
            isLand={v.type === "LAND"}
            onChange={(patch) => setV((s) => ({ ...s, ...patch }))}
          />
        </div>

        {/* Elle koordinat (gelişmiş / yedek) */}
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-ink/50 hover:text-ink/75">
            Koordinatı elle gir (gelişmiş)
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Enlem (lat)</label>
              <input
                type="number"
                step="any"
                className={inputCls}
                value={v.lat}
                onChange={(e) => set("lat", e.target.value)}
                placeholder="40.7663"
              />
            </div>
            <div>
              <label className={labelCls}>Boylam (lng)</label>
              <input
                type="number"
                step="any"
                className={inputCls}
                value={v.lng}
                onChange={(e) => set("lng", e.target.value)}
                placeholder="29.9167"
              />
            </div>
          </div>
        </details>
      </section>

      {/* Özellikler */}
      <section className="rounded-2xl bg-white p-5 border border-ink/15">
        <h2 className="bolum mb-4">Özellikler</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className={labelCls}>Oda</label>
            <select
              className={inputCls}
              value={v.rooms}
              onChange={(e) => set("rooms", e.target.value)}
            >
              <option value="">—</option>
              {ROOM_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Brüt m²</label>
            <input
              type="number"
              className={inputCls}
              value={v.grossArea}
              onChange={(e) => set("grossArea", e.target.value)}
              min={0}
            />
          </div>
          <div>
            <label className={labelCls}>Net m²</label>
            <input
              type="number"
              className={inputCls}
              value={v.netArea}
              onChange={(e) => set("netArea", e.target.value)}
              min={0}
            />
          </div>
          <div>
            <label className={labelCls}>Bina yaşı</label>
            <input
              type="number"
              className={inputCls}
              value={v.buildingAge}
              onChange={(e) => set("buildingAge", e.target.value)}
              min={0}
            />
          </div>
          <div>
            <label className={labelCls}>Bulunduğu kat</label>
            <input
              type="number"
              className={inputCls}
              value={v.floor}
              onChange={(e) => set("floor", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Toplam kat</label>
            <input
              type="number"
              className={inputCls}
              value={v.totalFloors}
              onChange={(e) => set("totalFloors", e.target.value)}
              min={0}
            />
          </div>
          <div>
            <label className={labelCls}>Isıtma</label>
            <input
              className={inputCls}
              value={v.heating}
              onChange={(e) => set("heating", e.target.value)}
              placeholder="Kombi (Doğalgaz)"
            />
          </div>
          <div>
            <label className={labelCls}>Aidat (₺)</label>
            <input
              type="number"
              className={inputCls}
              value={v.dues}
              onChange={(e) => set("dues", e.target.value)}
              min={0}
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Tapu durumu</label>
            <input
              className={inputCls}
              value={v.deedStatus}
              onChange={(e) => set("deedStatus", e.target.value)}
              placeholder="Kat Mülkiyeti"
            />
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
            <label
              key={key}
              className="flex items-center gap-2 text-sm text-ink/80"
            >
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
          <h2 className="bolum mb-4">Fotoğraflar</h2>
          <PhotoUploader listingId={listingId} initialMedia={initialMedia} />
        </section>
      )}
      {!listingId && (
        <p className="text-sm text-ink/55">
          Fotoğraflar, ilan kaydedildikten sonra detay sayfasından yüklenir.
        </p>
      )}

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
          {error}
        </p>
      )}
      {matched !== null && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          ✓ İlan kaydedildi — {matched} açık taleple eşleşti! Detaya
          yönlendiriliyorsun…
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="btn-selvi rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
        >
          {saving
            ? "Kaydediliyor…"
            : listingId
              ? "Değişiklikleri kaydet"
              : "İlanı kaydet"}
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
