/** Hafif SVG grafikler — URBN mono dashboard. Client lib yok. */

function pathFrom(values: number[], w: number, h: number, pad = 2) {
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / span) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function Sparkline({
  values,
  className = "",
  stroke = "currentColor",
}: {
  values: number[];
  className?: string;
  stroke?: string;
}) {
  const w = 96;
  const h = 36;
  const d = pathFrom(values.length ? values : [0, 0], w, h);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden>
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 0–100 yarım daire gauge (Smart Score). */
export function ScoreGauge({ score, className = "" }: { score: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = 42;
  const cx = 50;
  const cy = 50;
  const start = Math.PI;
  const end = 0;
  const angle = start + (end - start) * (clamped / 100);
  const arc = (a0: number, a1: number) => {
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };
  return (
    <svg viewBox="0 0 100 58" className={className} aria-hidden>
      <path d={arc(start, end)} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="8" strokeLinecap="round" />
      <path d={arc(start, angle)} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

export function LineChart({
  series,
  labels,
  className = "",
}: {
  series: { values: number[]; tone?: "ink" | "muted" }[];
  labels: string[];
  className?: string;
}) {
  const w = 520;
  const h = 180;
  const padX = 8;
  const padY = 16;
  const all = series.flatMap((s) => s.values);
  const min = Math.min(...all, 0);
  const max = Math.max(...all, 1);
  const span = max - min || 1;
  const avg = all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0;
  const avgY = h - padY - ((avg - min) / span) * (h - padY * 2);

  const toPath = (values: number[]) =>
    values
      .map((v, i) => {
        const x = padX + (i / Math.max(values.length - 1, 1)) * (w - padX * 2);
        const y = h - padY - ((v - min) / span) * (h - padY * 2);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[180px] w-full" role="img" aria-label="Satış grafiği">
        <line x1={padX} y1={avgY} x2={w - padX} y2={avgY} stroke="currentColor" strokeOpacity="0.18" strokeDasharray="4 6" />
        <text x={w - padX} y={avgY - 6} textAnchor="end" className="fill-current text-[10px]" opacity={0.4}>
          Ortalama
        </text>
        {series.map((s, idx) => (
          <path
            key={idx}
            d={toPath(s.values)}
            fill="none"
            stroke="currentColor"
            strokeOpacity={s.tone === "muted" ? 0.28 : 0.9}
            strokeWidth={s.tone === "muted" ? 1.5 : 2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-1 text-[11px] text-ink/40">
        {labels.map((l, i) => (
          <span
            key={`${l}-${i}`}
            className={
              labels.length > 6 && i % 2 === 1 && i !== labels.length - 1
                ? "invisible sm:visible"
                : undefined
            }
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BarPairChart({
  pairs,
  labels,
  className = "",
}: {
  pairs: { a: number; b: number }[];
  labels: string[];
  className?: string;
}) {
  const max = Math.max(...pairs.flatMap((p) => [p.a, p.b]), 1);
  return (
    <div className={className}>
      <div className="flex h-[180px] items-end gap-2.5 px-1">
        {pairs.map((p, i) => (
          <div key={labels[i] ?? i} className="flex flex-1 items-end justify-center gap-1">
            <div
              className="w-[42%] rounded-t-[3px] bg-ink transition-all dark:bg-white"
              style={{ height: `${Math.max(6, (p.a / max) * 100)}%` }}
              title={`${labels[i]} bu dönem: ${p.a}`}
            />
            <div
              className="w-[42%] rounded-t-[3px] bg-ink/25 transition-all dark:bg-white/30"
              style={{ height: `${Math.max(6, (p.b / max) * 100)}%` }}
              title={`${labels[i]} önceki: ${p.b}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between px-1 text-[11px] text-ink/40">
        {labels.map((l) => (
          <span key={l} className="flex-1 text-center">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
