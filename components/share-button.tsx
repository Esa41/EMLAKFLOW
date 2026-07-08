"use client";

import { useState } from "react";
import { Share2, Link2, Check, MessageCircle } from "lucide-react";

/**
 * Paylaşım butonu — Web Share API varsa native share sheet,
 * yoksa link kopyala + WhatsApp + X (Twitter) dropdown.
 */
export function ShareButton({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleNativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      /* kullanıcı iptal etti */
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;

  // Web Share API destekleniyorsa native kullan
  if (typeof navigator !== "undefined" && "share" in navigator) {
    return (
      <button
        type="button"
        onClick={handleNativeShare}
        className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink/60 transition-colors hover:border-ink/50 hover:text-ink"
      >
        <Share2 size={13} /> Paylaş
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink/60 transition-colors hover:border-ink/50 hover:text-ink"
      >
        <Share2 size={13} /> Paylaş
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1.5 w-48 rounded-xl border border-ink/15 bg-white p-1.5 shadow-lg">
            <button
              onClick={() => {
                handleCopy();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-ink/[0.04]"
            >
              {copied ? (
                <Check size={14} className="text-brand-600" />
              ) : (
                <Link2 size={14} className="text-ink/45" />
              )}
              {copied ? "Kopyalandı!" : "Linki kopyala"}
            </button>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-ink/[0.04]"
            >
              <MessageCircle size={14} className="text-ink/45" />
              WhatsApp&apos;ta paylaş
            </a>
            <a
              href={xUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-ink/[0.04]"
            >
              <span className="flex h-3.5 w-3.5 items-center justify-center text-[11px] font-bold text-ink/45">𝕏</span>
              X&apos;te paylaş
            </a>
          </div>
        </>
      )}
    </div>
  );
}
