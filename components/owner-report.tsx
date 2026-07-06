"use client";

import { useState } from "react";
import { FileText, Eye, MousePointerClick, PhoneCall } from "lucide-react";

interface Report {
  listingTitle: string;
  refCode: string;
  domDays: number;
  impressions: number;
  views: number;
  clicks: number;
  contacts: number;
  viewsChangePct: number | null;
  marketMedianSqm: number | null;
  marketAvgDom: number | null;
  askingSqm: number | null;
}

type Owner = { id: string; name: string; phone: string | null };

const tl = new Intl.NumberFormat("tr-TR");

export function OwnerReport({
  listingId,
  owners,
}: {
  listingId: string;
  owners: Owner[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [ownerId, setOwnerId] = useState<string>(
    owners.find((o) => o.phone)?.id ?? owners[0]?.id ?? "",
  );

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Rapor oluşturulamadı.");
      setReport(data.report);
      setSummary(data.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata.");
    } finally {
      setLoading(false);
    }
  }

  function waText(r: Report): string {
    const lines = [
      `📋 *${r.listingTitle}* (${r.refCode}) — Haftalık Durum Raporu`,
      ``,
      `👁 Detaylı görüntülenme: ${tl.format(r.views)}${
        r.viewsChangePct != null
          ? ` (geçen haftaya göre %${r.viewsChangePct >= 0 ? "+" : ""}${r.viewsChangePct})`
          : ""
      }`,
      `📞 İletişim talebi: ${tl.format(r.contacts)}`,
      `📅 Yayında: ${r.domDays} gün`,
    ];
    if (r.askingSqm && r.marketMedianSqm) {
      lines.push(
        `💰 m² fiyatınız: ${tl.format(r.askingSqm)} ₺ · bölge medyanı: ${tl.format(r.marketMedianSqm)} ₺`,
      );
    }
    lines.push("", summary);
    return lines.join("\n");
  }

  const owner = owners.find((o) => o.id === ownerId);
  const waHref =
    report && owner?.phone
      ? `https://wa.me/${owner.phone.replace(/\D/g, "").replace(/^0/, "90")}?text=${encodeURIComponent(
          waText(report),
        )}`
      : null;

  const KPIS = report
    ? [
        { label: "Görüntülenme", value: report.views, icon: Eye },
        { label: "Tıklama", value: report.clicks, icon: MousePointerClick },
        { label: "Talep", value: report.contacts, icon: PhoneCall },
      ]
    : [];

  return (
    <section className="rounded-2xl border border-ink/15 bg-white p-5">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
          <FileText size={15} />
        </span>
        <h2 className="text-sm font-bold text-ink/80">Mülk Sahibi Raporu</h2>
      </div>
      <p className="mb-3 text-xs text-ink/50">
        Bu haftaki ilgi ve pazar durumu — mülk sahibine WhatsApp'tan gönderin.
      </p>

      {!report && (
        <button
          onClick={run}
          disabled={loading}
          className="btn-selvi rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {loading ? "Hazırlanıyor…" : "Haftalık rapor oluştur"}
        </button>
      )}
      {error && (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
          {error}
        </p>
      )}

      {report && (
        <div className="print-report space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {KPIS.map((k) => (
              <div
                key={k.label}
                className="rounded-xl border border-ink/10 bg-slate-50 p-3 text-center"
              >
                <k.icon size={15} className="mx-auto text-ink/45" />
                <p className="mt-1 font-display text-xl font-extrabold">
                  {tl.format(k.value)}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-wider text-ink/45">
                  {k.label}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink/60">
            <span>
              Yayında: <b>{report.domDays} gün</b>
              {report.marketAvgDom != null &&
                ` (bölge ort. ${Math.round(report.marketAvgDom)} gün)`}
            </span>
            {report.viewsChangePct != null && (
              <span>
                Haftalık ilgi:{" "}
                <b
                  className={
                    report.viewsChangePct >= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }
                >
                  %{report.viewsChangePct >= 0 ? "+" : ""}
                  {report.viewsChangePct}
                </b>
              </span>
            )}
            {report.askingSqm && report.marketMedianSqm && (
              <span>
                m² fiyatı: <b>{tl.format(report.askingSqm)} ₺</b> · medyan{" "}
                {tl.format(report.marketMedianSqm)} ₺
              </span>
            )}
          </div>

          {summary && (
            <p className="rounded-lg border border-ink/10 bg-brand-50/50 px-3 py-2 text-sm leading-relaxed text-ink/75">
              {summary}
            </p>
          )}

          {/* Gönderim */}
          <div className="flex flex-wrap items-center gap-2 border-t border-ink/10 pt-3 print:hidden">
            {owners.length > 0 && (
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="rounded-lg border border-ink/20 px-2.5 py-2 text-xs focus:outline-none"
              >
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                    {o.phone ? "" : " (telefon yok)"}
                  </option>
                ))}
              </select>
            )}
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
              >
                WhatsApp ile gönder
              </a>
            ) : (
              <span className="text-xs text-ink/40">
                {owners.length === 0
                  ? "Mülk sahibi kişisi (SELLER/LANDLORD) ekleyin."
                  : "Seçili kişinin telefonu yok."}
              </span>
            )}
            <button
              onClick={() => window.print()}
              className="rounded-lg border border-ink/20 px-4 py-2 text-sm font-semibold text-ink/65 hover:bg-ink/[0.04]"
            >
              Yazdır / PDF
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
