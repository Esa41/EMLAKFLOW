"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Calendar,
  Clock,
  FileText,
  Users,
  Building2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Plus,
  Loader2,
  Palette,
} from "lucide-react";

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  plan: string;
  proStartedAt: string | null;
  proExpiresAt: string | null;
  adminNotes: string | null;
  city: string | null;
  district: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  customDomain: string | null;
  brandName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  brandColor: string | null;
  _count: {
    listings: number;
    users: number;
    deals: number;
    contacts: number;
    leads: number;
  };
  users: Array<{
    email: string;
    name: string;
    createdAt: string;
  }>;
  planChanges: Array<{
    id: string;
    fromPlan: string;
    toPlan: string;
    changedBy: string | null;
    reason: string | null;
    expiresAt: string | null;
    createdAt: string;
  }>;
}

export function AdminTenantDetailModal({
  tenantId,
  onClose,
}: {
  tenantId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [extendDays, setExtendDays] = useState("30");
  const [extending, setExtending] = useState(false);
  const [expiresDate, setExpiresDate] = useState("");
  const [savingExpires, setSavingExpires] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [wl, setWl] = useState({
    customDomain: "",
    brandName: "",
    logoUrl: "",
    primaryColor: "#1e5b3e",
  });
  const [savingWl, setSavingWl] = useState(false);

  function toDateInputValue(iso: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function applyWhiteLabelForm(t: TenantDetail) {
    setWl({
      customDomain: t.customDomain ?? "",
      brandName: t.brandName ?? "",
      logoUrl: t.logoUrl ?? "",
      primaryColor: t.primaryColor || t.brandColor || "#1e5b3e",
    });
  }

  async function reloadTenant() {
    const res = await fetch(`/api/admin/tenants/${tenantId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Yüklenemedi");
    setTenant(data.tenant);
    setNotes(data.tenant.adminNotes || "");
    setExpiresDate(toDateInputValue(data.tenant.proExpiresAt));
    applyWhiteLabelForm(data.tenant);
    return data.tenant as TenantDetail;
  }

  useEffect(() => {
    fetch(`/api/admin/tenants/${tenantId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTenant(data.tenant);
        setNotes(data.tenant.adminNotes || "");
        setExpiresDate(toDateInputValue(data.tenant.proExpiresAt));
        applyWhiteLabelForm(data.tenant);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [tenantId]);

  async function saveNotes() {
    setSavingNotes(true);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTenant((prev) => (prev ? { ...prev, adminNotes: notes } : null));
      setActionMsg("Notlar kaydedildi.");
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Kaydedilemedi");
    } finally {
      setSavingNotes(false);
    }
  }

  async function saveWhiteLabel() {
    setSavingWl(true);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customDomain: wl.customDomain.trim() || null,
          brandName: wl.brandName.trim() || null,
          logoUrl: wl.logoUrl.trim() || null,
          primaryColor: wl.primaryColor.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await reloadTenant();
      router.refresh();
      setActionMsg("White-label ayarları kaydedildi.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Kaydedilemedi");
    } finally {
      setSavingWl(false);
    }
  }

  async function extendPro(daysOverride?: number) {
    const days = daysOverride ?? parseInt(extendDays, 10);
    if (!Number.isFinite(days) || days === 0) {
      alert("Geçerli gün sayısı girin (pozitif ekler, negatif düşer).");
      return;
    }
    setExtending(true);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/extend-pro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await reloadTenant();
      router.refresh();
      setActionMsg(
        days > 0
          ? `${days} gün eklendi.`
          : `${Math.abs(days)} gün düşüldü.`,
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Hata");
    } finally {
      setExtending(false);
    }
  }

  async function saveExpiresDate() {
    setSavingExpires(true);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proExpiresAt: expiresDate.trim() ? expiresDate.trim() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await reloadTenant();
      router.refresh();
      setActionMsg(
        expiresDate.trim()
          ? "Bitiş tarihi güncellendi."
          : "Bitiş tarihi temizlendi.",
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Hata");
    } finally {
      setSavingExpires(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 size={32} className="animate-spin" />
          <p className="text-sm font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="rounded-2xl bg-white p-6 shadow-2xl">
          <p className="text-rose-600">{error || "Ofis bulunamadı"}</p>
          <button
            onClick={onClose}
            className="mt-4 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            Kapat
          </button>
        </div>
      </div>
    );
  }

  const isPro = tenant.plan === "pro";
  const owner = tenant.users[0];
  const now = new Date();
  const proExpired =
    tenant.proExpiresAt && new Date(tenant.proExpiresAt) < now;
  
  const daysLeft = tenant.proExpiresAt
    ? Math.ceil((new Date(tenant.proExpiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-ink/10 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-indigo-100 font-display text-2xl font-bold text-brand-700">
              {tenant.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display text-2xl font-extrabold text-ink">
                {tenant.name}
              </h2>
              <p className="mt-0.5 text-sm text-ink/50">/{tenant.slug}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-ink/5"
          >
            <X size={20} className="text-ink/50" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          {/* Sol: İstatistikler & Bilgiler */}
          <div className="space-y-6 lg:col-span-2">
            {/* Plan Badge */}
            <div className="flex items-center gap-3">
              <span
                className={
                  isPro
                    ? "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white shadow-md"
                    : "inline-flex items-center gap-1.5 rounded-full bg-ink/[0.08] px-4 py-2 text-sm font-bold uppercase tracking-wide text-ink/55"
                }
              >
                {isPro && <Sparkles size={14} />}
                {tenant.plan}
              </span>
              {proExpired && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-700">
                  Süresi doldu
                </span>
              )}
            </div>

            {/* Tarihler */}
            {tenant.proStartedAt && (
              <div className="space-y-2 rounded-xl border border-ink/10 bg-gradient-to-br from-emerald-50/50 to-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink/70">
                  <Calendar size={16} />
                  Pro Başlangıç
                </div>
                <p className="text-lg font-bold text-ink">
                  {new Date(tenant.proStartedAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}

            {tenant.proExpiresAt && (
              <div
                className={`space-y-2 rounded-xl border p-4 ${
                  proExpired
                    ? "border-rose-200 bg-gradient-to-br from-rose-50/50 to-white"
                    : daysLeft && daysLeft <= 7
                    ? "border-amber-200 bg-gradient-to-br from-amber-50/50 to-white"
                    : "border-ink/10 bg-gradient-to-br from-blue-50/50 to-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink/70">
                    <Clock size={16} />
                    Pro Bitiş
                  </div>
                  {daysLeft !== null && !proExpired && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        daysLeft <= 7
                          ? "bg-amber-100 text-amber-700"
                          : daysLeft <= 30
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {daysLeft} gün kaldı
                    </span>
                  )}
                  {proExpired && (
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                      Süresi doldu
                    </span>
                  )}
                </div>
                <p
                  className={`text-lg font-bold ${
                    proExpired
                      ? "text-rose-600"
                      : daysLeft && daysLeft <= 7
                      ? "text-amber-700"
                      : "text-ink"
                  }`}
                >
                  {new Date(tenant.proExpiresAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}

            {/* Pro Süre Yönetimi */}
            <div className="space-y-4 rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50/30 to-white p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-brand-700">
                <Plus size={16} />
                Pro Süre Yönetimi
              </div>

              {actionMsg && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                  {actionMsg}
                </div>
              )}

              {/* Mutlak bitiş tarihi — yanlış eklemeyi düzeltmek için */}
              <div className="space-y-2 rounded-lg border border-ink/10 bg-white p-3">
                <label className="text-xs font-bold uppercase tracking-wider text-ink/55">
                  Bitiş tarihini ayarla
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="date"
                    value={expiresDate}
                    onChange={(e) => setExpiresDate(e.target.value)}
                    className="min-w-[160px] flex-1 rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                  <button
                    type="button"
                    onClick={saveExpiresDate}
                    disabled={savingExpires}
                    className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-ink/90 disabled:opacity-50"
                  >
                    {savingExpires ? "Kaydediliyor..." : "Tarihi kaydet"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExpiresDate("");
                      void (async () => {
                        setSavingExpires(true);
                        setActionMsg(null);
                        try {
                          const res = await fetch(
                            `/api/admin/tenants/${tenantId}`,
                            {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ proExpiresAt: null }),
                            },
                          );
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error);
                          await reloadTenant();
                          router.refresh();
                          setActionMsg("Bitiş tarihi temizlendi.");
                        } catch (err: unknown) {
                          alert(
                            err instanceof Error ? err.message : "Hata",
                          );
                        } finally {
                          setSavingExpires(false);
                        }
                      })();
                    }}
                    disabled={savingExpires || !tenant.proExpiresAt}
                    className="rounded-lg border border-ink/20 px-3 py-2 text-xs font-bold text-ink/60 hover:bg-ink/[0.03] disabled:opacity-40"
                  >
                    Temizle
                  </button>
                </div>
                <p className="text-[11px] text-ink/45">
                  Yanlış eklenen süreyi buradan doğrudan doğru tarihe çekebilirsiniz.
                </p>
              </div>

              {/* Hızlı Seçenekler */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setExtendDays("30");
                    void extendPro(30);
                  }}
                  disabled={extending}
                  className="rounded-lg border-2 border-brand-200 bg-white px-3 py-2 text-center transition-all hover:border-brand-400 hover:bg-brand-50 disabled:opacity-50"
                >
                  <div className="text-lg font-extrabold text-brand-700">+30</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-ink/50">
                    Gün
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExtendDays("90");
                    void extendPro(90);
                  }}
                  disabled={extending}
                  className="rounded-lg border-2 border-indigo-200 bg-white px-3 py-2 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-50"
                >
                  <div className="text-lg font-extrabold text-indigo-700">+90</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-ink/50">
                    Gün
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExtendDays("365");
                    void extendPro(365);
                  }}
                  disabled={extending}
                  className="rounded-lg border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white px-3 py-2 text-center shadow-sm transition-all hover:border-emerald-400 hover:shadow-md disabled:opacity-50"
                >
                  <div className="text-lg font-extrabold text-emerald-700">+1 YIL</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                    365 Gün
                  </div>
                </button>
              </div>

              {/* Manuel ekle / düş */}
              <div className="flex flex-wrap gap-2">
                <input
                  type="number"
                  min={-3650}
                  max={3650}
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  className="min-w-[100px] flex-1 rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Gün (±)"
                />
                <button
                  type="button"
                  onClick={() => void extendPro()}
                  disabled={extending}
                  className="rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                >
                  {extending ? "Uygulanıyor..." : "Uygula"}
                </button>
                <button
                  type="button"
                  onClick={() => void extendPro(-30)}
                  disabled={extending}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
                >
                  −30 gün
                </button>
              </div>
              <p className="text-xs text-ink/50">
                Pozitif gün ekler, negatif gün düşer (ör. −30). Modal kapanmaz; sonucu hemen görürsünüz.
              </p>
            </div>

            {/* İstatistikler */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "İlan", value: tenant._count.listings, icon: FileText },
                { label: "Kullanıcı", value: tenant._count.users, icon: Users },
                { label: "Fırsat", value: tenant._count.deals, icon: Building2 },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-ink/10 bg-white p-3 shadow-sm"
                >
                  <div className="mb-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                    <stat.icon size={16} />
                  </div>
                  <p className="text-2xl font-extrabold text-ink">{stat.value}</p>
                  <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-ink/50">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Detaylar */}
            <div className="space-y-3 rounded-xl border border-ink/10 bg-white p-4">
              <h3 className="text-sm font-bold text-ink/70">Ofis Bilgileri</h3>
              <div className="space-y-2 text-sm">
                {owner && (
                  <div className="flex items-start gap-2">
                    <Mail size={16} className="mt-0.5 shrink-0 text-ink/40" />
                    <div>
                      <div className="font-medium text-ink">{owner.email}</div>
                      <div className="text-xs text-ink/50">{owner.name}</div>
                    </div>
                  </div>
                )}
                {tenant.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="shrink-0 text-ink/40" />
                    <span className="text-ink/70">{tenant.phone}</span>
                  </div>
                )}
                {tenant.city && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="shrink-0 text-ink/40" />
                    <span className="text-ink/70">
                      {tenant.city}
                      {tenant.district ? ` / ${tenant.district}` : ""}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="shrink-0 text-ink/40" />
                  <span className="text-ink/70">
                    Kayıt:{" "}
                    {new Date(tenant.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ: White-label, Notlar & Geçmiş */}
          <div className="space-y-6">
            {/* White-label — yalnızca Super Admin */}
            <div className="space-y-3 rounded-xl border border-ink/10 bg-gradient-to-br from-ink/[0.02] to-white p-4">
              <div className="flex items-center gap-2">
                <Palette size={16} className="text-ink/50" />
                <h3 className="text-sm font-bold text-ink/70">White-label</h3>
              </div>
              <p className="text-[11px] leading-relaxed text-ink/45">
                Özel alan adı ve markalama. DNS / Vercel yönlendirmesi ayrıca
                yapılır; burada yalnızca kayıt tutulur.
              </p>
              <div className="space-y-2.5">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink/45">
                    Özel alan adı
                  </label>
                  <input
                    type="text"
                    value={wl.customDomain}
                    onChange={(e) =>
                      setWl((s) => ({ ...s, customDomain: e.target.value }))
                    }
                    placeholder="www.emlakofisi.com"
                    className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink/45">
                    Marka adı
                  </label>
                  <input
                    type="text"
                    value={wl.brandName}
                    onChange={(e) =>
                      setWl((s) => ({ ...s, brandName: e.target.value }))
                    }
                    placeholder="Atlas Gayrimenkul"
                    className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink/45">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={wl.logoUrl}
                    onChange={(e) =>
                      setWl((s) => ({ ...s, logoUrl: e.target.value }))
                    }
                    placeholder="https://media.emlakflow.app/..."
                    className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                  {wl.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={wl.logoUrl}
                      alt="Logo önizleme"
                      className="mt-2 h-10 max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink/45">
                    Ana renk
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={
                        /^#([0-9A-Fa-f]{6})$/.test(wl.primaryColor)
                          ? wl.primaryColor
                          : "#1e5b3e"
                      }
                      onChange={(e) =>
                        setWl((s) => ({
                          ...s,
                          primaryColor: e.target.value,
                        }))
                      }
                      className="h-10 w-12 cursor-pointer rounded-lg border border-ink/20 bg-white p-1"
                    />
                    <input
                      type="text"
                      value={wl.primaryColor}
                      onChange={(e) =>
                        setWl((s) => ({
                          ...s,
                          primaryColor: e.target.value,
                        }))
                      }
                      placeholder="#1e5b3e"
                      className="flex-1 rounded-lg border border-ink/20 px-3 py-2 font-mono text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void saveWhiteLabel()}
                disabled={savingWl}
                className="w-full rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ink/90 disabled:opacity-50"
              >
                {savingWl ? "Kaydediliyor..." : "White-label kaydet"}
              </button>
            </div>

            {/* Admin Notları */}
            <div className="space-y-3 rounded-xl border border-ink/10 bg-white p-4">
              <h3 className="text-sm font-bold text-ink/70">Admin Notları</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[120px] w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder="Özel notlar..."
              />
              <button
                onClick={saveNotes}
                disabled={savingNotes || notes === tenant.adminNotes}
                className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
              >
                {savingNotes ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>

            {/* Plan Geçmişi */}
            <div className="space-y-3 rounded-xl border border-ink/10 bg-white p-4">
              <h3 className="text-sm font-bold text-ink/70">Plan Geçmişi</h3>
              <div className="space-y-2">
                {tenant.planChanges.length === 0 ? (
                  <p className="text-xs text-ink/40">Henüz değişiklik yok</p>
                ) : (
                  tenant.planChanges.map((change) => (
                    <div
                      key={change.id}
                      className="border-l-2 border-brand-200 pl-3 text-xs"
                    >
                      <div className="font-semibold text-ink">
                        {change.fromPlan} → {change.toPlan}
                      </div>
                      {change.reason && (
                        <div className="text-ink/60">{change.reason}</div>
                      )}
                      <div className="mt-1 text-ink/40">
                        {new Date(change.createdAt).toLocaleDateString("tr-TR")} ·{" "}
                        {change.changedBy || "Sistem"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
