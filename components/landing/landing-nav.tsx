"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Hero üstünde şeffaf, scroll'da buzlu cam olan nav. */
export function LandingNav() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid
          ? "border-b border-ink/8 bg-paper/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href="/" className="font-display text-xl font-extrabold tracking-tight text-ink">
          Emlak<span className="text-brand-600">Flow</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink/60 md:flex">
          <a href="#yolculuk" className="transition-colors hover:text-ink">
            Nasıl çalışır
          </a>
          <a href="#ozellikler" className="transition-colors hover:text-ink">
            Özellikler
          </a>
          <Link
            href="/ofis/atlas-gayrimenkul"
            target="_blank"
            className="transition-colors hover:text-ink"
          >
            Canlı demo
          </Link>
          <Link href="/blog" className="transition-colors hover:text-ink">
            Blog
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-semibold text-ink/65 transition-colors hover:text-ink sm:inline"
          >
            Giriş
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-[0_6px_20px_-6px_rgba(30,91,62,0.5)] transition-all hover:bg-brand-700 sm:px-5"
          >
            Ücretsiz dene
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </header>
  );
}
