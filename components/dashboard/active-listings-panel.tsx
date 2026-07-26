"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Building2, Pencil, Plus } from "lucide-react";
import { PURPOSE_TR, trMoney } from "@/lib/labels";

export type ActiveListingRow = {
  id: string;
  title: string;
  purpose: "SALE" | "RENT";
  price: number;
  rooms: string | null;
  netArea: number | null;
  createdAt: string;
  daysActive: number;
  thumb: string | null;
};

type Tab = "ALL" | "SALE" | "RENT";

export function ActiveListingsPanel({ listings }: { listings: ActiveListingRow[] }) {
  const [tab, setTab] = useState<Tab>("ALL");
  const sale = listings.filter((l) => l.purpose === "SALE").length;
  const rent = listings.filter((l) => l.purpose === "RENT").length;
  const filtered =
    tab === "ALL" ? listings : listings.filter((l) => l.purpose === tab);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "ALL", label: "Tümü", count: listings.length },
    { key: "SALE", label: "Satılık", count: sale },
    { key: "RENT", label: "Kiralık", count: rent },
  ];

  return (
    <section className="dash-card dash-in p-5 sm:p-6" style={{ animationDelay: "340ms" }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="dash-section-title">Aktif ilanlar</h2>
        <div className="flex items-center gap-2">
          <Link href="/portfoy/yeni" className="dash-btn-primary !rounded-xl !px-3.5 !py-2">
            <Plus size={14} /> Yeni
          </Link>
          <Link href="/portfoy" className="dash-btn-secondary !rounded-xl !px-3.5 !py-2">
            <Pencil size={14} /> Düzenle
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`dash-filter-pill ${tab === t.key ? "dash-filter-pill-active" : ""}`}
          >
            {t.label}{" "}
            <span className="ml-1 tabular-nums opacity-70">{t.count}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="dash-empty mt-4">
          Bu filtrede ilan yok.{" "}
          <Link href="/portfoy/yeni" className="font-semibold underline-offset-2 hover:underline">
            İlk ilanı ekle
          </Link>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-ink/[0.06]">
          {filtered.map((l) => (
            <li key={l.id}>
              <Link
                href={`/portfoy/${l.id}`}
                className="group flex items-center gap-3 py-3.5 transition-colors hover:bg-ink/[0.02] sm:gap-4"
              >
                <div className="relative h-14 w-[72px] shrink-0 overflow-hidden rounded-xl bg-ink/[0.04]">
                  {l.thumb ? (
                    <Image
                      src={l.thumb}
                      alt=""
                      fill
                      sizes="72px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink/20">
                      <Building2 size={20} strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold tracking-tight">{l.title}</p>
                  <p className="mt-0.5 text-[12px] text-ink/45">
                    {PURPOSE_TR[l.purpose]} · {l.rooms ?? "—"} · {l.netArea ?? "—"} m²
                  </p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="font-display text-[15px] font-bold tabular-nums tracking-tight">
                    {trMoney.format(l.price)}
                    {l.purpose === "RENT" && (
                      <span className="text-[12px] font-medium text-ink/40"> /ay</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink/40">
                    Aktif {l.daysActive} gün ·{" "}
                    {new Date(l.createdAt).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
