"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** Admin: tenant planını değiştirir — free / pro / premium. */
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

  const current =
    plan === "premium" ? "premium" : plan === "pro" ? "pro" : "free";

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
            ["free", "Free", "bg-ink text-white"],
            [
              "pro",
              "Pro",
              "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white",
            ],
            [
              "premium",
              "Premium",
              "bg-gradient-to-r from-amber-500 to-amber-700 text-white",
            ],
          ] as const
        ).map(([key, label, activeCls]) => (
          <button
            key={key}
            type="button"
            onClick={() => change(key)}
            disabled={saving}
            className={`rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50 ${
              current === key ? activeCls : "text-ink/55 hover:text-ink"
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
