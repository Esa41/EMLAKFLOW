"use client";

import { useState } from "react";
import { Sparkles, TrendingUp } from "lucide-react";

interface Band {
  low: number;
  mid: number;
  high: number;
  medianSqm: number;
  confidence: "low" | "medium" | "high";
  sampleSize: number;
}

const tl = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

const CONF_TR = { low: "Düşük", medium: "Orta", high: "Yüksek" } as const;

export function PriceAdvisor({
  listingId,
  currentPrice,
}: {
  listingId: string;
  currentPrice: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [band, setBand] = useState<Band | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [ran, setRan] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/price-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analiz yapılamadı.");
      setBand(data.band);
      setAdvice(data.advice);
      setRan(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata.");
    } finally {
      setLoading(false);
    }
  }

  // Mevcut fiyatın bant içindeki konumu (%)
  const pos =
    band && band.high > band.low
      ? Math.min(
          100,
          Math.max(0, ((currentPrice - band.low) / (band.high - band.low)) * 100),
        )
      : null;

  return (
    <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-indigo-50 p-5">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-indigo-500 text-white">
          <TrendingUp size={15} />
        </span>
        <h3 className="text-sm font-bold text-ink/80">Fiyatlama Danışmanı</h3>
        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-600">
          AI
        </span>
      </div>
      <p className="mb-3 text-xs text-ink/50">
        Benzer ilanların m² fiyatından piyasa değeri bandını hesaplar ve öneri sunar.
      </p>

      {!ran && (
        <button
          onClick={run}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:brightness-110 disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Analiz ediliyor…
            </>
          ) : (
            <>
              <Sparkles size={15} /> Fiyat analizini çalıştır
            </>
          )}
        </button>
      )}

      {error && (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
          {error}
        </p>
      )}

      {ran && band && (
        <div className="space-y-3">
          {/* Bant çubuğu */}
          <div>
            <div className="relative mt-2 h-2 rounded-full bg-gradient-to-r from-emerald-300 via-amber-300 to-rose-300">
              {pos != null && (
                <div
                  className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-ink shadow"
                  style={{ left: `${pos}%` }}
                  title="Mevcut fiyat"
                />
              )}
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[11px] text-ink/55">
              <span>{tl.format(band.low)}</span>
              <span className="font-bold text-ink/75">{tl.format(band.mid)}</span>
              <span>{tl.format(band.high)}</span>
            </div>
          </div>
          <p className="text-[11px] text-ink/50">
            Medyan m² fiyatı: <b>{tl.format(band.medianSqm)}</b> · {band.sampleSize} emsal ·
            güven: {CONF_TR[band.confidence]}
          </p>
          {advice && (
            <p className="rounded-lg border border-brand-100 bg-white/70 px-3 py-2 text-sm leading-relaxed text-ink/75">
              {advice}
            </p>
          )}
        </div>
      )}

      {ran && !band && advice && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {advice}
        </p>
      )}
    </div>
  );
}
