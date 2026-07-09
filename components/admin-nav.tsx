"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Ofisler", exact: true },
  { href: "/admin/leads", label: "Pazarlama", exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="ml-4 hidden items-center gap-1 sm:flex">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700"
                : "rounded-lg px-3 py-1.5 text-xs font-bold text-ink/50 transition-colors hover:bg-ink/[0.04] hover:text-ink/80"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
