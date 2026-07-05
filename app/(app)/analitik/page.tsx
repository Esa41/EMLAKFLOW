import Link from "next/link";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { ConversionFunnel, TrafficTrend } from "@/components/funnel-charts";
import { Eye, MousePointerClick, PhoneCall, MessageSquare, TrendingDown } from "lucide-react";

// Vitrin dönüşüm analitiği (Faz 1): son 30 günün ham eventleri üzerinden.
// Hacim büyüdüğünde okuma ListingDailyStat'a taşınır — sorgu arayüzü aynı kalır.

export const dynamic = "force-dynamic";

const DAYS = 30;

export default async function AnalitikPage() {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);

  const since = new Date(Date.now() - DAYS * 86400000);

  const [byType, byListing, listings, trendRaw] = await Promise.all([
    db.listingEvent.groupBy({
      by: ["type"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    db.listingEvent.groupBy({
      by: ["listingId", "type"],
      where: { createdAt: { gte: since }, listingId: { not: null } },
      _count: { _all: true },
    }),
    db.listing.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, refCode: true, title: true, createdAt: true },
    }),
    db.listingEvent.findMany({
      where: { createdAt: { gte: since }, type: { in: ["IMPRESSION", "VIEW"] } },
      select: { type: true, createdAt: true },
    }),
  ]);

  const total = (t: string) => byType.find((r) => r.type === t)?._count._all ?? 0;
  const imp = total("IMPRESSION");
  const view = total("VIEW");
  const click = total("CLICK");
  const contact = total("CONTACT");
  const chat = total("CHAT");

  const funnel = [
    { name: `Görünüm (${imp})`, value: imp },
    { name: `Detay (${view})`, value: view },
    { name: `Tıklama (${click})`, value: click },
    { name: `Talep (${contact})`, value: contact },
  ];

  // Kopuş analizi: en sert düşen adım
  const steps = [
    { from: "Görünüm", to: "Detay", a: imp, b: view },
    { from: "Detay", to: "Tıklama", a: view, b: click },
    { from: "Tıklama", to: "Talep", a: click, b: contact },
  ].map((s) => ({ ...s, rate: s.a > 0 ? s.b / s.a : null }));
  const worst = steps.filter((s) => s.rate !== null && s.a >= 10).sort((x, y) => x.rate! - y.rate!)[0];

  // Günlük trend
  const trendMap = new Map<string, { impressions: number; views: number }>();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    trendMap.set(d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }), {
      impressions: 0,
      views: 0,
    });
  }
  for (const e of trendRaw) {
    const key = e.createdAt.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
    const row = trendMap.get(key);
    if (!row) continue;
    if (e.type === "IMPRESSION") row.impressions++;
    else row.views++;
  }
  const trend = [...trendMap.entries()].map(([day, v]) => ({ day, ...v }));

  // İlan bazlı tablo
  const perListing = listings
    .map((l) => {
      const get = (t: string) =>
        byListing.find((r) => r.listingId === l.id && r.type === t)?._count._all ?? 0;
      const v = get("VIEW");
      const c = get("CONTACT");
      return {
        ...l,
        imp: get("IMPRESSION"),
        view: v,
        click: get("CLICK"),
        contact: c,
        dom: Math.floor((Date.now() - l.createdAt.getTime()) / 86400000),
      };
    })
    .sort((a, b) => b.view - a.view);

  const kpis = [
    { label: "Detay Görüntüleme", value: view, icon: Eye },
    { label: "Tıklama (Tel/WA)", value: click, icon: MousePointerClick },
    { label: "Talep (Form)", value: contact, icon: PhoneCall },
    { label: "Sohbet", value: chat, icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[27px] font-extrabold tracking-tight">Vitrin Analitiği</h1>
        <p className="mt-1 text-sm text-ink/55">
          Son {DAYS} gün — ziyaretçi görünümünden talebe dönüşüm hunisi.
        </p>
      </div>

      {/* KPI şeridi */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-ink/15 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-ink/50">
              <k.icon size={15} />
              <p className="font-mono text-[10px] uppercase tracking-wider">{k.label}</p>
            </div>
            <p className="mt-2 font-display text-2xl font-extrabold tracking-tight">
              {k.value.toLocaleString("tr-TR")}
            </p>
          </div>
        ))}
      </div>

      {/* Kopuş uyarısı */}
      {worst && worst.rate !== null && worst.rate < 0.15 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <TrendingDown size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-bold text-amber-800">
              En büyük kopuş: {worst.from} → {worst.to} (%{Math.round(worst.rate * 100)} dönüşüm)
            </p>
            <p className="mt-0.5 text-amber-700">
              {worst.from === "Görünüm" && "Kartlar görünüyor ama detaya girilmiyor — kapak fotoğrafı ve fiyat konumlandırmasını gözden geçirin."}
              {worst.from === "Detay" && "İlan detayı okunuyor ama iletişim tıklanmıyor — açıklama, fotoğraf seti veya fiyat beklentiyi karşılamıyor olabilir."}
              {worst.from === "Tıklama" && "Telefon/WhatsApp tıklanıyor ama form talebi gelmiyor — dönüşü hızlandırın, mesai dışı yönlendirme kurun."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-ink/15 bg-white p-5 shadow-sm">
          <h2 className="bolum mb-3">Dönüşüm Hunisi</h2>
          <ConversionFunnel data={funnel} />
        </section>
        <section className="rounded-xl border border-ink/15 bg-white p-5 shadow-sm">
          <h2 className="bolum mb-3">Günlük Trafik</h2>
          <TrafficTrend data={trend} />
        </section>
      </div>

      {/* İlan bazlı performans */}
      <section className="rounded-xl border border-ink/15 bg-white shadow-sm overflow-hidden">
        <h2 className="bolum border-b border-ink/10 px-5 py-4">İlan Performansı (aktif ilanlar)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left font-mono text-[10px] uppercase tracking-wider text-ink/45">
                <th className="px-5 py-2.5">İlan</th>
                <th className="px-3 py-2.5 text-right">Yayında (gün)</th>
                <th className="px-3 py-2.5 text-right">Görünüm</th>
                <th className="px-3 py-2.5 text-right">Detay</th>
                <th className="px-3 py-2.5 text-right">Tıklama</th>
                <th className="px-5 py-2.5 text-right">Talep</th>
              </tr>
            </thead>
            <tbody>
              {perListing.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-ink/45">
                    Aktif ilan yok.
                  </td>
                </tr>
              ) : (
                perListing.map((l) => (
                  <tr key={l.id} className="border-b border-ink/5 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/portfoy/${l.id}`} className="font-semibold hover:text-brand-700">
                        {l.title}
                      </Link>
                      <span className="ml-2 font-mono text-[10px] text-ink/40">{l.refCode}</span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono">{l.dom}</td>
                    <td className="px-3 py-3 text-right font-mono">{l.imp}</td>
                    <td className="px-3 py-3 text-right font-mono font-semibold">{l.view}</td>
                    <td className="px-3 py-3 text-right font-mono">{l.click}</td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-brand-700">{l.contact}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
