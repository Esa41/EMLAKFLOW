"use client";

import dynamic from "next/dynamic";
import type { FunnelDatum, TrendDatum } from "./funnel-charts-types";

const ConversionFunnelChart = dynamic(
  () => import("./funnel-charts-inner").then((m) => m.ConversionFunnelChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 animate-pulse items-center justify-center rounded-lg bg-brand-50/50 text-sm text-ink/45">
        Grafik yükleniyor…
      </div>
    ),
  },
);

const TrafficTrendChart = dynamic(
  () => import("./funnel-charts-inner").then((m) => m.TrafficTrendChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 animate-pulse items-center justify-center rounded-lg bg-brand-50/50 text-sm text-ink/45">
        Grafik yükleniyor…
      </div>
    ),
  },
);

export function ConversionFunnel({ data }: { data: FunnelDatum[] }) {
  return <ConversionFunnelChart data={data} />;
}

export function TrafficTrend({ data }: { data: TrendDatum[] }) {
  return <TrafficTrendChart data={data} />;
}

export type { FunnelDatum, TrendDatum };
