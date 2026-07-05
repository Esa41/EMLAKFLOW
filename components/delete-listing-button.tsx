"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteListingButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/portfoy");
      router.refresh();
    } else {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-ink/65">İlan ve fotoğrafları silinecek.</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-700"
        >
          {deleting ? "Siliniyor…" : "Evet, sil"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink/65 ring-1 ring-ink/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          Vazgeç
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-rose-500 ring-1 ring-rose-200 transition-colors hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400"
    >
      <Trash2 size={15} /> İlanı sil
    </button>
  );
}
