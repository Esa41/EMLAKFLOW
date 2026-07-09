"use client";

import dynamic from "next/dynamic";
import { HeroShell } from "./hero-shell";

/** Mapbox + scrub — client-only; HeroShell anında FCP. */
const ScrubHeroLazy = dynamic(
  () => import("./scrub-hero").then((m) => m.ScrubHero),
  { ssr: false, loading: () => <HeroShell /> },
);

export function LandingHero() {
  return <ScrubHeroLazy />;
}
