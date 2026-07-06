"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Activity } from "lucide-react";
import { NotificationCenter } from "@/components/notification-center";
import { ActivityLogViewer } from "@/components/activity-log-viewer";

type Tab = "bildirimler" | "faaliyet";

/**
 * Bildirim & Faaliyet Merkezi hub'ı — tek sayfa, iki sekme.
 * Aktif sekme URL ile senkron: /merkez (bildirimler) · /merkez?tab=faaliyet.
 * İçerik rol bazlı: yönetici tüm ekip, agent/asistan yalnızca kendi (API guard).
 */
export function MerkezHub({ canViewTeam }: { canViewTeam: boolean }) {
  return (
    <Suspense fallback={<div className="h-40" />}>
      <MerkezInner canViewTeam={canViewTeam} />
    </Suspense>
  );
}

function MerkezInner({ canViewTeam }: { canViewTeam: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const tab: Tab = params.get("tab") === "faaliyet" ? "faaliyet" : "bildirimler";

  function setTab(next: Tab) {
    router.replace(next === "faaliyet" ? "/merkez?tab=faaliyet" : "/merkez", {
      scroll: false,
    });
  }

  const tabs: Array<{ key: Tab; label: string; icon: typeof Bell }> = [
    { key: "bildirimler", label: "Bildirimler", icon: Bell },
    { key: "faaliyet", label: "Faaliyet Merkezi", icon: Activity },
  ];

  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-extrabold tracking-tight">
        Bildirimler &amp; Faaliyet
      </h1>

      {/* Sekmeler */}
      <div className="mb-6 flex gap-1 border-b border-ink/10">
        {tabs.map((t) => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={active}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-ink/50 hover:text-ink/80"
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Aktif sekme içeriği */}
      {tab === "bildirimler" ? (
        <NotificationCenter />
      ) : (
        <div>
          <div className="mb-4 rounded-lg border border-ink/10 bg-brand-50/60 px-3.5 py-2 text-xs font-medium text-ink/60">
            {canViewTeam
              ? "Tüm ekibin faaliyet kayıtları gösteriliyor."
              : "Yalnızca kendi faaliyet geçmişiniz gösteriliyor."}
          </div>
          <ActivityLogViewer />
        </div>
      )}
    </div>
  );
}
