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
  URGENT: { icon: AlertTriangle, box: "border-red-300 bg-red-50", ic: "text-red-600" },
  ACTION: { icon: Lightbulb, box: "border-amber-300 bg-amber-50", ic: "text-amber-600" },
  INFO: { icon: Info, box: "border-ink/15 bg-white", ic: "text-brand-600" },
} as const;

export function InsightList({ insights }: { insights: InsightItem[] }) {
  const [pending, start] = useTransition();

  if (insights.length === 0) return null;

  return (
    <section>
      <h2 className="bolum">Bugünkü Aksiyonlar ({insights.length})</h2>
      <div className="mt-4 space-y-2.5">
        {insights.map((i) => {
          const s = SEV_STYLE[i.severity];
          return (
            <div key={i.id} className={`flex items-start gap-3 rounded-xl border p-3.5 ${s.box}`}>
              <s.icon size={17} className={`mt-0.5 shrink-0 ${s.ic}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{i.title}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-ink/65">{i.body}</p>
                {i.listingId && (
                  <Link
                    href={`/portfoy/${i.listingId}`}
                    className="mt-1 inline-block text-xs font-semibold text-brand-700 hover:underline"
                  >
                    İlana git →
                  </Link>
                )}
              </div>
              <form
                action={(fd) => start(() => dismissInsight(fd))}
              >
                <input type="hidden" name="id" value={i.id} />
                <button
                  type="submit"
                  disabled={pending}
                  title="Kapat"
                  className="rounded-md p-1 text-ink/35 transition-colors hover:bg-ink/5 hover:text-ink/70"
                >
                  <X size={15} />
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </section>
  );
}
