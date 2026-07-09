"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** Admin: tenant planını değiştirir — free / pro / premium (bkz. lib/plans.ts). */
export function AdminPlanToggle({
  tenantId,
  plan,
}: {
  tenantId: string;
  plan: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // trial/starter/premium gibi eski değerler seçimde en yakın pakete oturur
  const current = plan === "pro" || plan === "premium" ? "pro" : "free";

  async function change(nextPlan: string) {
    if (nextPlan === current) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: nextPlan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "İşlem başarısız.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Hata.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex rounded-lg border border-ink/15 bg-white p-0.5 text-xs font-bold shadow-sm">
        {(
          [
            ["free", "Free"],
            ["pro", "Pro"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => change(key)}
            disabled={saving}
            className={`rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50 ${
              current === key
                ? key === "pro"
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white"
                  : "bg-ink text-white"
                : "text-ink/55 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {saving && <Loader2 size={13} className="animate-spin text-ink/40" />}
      {error && (
        <span className="rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-600">
          {error}
        </span>
      )}
    </div>
  );
}
