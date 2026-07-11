"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Film, Loader2, AlertCircle } from "lucide-react";
import type { AiVideoStatus } from "@prisma/client";

type Props = {
  listingId: string;
  lat: number;
  lng: number;
  initialStatus: AiVideoStatus | null;
  initialVideoUrl: string | null;
};

const POLL_MS = 12_000;

export function AiDroneVideoGenerator({
  listingId,
  lat,
  lng,
  initialStatus,
  initialVideoUrl,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<AiVideoStatus | null>(initialStatus);
  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideoUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isProcessing = status === "PROCESSING";
  const isCompleted = status === "COMPLETED" && !!videoUrl;
  const isFailed = status === "FAILED";

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/listings/${listingId}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        listing?: {
          aiVideoStatus?: AiVideoStatus | null;
          aiDroneVideoUrl?: string | null;
        };
      };
      const listing = data.listing;
      if (!listing) return;

      setStatus(listing.aiVideoStatus ?? null);
      setVideoUrl(listing.aiDroneVideoUrl ?? null);

      if (listing.aiVideoStatus === "COMPLETED" && listing.aiDroneVideoUrl) {
        setError(null);
      }
      if (listing.aiVideoStatus === "FAILED") {
        setError("Video üretimi başarısız oldu. Tekrar deneyebilirsiniz.");
      }
    } catch {
      /* sessiz — bir sonraki poll'da tekrar dener */
    }
  }, [listingId]);

  useEffect(() => {
    if (!isProcessing) return;

    const id = window.setInterval(() => {
      void refreshStatus();
      startTransition(() => router.refresh());
    }, POLL_MS);

    return () => window.clearInterval(id);
  }, [isProcessing, refreshStatus, router]);

  async function handleGenerate() {
    if (pending || isProcessing) return;
    setError(null);

    try {
      const res = await fetch("/api/video/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, lat, lng }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        status?: AiVideoStatus;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "İstek başarısız");
      }

      setStatus("PROCESSING");
      setVideoUrl(null);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Video üretimi başlatılamadı",
      );
    }
  }

  return (
    <section className="rounded-[10px] border border-ink/15 bg-white p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Film size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold">AI Drone Videosu</h2>
          <p className="mt-0.5 text-xs text-ink/55">
            Mapbox 3D harita görüntüsünden Vertex AI Veo ile sinematik drone
            uçuşu üretilir.
          </p>
        </div>
      </div>

      {isCompleted && (
        <div className="mb-4 overflow-hidden rounded-xl ring-1 ring-ink/10">
          <video
            src={videoUrl!}
            controls
            playsInline
            className="aspect-video w-full bg-ink/5"
            preload="metadata"
          >
            Tarayıcınız video oynatmayı desteklemiyor.
          </video>
        </div>
      )}

      {error && (
        <p className="mb-3 flex items-center gap-2 text-sm text-rose-600">
          <AlertCircle size={16} />
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={pending || isProcessing}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isProcessing ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Hazırlanıyor (Yaklaşık 3-5 dk)...
          </>
        ) : isCompleted ? (
          <>
            <Film size={16} />
            Yeniden Üret
          </>
        ) : (
          <>
            <Film size={16} />
            AI Drone Videosu Üret
          </>
        )}
      </button>

      {isFailed && !pending && (
        <p className="mt-2 text-xs text-ink/45">
          Son üretim başarısız oldu. Koordinatların doğru olduğundan emin olun.
        </p>
      )}
    </section>
  );
}
