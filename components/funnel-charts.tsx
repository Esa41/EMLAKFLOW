"use client";

import {
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const BRAND = ["#166534", "#15803d", "#16a34a", "#4ade80"]; // brand yeşil tonları

export type FunnelDatum = { name: string; value: number };
export type TrendDatum = { day: string; views: number; impressions: number };

export function ConversionFunnel({ data }: { data: FunnelDatum[] }) {
  // Recharts Funnel 0 değerlerde çizim yapamıyor → min 0.0001 hile değil,
  // görünür kalması için değeri olduğu gibi bırakıp boş durumu üstte ele alıyoruz.
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-ink/45">
        Henüz vitrin trafiği ölçülmedi — veriler ziyaretçi geldikçe birikecek.
      </div>
    );
  }
  const colored = data.map((d, i) => ({ ...d, fill: BRAND[i % BRAND.length] }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <FunnelChart>
        <Tooltip
          formatter={(v, name) => [Number(v ?? 0).toLocaleString("tr-TR"), String(name ?? "")]}
          contentStyle={{ borderRadius: 8, fontSize: 13 }}
        />
        <Funnel dataKey="value" data={colored} isAnimationActive={false}>
          <LabelList
            position="right"
            dataKey="name"
            fill="#1c1c1c"
            stroke="none"
            style={{ fontSize: 12, fontWeight: 600 }}
          />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}

export function TrafficTrend({ data }: { data: TrendDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="gImp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gView" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#166534" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#166534" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
        <Area
          type="monotone"
          dataKey="impressions"
          name="Görünüm"
          stroke="#16a34a"
          fill="url(#gImp)"
          strokeWidth={1.5}
        />
        <Area
          type="monotone"
          dataKey="views"
          name="Detay görüntüleme"
          stroke="#166534"
          fill="url(#gView)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
