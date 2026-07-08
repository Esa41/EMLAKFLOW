"use client";

import dynamic from "next/dynamic";

export const DroneMapFlyover = dynamic(
  () => import("@/components/drone-map-flyover").then((m) => m.DroneMapFlyover),
  {
    ssr: false,
    loading: () => (
      <div className="h-[340px] animate-pulse rounded-[10px] bg-brand-50" aria-hidden />
    ),
  },
);

export const ShowcaseMapLazy = dynamic(
  () => import("@/components/showcase-map").then((m) => m.ShowcaseMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] animate-pulse rounded-[10px] bg-brand-50" aria-hidden />
    ),
  },
);
