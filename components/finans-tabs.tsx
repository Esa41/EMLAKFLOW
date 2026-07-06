"use client";

import { useState, type ReactNode } from "react";

export function FinansTabs({
  commissionsTab,
  contractsTab,
}: {
  commissionsTab: ReactNode;
  contractsTab: ReactNode;
}) {
  const [tab, setTab] = useState<"commissions" | "contracts">("commissions");

  const tabBtn = (key: typeof tab, label: string) => (
    <button
      onClick={() => setTab(key)}
      className={`border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
        tab === key
          ? "border-brand-600 text-brand-700"
          : "border-transparent text-ink/45 hover:text-ink/70"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-6 border-b border-ink/10">
        {tabBtn("commissions", "Hak Ediş")}
        {tabBtn("contracts", "Sözleşmeler")}
      </div>
      {tab === "commissions" ? commissionsTab : contractsTab}
    </div>
  );
}
