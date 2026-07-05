import {
  LayoutDashboard,
  Building2,
  Users,
  Contact,
  CalendarDays,
  Wallet,
  UsersRound,
  Settings,
  MessagesSquare,
  BarChart3,
} from "lucide-react";

export const NAV = [
  { href: "/dashboard", label: "Bugün", icon: LayoutDashboard },
  { href: "/portfoy", label: "Portföy", icon: Building2 },
  { href: "/musteriler", label: "Satış Hattı", icon: Users },
  { href: "/kisiler", label: "Müşteriler", icon: Contact },
  { href: "/analitik", label: "Analitik", icon: BarChart3 },
  { href: "/sohbet", label: "Vitrin Sohbet", icon: MessagesSquare },
  { href: "/ajanda", label: "Ajanda", icon: CalendarDays },
  { href: "/finans", label: "Kasa", icon: Wallet },
  { href: "/ekip", label: "Ekip", icon: UsersRound },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
] as const;
