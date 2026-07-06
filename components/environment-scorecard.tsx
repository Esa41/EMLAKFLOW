import {
  TrainFront,
  Bus,
  GraduationCap,
  HeartPulse,
  Trees,
  ShoppingCart,
} from "lucide-react";
import type { EnvironmentResult } from "@/lib/environment";

/**
 * Çevresel Değerlendirme Puanı kartı — hem vitrin ilan detayında hem
 * emlakçı panelinde kullanılır. Salt görüntüleme (server-safe).
 */

const ICONS: Record<string, typeof Bus> = {
  rail: TrainFront,
  bus: Bus,
  education: GraduationCap,
  health: HeartPulse,
  park: Trees,
  market: ShoppingCart,
};

function fmtDist(m: number | null): string {
  if (m == null) return "bulunamadı";
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

function scoreLabel(score: number): { text: string; cls: string } {
  if (score >= 75) return { text: "Mükemmel Konum", cls: "text-emerald-600" };
  if (score >= 50) return { text: "İyi Konum", cls: "text-brand-600" };
  if (score >= 30) return { text: "Orta Konum", cls: "text-amber-600" };
  return { text: "Sakin Bölge", cls: "text-ink/50" };
}

export function EnvironmentScorecard({
  score,
  data,
}: {
  score: number;
  data: EnvironmentResult;
}) {
  const label = scoreLabel(score);
  return (
    <div className="rounded-[10px] border border-ink/15 bg-white p-5">
      <div className="flex items-center gap-4">
        {/* Toplam puan halkası */}
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              className="stroke-ink/10"
              strokeWidth="3.5"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              className="stroke-brand-600"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 97.4} 97.4`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-lg font-extrabold">
            {score}
          </span>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">
            Çevresel Değerlendirme Puanı
          </p>
          <p className={`font-display text-lg font-extrabold ${label.cls}`}>
            {label.text}
          </p>
          <p className="text-xs text-ink/45">
            Ulaşım, eğitim, sağlık ve yaşam noktalarına yakınlığa göre
            hesaplanır (OpenStreetMap verisi).
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {data.categories.map((c) => {
          const Icon = ICONS[c.key] ?? Bus;
          const has = c.nearestDistance != null;
          return (
            <div
              key={c.key}
              className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${
                has ? "border-ink/10 bg-ink/[0.02]" : "border-dashed border-ink/10 opacity-60"
              }`}
            >
              <Icon
                size={18}
                className={has ? "text-brand-600" : "text-ink/30"}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{c.label}</p>
                <p className="truncate text-[11px] text-ink/55">
                  {has ? (
                    <>
                      En yakın: {fmtDist(c.nearestDistance)}
                      {c.nearestName ? ` — ${c.nearestName}` : ""}
                      {c.count > 1 ? ` · ${c.count} nokta` : ""}
                    </>
                  ) : (
                    "Yakında bulunamadı"
                  )}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[11px] font-bold text-ink/60">
                {c.score}/{c.maxScore}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
