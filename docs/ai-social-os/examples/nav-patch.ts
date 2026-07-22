/**
 * Patch sketch for components/nav-items.ts — grouped Growth nav.
 * Implement when Social OS routes exist; keep hrefs stable.
 */

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Sparkles,
  CalendarRange,
  Images,
  Megaphone,
  Workflow,
  ShieldCheck,
  BarChart3,
  Radar,
  Palette,
  Plug,
  MessagesSquare,
} from "lucide-react";

export type NavGroup = {
  id: "work" | "growth" | "manage";
  label: string;
  items: { href: string; label: string; icon: LucideIcon }[];
};

export function getGroupedNav(vertical?: string | null): NavGroup[] {
  void vertical;
  return [
    {
      id: "growth",
      label: "Büyüme",
      items: [
        { href: "/sosyal", label: "Sosyal", icon: LayoutDashboard },
        { href: "/sosyal/planlayici", label: "Planlayıcı", icon: Sparkles },
        { href: "/sosyal/takvim", label: "Takvim", icon: CalendarRange },
        { href: "/sosyal/sohbet", label: "AI Sohbet", icon: MessagesSquare },
        { href: "/sosyal/medya", label: "Medya", icon: Images },
        { href: "/sosyal/kampanyalar", label: "Kampanyalar", icon: Megaphone },
        { href: "/sosyal/otomasyon", label: "Otomasyon", icon: Workflow },
        { href: "/sosyal/onaylar", label: "Onay Merkezi", icon: ShieldCheck },
        { href: "/sosyal/analitik", label: "Sosyal Analitik", icon: BarChart3 },
        { href: "/sosyal/rakipler", label: "Rakipler", icon: Radar },
        { href: "/sosyal/marka", label: "Marka Merkezi", icon: Palette },
        { href: "/sosyal/entegrasyonlar", label: "Entegrasyonlar", icon: Plug },
      ],
    },
  ];
}

/** Temporary: keep /icerik → redirect in next.config or page */
export const SOCIAL_LEGACY_REDIRECT = {
  source: "/icerik",
  destination: "/sosyal",
  permanent: false,
} as const;
