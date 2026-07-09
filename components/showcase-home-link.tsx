"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Platformda /ofis/slug, custom domain'de / — sunucuda headers() okumadan
 * (ISR ilan sayfalarını bozmamak için).
 */
export function ShowcaseHomeLink({
  slug,
  className,
  children,
}: {
  slug: string;
  className?: string;
  children: ReactNode;
}) {
  const [href, setHref] = useState(`/ofis/${slug}`);

  useEffect(() => {
    const path = window.location.pathname;
    const onCustom =
      !path.startsWith("/ofis/") && !path.startsWith("/galeri/");
    setHref(onCustom ? "/" : `/ofis/${slug}`);
  }, [slug]);

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
