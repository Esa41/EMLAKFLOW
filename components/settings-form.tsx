"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check } from "lucide-react";

export interface TenantSettings {
  name: string;
  phone: string;
  city: string;
  district: string;
  plan: string;
  commissionRate: string;
  agentSharePct: string;
  portalSahibinden: boolean;
  portalHepsiemlak: boolean;
  portalEmlakjet: boolean;
  feedToken: string;
  slug: string;
  showcaseEnabled: boolean;
  showcaseTagline: string;
  whatsapp: string;
  aboutTitle: string;
  aboutText: string;
  visionText: string;
  aboutStats: Array<{ value: string; label: string }>;
  showTeam: boolean;
  contractCompanyTitle: string;
  contractRepresentative: string;
  contractAddress: string;
  contractTaxNo: string;
  contractExtraClauses: string;
}

const inputCls =
  "w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/40 disabled:bg-ink/[0.04] disabled:text-ink/45";
const labelCls = "mb-1 block text-sm font-medium text-ink/65";
const sectionCls = "rounded-2xl bg-white p-5 border border-ink/15";
const headCls = "mb-4 text-sm font-bold uppercase tracking-wider text-ink/45";

export function SettingsForm({
  initial,
  isOwner,
  appUrl,
}: {
  initial: TenantSettings;
  isOwner: boolean;
  appUrl: string;
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof TenantSettings>(
    k: K,
    val: TenantSettings[K],
  ) => {
    setV((s) => ({ ...s, [k]: val }));
    setSaved(false);
  };

  const feedUrl = `${appUrl}/api/feed/${v.feedToken}.xml`;
  const showcaseUrl = `${appUrl}/ofis/${v.slug}`;
  const [copiedShowcase, setCopiedShowcase] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: v.name,
        phone: v.phone,
        city: v.city,
        district: v.district,
        commissionRate: v.commissionRate,
        agentSharePct: v.agentSharePct,
        portalSahibinden: v.portalSahibinden,
        portalHepsiemlak: v.portalHepsiemlak,
        portalEmlakjet: v.portalEmlakjet,
        showcaseEnabled: v.showcaseEnabled,
        showcaseTagline: v.showcaseTagline,
        whatsapp: v.whatsapp,
        aboutTitle: v.aboutTitle,
        aboutText: v.aboutText,
        visionText: v.visionText,
        aboutStats: v.aboutStats,
        showTeam: v.showTeam,
        contractCompanyTitle: v.contractCompanyTitle,
        contractRepresentative: v.contractRepresentative,
        contractAddress: v.contractAddress,
        contractTaxNo: v.contractTaxNo,
        contractExtraClauses: v.contractExtraClauses,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Kaydedilemedi.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function copyShowcase() {
    await navigator.clipboard.writeText(showcaseUrl);
    setCopiedShowcase(true);
    setTimeout(() => setCopiedShowcase(false), 1500);
  }

  async function copyFeed() {
    await navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const agentPct = Number(v.agentSharePct) || 0;

  return (
    <div className="max-w-3xl space-y-6">
      {!isOwner && (
        <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          Ayarları yalnız ofis sahibi (OWNER) değiştirebilir — görüntüleme
          modundasın.
        </p>
      )}

      {/* Ofis profili */}
      <section className={sectionCls}>
        <h2 className={headCls}>Ofis Profili</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Ofis adı</label>
            <input
              className={inputCls}
              value={v.name}
              disabled={!isOwner}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Telefon</label>
            <input
              className={inputCls}
              value={v.phone}
              disabled={!isOwner}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+90 312 …"
            />
          </div>
          <div>
            <label className={labelCls}>Plan</label>
            <input className={inputCls} value={v.plan} disabled />
          </div>
          <div>
            <label className={labelCls}>Şehir</label>
            <input
              className={inputCls}
              value={v.city}
              disabled={!isOwner}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>İlçe</label>
            <input
              className={inputCls}
              value={v.district}
              disabled={!isOwner}
              onChange={(e) => set("district", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Komisyon */}
      <section className={sectionCls}>
        <h2 className={headCls}>Komisyon Ayarları</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Satış komisyon oranı (%)</label>
            <input
              type="number"
              step="0.1"
              min={0}
              max={20}
              className={inputCls}
              value={v.commissionRate}
              disabled={!isOwner}
              onChange={(e) => set("commissionRate", e.target.value)}
            />
            <p className="mt-1 text-xs text-ink/45">
              Kiralamada her zaman 1 kira bedeli esas alınır.
            </p>
          </div>
          <div>
            <label className={labelCls}>Danışman payı (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              className={inputCls}
              value={v.agentSharePct}
              disabled={!isOwner}
              onChange={(e) => set("agentSharePct", e.target.value)}
            />
            <p className="mt-1 text-xs text-ink/45">
              Ofis payı: %{Math.max(0, 100 - agentPct)}
            </p>
          </div>
        </div>
        <p className="mt-3 rounded-xl bg-brand-50 px-4 py-2.5 text-xs text-brand-700">
          Örnek: ₺10.000.000 satışta brüt komisyon ₺
          {(
            (10_000_000 * (Number(v.commissionRate) || 0)) /
            100
          ).toLocaleString("tr-TR")}
          {" — "}danışman ₺
          {(
            ((10_000_000 * (Number(v.commissionRate) || 0)) / 100) *
            (agentPct / 100)
          ).toLocaleString("tr-TR")}
          {" / "}ofis ₺
          {(
            ((10_000_000 * (Number(v.commissionRate) || 0)) / 100) *
            ((100 - agentPct) / 100)
          ).toLocaleString("tr-TR")}
        </p>
      </section>

      {/* Sözleşme Şablonu */}
      <section className={sectionCls}>
        <h2 className={headCls}>Sözleşme Şablonu</h2>
        <p className="mb-4 text-xs text-ink/45">
          Bu bilgiler otomatik sözleşme taslaklarının başlığında ve ek
          maddelerinde kullanılır.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Resmi unvan</label>
            <input
              className={inputCls}
              value={v.contractCompanyTitle}
              disabled={!isOwner}
              maxLength={120}
              onChange={(e) => set("contractCompanyTitle", e.target.value)}
              placeholder="Boşsa ofis adı kullanılır"
            />
          </div>
          <div>
            <label className={labelCls}>Yetkili temsilci</label>
            <input
              className={inputCls}
              value={v.contractRepresentative}
              disabled={!isOwner}
              maxLength={80}
              onChange={(e) => set("contractRepresentative", e.target.value)}
              placeholder="Ad Soyad"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Sözleşme adresi</label>
            <input
              className={inputCls}
              value={v.contractAddress}
              disabled={!isOwner}
              maxLength={200}
              onChange={(e) => set("contractAddress", e.target.value)}
              placeholder="Sözleşme başlığında görünecek açık adres"
            />
          </div>
          <div>
            <label className={labelCls}>Vergi / ticaret sicil no</label>
            <input
              className={inputCls}
              value={v.contractTaxNo}
              disabled={!isOwner}
              maxLength={40}
              onChange={(e) => set("contractTaxNo", e.target.value)}
              placeholder="Örn. 1234567890"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Ek maddeler</label>
            <textarea
              className={`${inputCls} min-h-24`}
              value={v.contractExtraClauses}
              disabled={!isOwner}
              maxLength={1000}
              onChange={(e) => set("contractExtraClauses", e.target.value)}
              placeholder="Sözleşme sonuna eklenecek ek madde metni"
            />
          </div>
        </div>
      </section>

      {/* Vitrin */}
      <section className={sectionCls}>
        <h2 className={headCls}>Vitrin (Ofis Sayfası)</h2>
        <label className="flex items-center justify-between rounded-lg bg-ink/[0.04] px-4 py-3">
          <span className="text-sm font-medium text-ink/80">
            Vitrin yayında — müşteriler ilanlarınızı bu sayfadan görür
          </span>
          <input
            type="checkbox"
            checked={v.showcaseEnabled}
            disabled={!isOwner}
            onChange={(e) => set("showcaseEnabled", e.target.checked)}
            className="h-5 w-5 rounded border-ink/25 accent-[#1e5b3e]"
          />
        </label>

        <div className="mt-4">
          <label className={labelCls}>Tanıtım cümlesi</label>
          <input
            className={inputCls}
            value={v.showcaseTagline}
            disabled={!isOwner}
            maxLength={160}
            onChange={(e) => set("showcaseTagline", e.target.value)}
            placeholder="Örn. 15 yıldır Çankaya'da güvenle alım-satım."
          />
          <p className="mt-1 text-xs text-ink/45">
            Vitrinin en üstünde, başlığın altında görünür. Boş bırakılırsa
            standart metin kullanılır.
          </p>
        </div>

        <div className="mt-4">
          <label className={labelCls}>WhatsApp hattı</label>
          <input
            className={inputCls}
            value={v.whatsapp}
            disabled={!isOwner}
            onChange={(e) => set("whatsapp", e.target.value)}
            placeholder="+90 5XX XXX XX XX"
          />
          <p className="mt-1 text-xs text-ink/45">
            İlan detayındaki "WhatsApp'tan yaz" butonu bu numaraya gider; boşsa
            ofis telefonu kullanılır.
          </p>
        </div>

        <div className="mt-4">
          <label className={labelCls}>Vitrin adresi</label>
          <div className="flex gap-2">
            <input
              className={`${inputCls} font-mono text-xs`}
              value={showcaseUrl}
              readOnly
            />
            <button
              onClick={copyShowcase}
              className="shrink-0 rounded-lg border border-ink/20 bg-white px-3 text-ink/55 hover:border-ink/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              aria-label="Vitrin adresini kopyala"
            >
              {copiedShowcase ? (
                <Check size={16} className="text-brand-700" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-ink/45">
            Bu linki Instagram biyografine, Google işletme profiline ve
            kartvizite koy.
          </p>
        </div>

        {/* Hakkımızda / Vizyon — boş bırakılan alan vitrinde hiç görünmez */}
        <div className="mt-6 border-t border-ink/10 pt-5">
          <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/50">
            Hakkımızda Bölümü
          </p>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Başlık</label>
              <input
                className={inputCls}
                value={v.aboutTitle}
                disabled={!isOwner}
                maxLength={90}
                onChange={(e) => set("aboutTitle", e.target.value)}
                placeholder="Örn. Üç danışman, tek söz: künyesi neyse o."
              />
            </div>
            <div>
              <label className={labelCls}>Hikâye metni</label>
              <textarea
                className={`${inputCls} min-h-24`}
                value={v.aboutText}
                disabled={!isOwner}
                maxLength={800}
                onChange={(e) => set("aboutText", e.target.value)}
                placeholder="Ofisinizin hikâyesi, çalışma prensibiniz…"
              />
            </div>
            <div>
              <label className={labelCls}>Vizyon cümlesi</label>
              <input
                className={inputCls}
                value={v.visionText}
                disabled={!isOwner}
                maxLength={200}
                onChange={(e) => set("visionText", e.target.value)}
                placeholder="Tırnak içinde, tek çarpıcı cümle."
              />
            </div>
            <div>
              <label className={labelCls}>
                İstatistik plakaları (en fazla 3)
              </label>
              <div className="space-y-2">
                {v.aboutStats.map((st, i) => (
                  <div key={i} className="grid grid-cols-[100px_1fr] gap-2">
                    <input
                      className={inputCls}
                      value={st.value}
                      disabled={!isOwner}
                      maxLength={12}
                      placeholder={["15", "340+", "%92"][i] ?? "Değer"}
                      onChange={(e) => {
                        const next = v.aboutStats.map((x, j) =>
                          j === i ? { ...x, value: e.target.value } : x,
                        );
                        set("aboutStats", next);
                      }}
                    />
                    <input
                      className={inputCls}
                      value={st.label}
                      disabled={!isOwner}
                      maxLength={24}
                      placeholder={
                        ["Yıl", "Tamamlanan satış", "Tavsiye oranı"][i] ??
                        "Etiket"
                      }
                      onChange={(e) => {
                        const next = v.aboutStats.map((x, j) =>
                          j === i ? { ...x, label: e.target.value } : x,
                        );
                        set("aboutStats", next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <label className="flex items-center justify-between rounded-lg bg-ink/[0.04] px-4 py-3">
              <span className="text-sm font-medium text-ink/80">
                Ekibi vitrinde göster (aktif üyeler, baş harf avatarıyla)
              </span>
              <input
                type="checkbox"
                checked={v.showTeam}
                disabled={!isOwner}
                onChange={(e) => set("showTeam", e.target.checked)}
                className="h-5 w-5 rounded border-ink/25 accent-[#1e5b3e]"
              />
            </label>
          </div>
        </div>
      </section>

      {/* Portal / XML */}
      <section className={sectionCls}>
        <h2 className={headCls}>Portal Yayını (XML Feed)</h2>
        <div className="space-y-3">
          {(
            [
              ["portalSahibinden", "Sahibinden.com"],
              ["portalHepsiemlak", "Hepsiemlak"],
              ["portalEmlakjet", "Emlakjet"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center justify-between rounded-xl bg-ink/[0.04] px-4 py-3"
            >
              <span className="text-sm font-medium text-ink/80">{label}</span>
              <input
                type="checkbox"
                checked={v[key]}
                disabled={!isOwner}
                onChange={(e) => set(key, e.target.checked)}
                className="h-5 w-5 rounded border-ink/25 accent-[#3b55e6]"
              />
            </label>
          ))}
        </div>

        <div className="mt-4">
          <label className={labelCls}>Feed adresi</label>
          <div className="flex gap-2">
            <input
              className={`${inputCls} font-mono text-xs`}
              value={feedUrl}
              readOnly
            />
            <button
              onClick={copyFeed}
              className="shrink-0 rounded-xl bg-white px-3 text-ink/55 ring-1 ring-ink/20 hover:bg-ink/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              aria-label="Feed adresini kopyala"
            >
              {copied ? (
                <Check size={16} className="text-emerald-600" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-ink/45">
            Bu adresi portal panelindeki "XML ile ilan aktarımı" alanına
            yapıştıracaksın. Feed çıkışı bir sonraki güncellemeyle aktifleşecek;
            açık portallardaki YAYINDA durumundaki ilanlar otomatik aktarılacak.
          </p>
        </div>
      </section>

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          ✓ Ayarlar kaydedildi.
        </p>
      )}

      {isOwner && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-selvi rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
        >
          {saving ? "Kaydediliyor…" : "Ayarları kaydet"}
        </button>
      )}
    </div>
  );
}
