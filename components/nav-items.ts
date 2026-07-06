import {
  LayoutDashboard,
  Building2,
  Car,
  Users,
  Contact,
  CalendarDays,
  Wallet,
  UsersRound,
  Settings,
  MessagesSquare,
  BarChart3,
  Bell,
  Activity,
  KeyRound,
  Clapperboard,
  type LucideIcon,
} from "lucide-react";
import { getVertical } from "@/lib/verticals";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Dikeye göre navigasyon — etiketler lib/verticals.ts'ten gelir. */
export function getNav(vertical?: string | null): NavItem[] {
  const v = getVertical(vertical);
  const isAuto = v.key === "AUTO_DEALER";
  return [
    { href: "/dashboard", label: "Bugün", icon: LayoutDashboard },
    { href: "/portfoy", label: v.labels.portfolio, icon: isAuto ? Car : Building2 },
    { href: "/musteriler", label: v.labels.pipeline, icon: Users },
    { href: "/kisiler", label: "Müşteriler", icon: Contact },
    { href: "/kiralar", label: v.labels.rentals, icon: KeyRound },
    { href: "/icerik", label: v.labels.social, icon: Clapperboard },
    { href: "/analitik", label: "Analitik", icon: BarChart3 },
    { href: "/bildirimler", label: "Bildirimler", icon: Bell },
    { href: "/faaliyet-gecmisi", label: "Faaliyet Geçmişi", icon: Activity },
    { href: "/sohbet", label: "Vitrin Sohbet", icon: MessagesSquare },
    { href: "/ajanda", label: "Ajanda", icon: CalendarDays },
    { href: "/finans", label: "Kasa", icon: Wallet },
    { href: "/ekip", label: "Ekip", icon: UsersRound },
    { href: "/ayarlar", label: "Ayarlar", icon: Settings },
  ];
}

/** Geriye dönük uyum — dikey bilinmiyorsa emlak menüsü. */
export const NAV = getNav("REAL_ESTATE");
