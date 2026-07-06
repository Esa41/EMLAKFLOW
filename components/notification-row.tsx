"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface NotificationRowProps {
  id: string;
  href: string | null;
  readAt: string | null;
  onRead?: () => void;
  children: ReactNode;
  className?: string;
}

/** Tüm satır tıklanabilir; navigasyon öncesi okundu işaretler. */
export function NotificationRow({
  id,
  href,
  readAt,
  onRead,
  children,
  className = "",
}: NotificationRowProps) {
  const router = useRouter();

  async function markRead() {
    if (readAt) return;
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    onRead?.();
  }

  async function handleClick(e: React.MouseEvent) {
    if (!href) return;
    e.preventDefault();
    await markRead();
    router.push(href);
  }

  const base = `block transition-colors ${className}`;

  if (!href) {
    return <div className={base}>{children}</div>;
  }

  return (
    <Link href={href} onClick={handleClick} className={`${base} cursor-pointer`}>
      {children}
    </Link>
  );
}
