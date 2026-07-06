"use client";

import { useState } from "react";
import { MapPinned, RefreshCw } from "lucide-react";
import type { EnvironmentResult } from "@/lib/environment";
import { EnvironmentScorecard } from "./environment-scorecard";

/**
 * Emlakçı paneli — Konum ve Çevre Analizörü.
 * Konum kaydedilince otomatik çalışır; buradan elle de tetiklenebilir.
 */
export function EnvironmentPanel({
  listingId,
  hasLocation,
  initialScore,
  initialData,
}: {
  listingId: string;
  hasLocation: boolean;
  initialScore: number | null;
  initialData: EnvironmentResult | null;
}) {
  const [score, setScore] = useState(initialScore);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${listingId}/environment`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Analiz yapılamadı.");
      setScore(json.environment.score);
      setData(json.environment);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analiz yapılamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-ink/15 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="bolum flex items-center gap-2">
          <MapPinned size={16} className="text-brand-600" />
          Konum ve Çevre Analizi
        </h2>
        <button
          onClick={analyze}
          disabled={loading || !hasLocation}
          className="flex items-center gap-1.5 rounded-xl border border-brand-600/40 px-3.5 py-2 text-xs font-bold text-brand-700 hover:bg-brand-50 disabled:opacity-40"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          {loading ? "Analiz ediliyor…" : data ? "Yeniden Analiz Et" : "Analiz Et"}
        </button>
      </div>

      {!hasLocation && (
        <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          Çevre analizi için önce ilan formundan haritada konum işaretleyin.
        </p>
      )}
      {error && (
        <p className="mb-3 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
          {error}
        </p>
      )}
      {score != null && data ? (
        <EnvironmentScorecard score={score} data={data} />
      ) : (
        hasLocation &&
        !error && (
          <p className="text-sm text-ink/55">
            Henüz analiz yapılmadı. &quot;Analiz Et&quot; ile mülkün çevresindeki
            metro, otobüs, okul, hastane, park ve market noktaları taranır ve
            ilan vitrininde &quot;Çevresel Değerlendirme Puanı&quot; olarak
            görünür.
          </p>
        )
      )}
    </section>
  );
}
