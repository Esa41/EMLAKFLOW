"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Clapperboard, Share2, ExternalLink } from "lucide-react";
import type { StudioMediaItem } from "@/lib/social-os/studio-media";
import { sendStudioToSocial } from "@/app/actions/social-os";

export function MediaLibrary({ items }: { items: StudioMediaItem[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  function send(item: StudioMediaItem) {
    setError(null);
    setPendingId(item.id);
    start(async () => {
      try {
        const res = await sendStudioToSocial(
          item.kind === "project"
            ? { studioProjectId: item.id }
            : { studioJobId: item.id },
        );
        window.location.href = `/sosyal/planlayici?focus=${res.assetId}`;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Aktarım başarısız");
        setPendingId(null);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 px-5 py-12 text-center">
        <Clapperboard className="mx-auto text-ink/30" size={28} />
        <p className="mt-3 text-sm text-ink/50">
          Henüz Stüdyo videosu yok. AI Stüdyo’da bir reel üret, burada görünecek.
        </p>
        <Link
          href="/dashboard/studio"
          className="mt-4 inline-flex text-[13px] font-semibold text-brand-600 hover:underline"
        >
          AI Stüdyo’ya git
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/55">
        AI Stüdyo’da üretilen videolar. Caption üretip takvime almak için{" "}
        <strong className="text-ink/70">Sosyal’e gönder</strong>.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article
            key={`${item.kind}-${item.id}`}
            className="overflow-hidden rounded-2xl border border-ink/10 bg-[var(--app-surface)]"
          >
            <div className="relative aspect-video bg-black">
              <video
                src={item.videoUrl}
                className="h-full w-full object-contain"
                muted
                playsInline
                preload="metadata"
                controls
              />
            </div>
            <div className="space-y-2 p-3">
              <div>
                <p className="truncate text-sm font-semibold">{item.title}</p>
                <p className="truncate text-[12px] text-ink/45">
                  {item.listingRef} · {item.listingTitle}
                  {item.templateLabel ? ` · ${item.templateLabel}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pendingId === item.id}
                  onClick={() => send(item)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
                >
                  <Share2 size={13} />
                  {pendingId === item.id ? "Aktarılıyor…" : "Sosyal’e gönder"}
                </button>
                <a
                  href={item.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-ink/10 px-3 py-2 text-ink/55"
                  title="Aç"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
