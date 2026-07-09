"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteCashEntryButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (busy) return;
    if (!confirm("Bu kasa kaydını silmek istiyor musunuz?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/cash-entries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Silinemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      title="Sil"
      className="rounded-lg p-1.5 text-ink/35 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
    >
      <Trash2 size={14} />
    </button>
  );
}
