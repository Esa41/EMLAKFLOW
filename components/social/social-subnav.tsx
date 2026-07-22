"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: { href: string; label: string; exact?: boolean }[] = [
  { href: "/sosyal", label: "Özet", exact: true },
  { href: "/sosyal/planlayici", label: "Planlayıcı" },
  { href: "/sosyal/medya", label: "Medya" },
  { href: "/sosyal/takvim", label: "Takvim" },
  { href: "/sosyal/marka", label: "Marka" },
  { href: "/sosyal/takip", label: "Takip" },
];

export function SocialSubnav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b border-ink/10 pb-3">
      {LINKS.map((l) => {
        const active = l.exact
          ? pathname === l.href
          : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
              active
                ? "bg-brand-600 text-white"
                : "text-ink/55 hover:bg-[var(--app-input-bg)] hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
