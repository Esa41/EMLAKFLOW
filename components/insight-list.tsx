"use client";

import Link from "next/link";
import { useTransition } from "react";
import { X, AlertTriangle, Lightbulb, Info } from "lucide-react";
import { dismissInsight } from "@/app/actions/insight";

export interface InsightItem {
  id: string;
  rule: string;
  severity: "INFO" | "ACTION" | "URGENT";
  title: string;
  body: string;
  listingId: string | null;
}

const SEV_STYLE = {
  URGENT: { icon: AlertTriangle, box: "bg-red-500/[0.06] dark:bg-red-500/10", ic: "text-red-600 dark:text-red-400" },
  ACTION: { icon: Lightbulb, box: "bg-amber-500/[0.06] dark:bg-amber-500/10", ic: "text-amber-600 dark:text-amber-400" },
  INFO: { icon: Info, box: "bg-ink/[0.03] dark:bg-white/[0.05]", ic: "text-brand-600 dark:text-brand-500" },
} as const;

export function InsightList({ insights }: { insights: InsightItem[] }) {
  const [pending, start] = useTransition();

  if (insights.length === 0) return null;

  return (
    <section>
      <h2 className="dash-section-title">Önerilen aksiyonlar ({insights.length})</h2>
      <div className="mt-3 space-y-2">
        {insights.map((i) => {
          const s = SEV_STYLE[i.severity];
          return (
            <div
              key={i.id}
              className={`flex items-start gap-3 rounded-2xl p-3.5 ${s.box} ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06]`}
            >
              <s.icon size={16} strokeWidth={1.75} className={`mt-0.5 shrink-0 ${s.ic}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-snug">{i.title}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-ink/55">{i.body}</p>
                {i.listingId && (
                  <Link
                    href={`/portfoy/${i.listingId}`}
                    className="mt-1.5 inline-block text-[12px] font-medium text-brand-700 hover:underline"
                  >
                    İlana git →
                  </Link>
                )}
              </div>
              <form action={(fd) => start(() => dismissInsight(fd))}>
                <input type="hidden" name="id" value={i.id} />
                <button
                  type="submit"
                  disabled={pending}
                  title="Kapat"
                  className="rounded-lg p-1.5 text-ink/25 transition-colors hover:bg-ink/[0.05] hover:text-ink/60"
                >
                  <X size={14} />
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </section>
  );
}
