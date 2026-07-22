"use client";

import { useState } from "react";
import { Check, Minus, ChevronDown } from "lucide-react";

/** "Detay göster" ile açılan Ücretsiz / Pro / Premium karşılaştırma tablosu. */

type Cell = boolean | string;
const ROWS: { label: string; free: Cell; pro: Cell; premium: Cell }[] = [
  { label: "İlan sayısı", free: "5", pro: "Sınırsız", premium: "Sınırsız" },
  { label: "Kendi web siten", free: "Rozetli", pro: true, premium: "Rozetsiz" },
  { label: "Kendi alan adın (domain)", free: false, pro: true, premium: true },
  { label: "Müşteri & talep takibi", free: true, pro: true, premium: true },
  { label: "Kira takibi", free: true, pro: true, premium: true },
  { label: "İlan görüntülenme istatistiği", free: true, pro: true, premium: "Gelişmiş" },
  { label: "AI ilan metni & SEO", free: false, pro: true, premium: true },
  { label: "Fiyat önerisi & haftalık rapor", free: false, pro: true, premium: true },
  { label: "Yönlendirme / referans kazancı", free: false, pro: true, premium: true },
  { label: "Ekip / çoklu kullanıcı", free: false, pro: false, premium: "Sınırsız" },
  { label: "Şube / franchise yönetimi", free: false, pro: false, premium: true },
  { label: "Öncelikli destek", free: false, pro: true, premium: true },
  { label: "AI tanıtım videosu", free: "Krediyle", pro: "Krediyle", premium: "Aylık paket + kredi" },
];

function Val({ v }: { v: Cell }) {
  if (v === true) return <Check size={16} className="mx-auto text-brand-600" />;
  if (v === false) return <Minus size={15} className="mx-auto text-ink/25" />;
  return <span className="text-[13px] font-medium text-ink/75">{v}</span>;
}

export function PricingCompare() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-6">
      <div className="text-center">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-paper"
        >
          {open ? "Karşılaştırmayı gizle" : "Tüm özellikleri karşılaştır"}
          <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div
        className={`grid transition-all duration-500 ${open ? "mt-6 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink/10">
                  <th className="p-4 text-left font-mono text-[11px] font-semibold uppercase tracking-wide text-ink/45">Özellik</th>
                  <th className="p-4 text-center font-display font-bold">Ücretsiz</th>
                  <th className="bg-brand-50/60 p-4 text-center font-display font-bold text-brand-700">Pro</th>
                  <th className="p-4 text-center font-display font-bold">Premium</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r, i) => (
                  <tr key={r.label} className={i % 2 ? "bg-paper/50" : ""}>
                    <td className="p-4 text-[13.5px] text-ink/80">{r.label}</td>
                    <td className="p-4 text-center"><Val v={r.free} /></td>
                    <td className="bg-brand-50/40 p-4 text-center"><Val v={r.pro} /></td>
                    <td className="p-4 text-center"><Val v={r.premium} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
