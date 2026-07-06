"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowDown, Loader2 } from "lucide-react";

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

  const isPro = plan === "pro";
  const nextPlan = isPro ? "free" : "pro";

  async function toggle() {
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
      <button
        onClick={toggle}
        disabled={saving}
        className={
          isPro
            ? "group inline-flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3 py-2 text-xs font-bold text-ink/70 shadow-sm transition-all hover:border-ink/30 hover:bg-ink/[0.02] hover:shadow disabled:opacity-50"
            : "group inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-md transition-all hover:from-emerald-700 hover:to-emerald-800 hover:shadow-lg disabled:opacity-50"
        }
      >
        {saving ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            <span>Güncelleniyor...</span>
          </>
        ) : isPro ? (
          <>
            <ArrowDown size={13} className="transition-transform group-hover:-translate-y-0.5" />
            <span>Free&apos;ye al</span>
          </>
        ) : (
          <>
            <Sparkles size={13} className="transition-transform group-hover:scale-110" />
            <span>Pro yap</span>
          </>
        )}
      </button>
      {error && (
        <span className="rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-600">
          {error}
        </span>
      )}
    </div>
  );
}
