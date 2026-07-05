"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkPaidButton({
  commissionId,
  paid,
}: {
  commissionId: string;
  paid: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await fetch(`/api/commissions/${commissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: !paid }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
        paid
          ? "bg-white text-ink/55 ring-1 ring-ink/20 hover:bg-ink/[0.04]"
          : "bg-emerald-600 text-white hover:bg-emerald-700"
      }`}
    >
      {busy ? "…" : paid ? "Geri al" : "Ödendi işaretle"}
    </button>
  );
}
