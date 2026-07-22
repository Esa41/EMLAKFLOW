"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarClock,
  Building2,
  GitBranch,
  Contact,
  KeyRound,
  Sparkles,
  BarChart3,
  Play,
} from "lucide-react";
import type { DemoListing } from "./landing-content";

/**
 * Ana sayfada gömülü, INTERAKTİF dashboard demosu (modal yok).
 * Kenar menü GERÇEK panel menümüzle aynı; tıklayınca içerik animasyonlu değişir,
 * boşta yavaşça kendi döner. İçerik seed verisini (İzmit portföyü) yansıtır.
 */

const TABS = [
  { key: "bugun", label: "Bugün", icon: CalendarClock },
  { key: "portfoy", label: "Portföy", icon: Building2 },
  { key: "pipeline", label: "Satış Hattı", icon: GitBranch },
  { key: "kira", label: "Kira Takibi", icon: KeyRound },
  { key: "studio", label: "AI Stüdyo", icon: Sparkles },
  { key: "analitik", label: "Analitik", icon: BarChart3 },
] as const;

// Menüde ayrıca görünen (panelde var olan) diğer bölümler — görsel bütünlük için.
const EXTRA_MENU = ["Müşteriler", "Ajanda", "Kasa", "Ekip"];

const LISTINGS = [
  { t: "Yahya Kaptan · 3+1", p: "4.850.000 ₺", v: 412, st: "Satılık", bg: "from-[#c9b08a] to-[#7d6247]" },
  { t: "Yuvacık · 4+1 müstakil", p: "7.200.000 ₺", v: 286, st: "Satılık", bg: "from-[#9fae7e] to-[#55663b]" },
  { t: "28 Haziran · 2+1", p: "22.000 ₺/ay", v: 194, st: "Kiralık", bg: "from-[#a9c3c8] to-[#3f7d7e]" },
  { t: "Körfez · 1+1", p: "2.450.000 ₺", v: 158, st: "Satılık", bg: "from-[#b79a8a] to-[#5f4636]" },
];

const PIPELINE = [
  { h: "Yeni", n: 4, cards: [{ n: "Ahmet Yılmaz", m: "3+1 · 5M altı" }, { n: "Ceren A.", m: "Kiralık · 2+1" }] },
  { h: "Aradım", n: 2, cards: [{ n: "Deniz Kaya", m: "Arsa · Alikahya" }] },
  { h: "Görüştüm", n: 1, cards: [{ n: "Elif Toprak", m: "Villa · Kartepe" }] },
];

const TEMPLATES = [
  { t: "Lüks Vitrin", d: "16:9 · sinematik, sakin", bg: "from-[#3a5a48] to-[#101a13]" },
  { t: "FPV Ev Turu", d: "9:16 · enerjik, Reels", bg: "from-[#7a6a4c] to-[#2f2718]" },
  { t: "Golden Hour Dış Cephe", d: "16:9 · gün batımı", bg: "from-[#c07f5f] to-[#33404b]" },
  { t: "Drone Arsa", d: "16:9 · kuş bakışı", bg: "from-[#8fa06d] to-[#3b4a26]" },
];

function View({ tab, listings }: { tab: string; listings: DemoListing[] }) {
  if (tab === "portfoy") {
    const views = [428, 312, 205, 176];
    const rows =
      listings.length >= 3
        ? listings.slice(0, 4).map((l, i) => ({ img: l.img, bg: "", title: l.title, price: l.price, view: views[i], tag: l.tag }))
        : LISTINGS.map((l) => ({ img: "", bg: l.bg, title: l.t, price: l.p, view: l.v, tag: l.st }));
    return (
      <div className="space-y-2">
        {rows.map((l) => (
          <div key={l.title} className="flex items-center gap-3 rounded-xl border border-ink/8 bg-white p-2.5">
            {l.img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.img} alt="" loading="lazy" className="h-11 w-14 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className={`h-11 w-14 shrink-0 rounded-lg bg-gradient-to-br ${l.bg}`} />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{l.title}</div>
              <div className="font-mono text-[10px] text-ink/45">{l.price}</div>
            </div>
            <div className="text-right">
              <div className="text-[13px] font-bold text-brand-600">{l.view}</div>
              <div className="font-mono text-[8.5px] uppercase text-ink/45">görüntülenme</div>
            </div>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 font-mono text-[9px] font-semibold text-brand-700">{l.tag}</span>
          </div>
        ))}
      </div>
    );
  }
  if (tab === "pipeline") {
    return (
      <div className="grid grid-cols-3 gap-2">
        {PIPELINE.map((c) => (
          <div key={c.h} className="rounded-xl border border-ink/8 bg-white p-2">
            <div className="mb-1.5 flex items-center justify-between font-mono text-[8.5px] uppercase tracking-wide text-ink/45">
              <span>{c.h}</span><span>{c.n}</span>
            </div>
            {c.cards.map((l) => (
              <div key={l.n} className="mb-1.5 rounded-lg border border-ink/8 bg-paper px-2 py-1.5">
                <div className="text-[10.5px] font-semibold leading-tight">{l.n}</div>
                <div className="mt-0.5 font-mono text-[8px] text-ink/45">{l.m}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  if (tab === "kira") {
    return (
      <div className="rounded-xl border border-ink/8 bg-white p-3.5">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-2xl font-extrabold text-brand-600">%82</div>
            <div className="font-mono text-[9px] uppercase tracking-wide text-ink/45">Bu ay tahsil edildi</div>
          </div>
          <div className="font-mono text-[10px] text-ink/45">9 / 11 sözleşme</div>
        </div>
        <div className="my-2.5 h-2 overflow-hidden rounded-full bg-brand-50">
          <div className="h-full rounded-full bg-brand-600" style={{ width: "82%" }} />
        </div>
        {[
          { a: "Yuvacık · daire", b: "18.500 ₺ · 3 gün sonra", late: false },
          { a: "28 Haziran · daire", b: "16.000 ₺ · ödendi", late: false },
          { a: "Körfez · dükkan", b: "24.000 ₺ · gecikti", late: true },
        ].map((r) => (
          <div key={r.a} className={`flex justify-between border-t border-ink/8 py-1.5 text-[11px] ${r.late ? "text-[#b4552f]" : ""}`}>
            <span className={r.late ? "text-ink" : ""}>{r.a}</span>
            <span className="font-mono">{r.b}</span>
          </div>
        ))}
      </div>
    );
  }
  if (tab === "studio") {
    return (
      <div>
        <p className="mb-2 text-[12px] text-ink/55">Tek fotoğraftan tanıtım videosu — şablonu seç, gerisi otomatik.</p>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((t) => (
            <div key={t.t} className="overflow-hidden rounded-xl border border-ink/8 bg-white">
              <div className={`relative h-16 bg-gradient-to-br ${t.bg}`}>
                <span className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink">
                  <Play size={12} className="ml-0.5 fill-current" />
                </span>
              </div>
              <div className="px-2.5 py-2">
                <div className="text-[11.5px] font-semibold">{t.t}</div>
                <div className="font-mono text-[8.5px] text-ink/45">{t.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (tab === "analitik") {
    const bars = [40, 62, 48, 78, 66, 92];
    return (
      <div className="space-y-2.5">
        <div className="rounded-xl border border-ink/8 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-semibold">Haftalık vitrin trafiği</span>
            <span className="font-mono text-[10px] text-brand-600">▲ %28</span>
          </div>
          <div className="flex h-24 items-end gap-1.5">
            {bars.map((h, i) => (
              <div key={i} className={`flex-1 rounded-t ${i === bars.length - 1 ? "bg-brand-600" : "bg-brand-600/55"}`} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{ n: "%3.4", l: "Dönüşüm" }, { n: "23", l: "Ort. gün / satış" }, { n: "6", l: "Bu hafta talep" }].map((s) => (
            <div key={s.l} className="rounded-xl border border-ink/8 bg-white p-2.5 text-center">
              <div className="text-lg font-extrabold text-brand-600">{s.n}</div>
              <div className="font-mono text-[8.5px] uppercase text-ink/45">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  // bugün
  return (
    <div className="space-y-3">
      <p className="text-[12px] text-ink/55">Merhaba <b className="text-ink">Selin</b> — bugün 3 işin var.</p>
      <div className="grid grid-cols-4 gap-2 max-[520px]:grid-cols-2">
        {[
          { n: "5", l: "Yayında ilan" },
          { n: "1.284", l: "Bu ay ziyaret", up: true },
          { n: "7", l: "Yeni talep" },
          { n: "3", l: "Bugünkü görev" },
        ].map((t) => (
          <div key={t.l} className="rounded-xl border border-ink/8 bg-white p-3">
            <div className={`text-xl font-extrabold tracking-tight ${t.up ? "text-brand-600" : ""}`}>{t.n}</div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-wide text-ink/45">{t.l}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[1.4fr_1fr] gap-2.5 max-[520px]:grid-cols-1">
        <div className="rounded-xl border border-ink/8 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-semibold">İlanların kaç kez görüldü</span>
            <span className="font-mono text-[10px] text-brand-600">▲ %28</span>
          </div>
          <svg viewBox="0 0 300 66" preserveAspectRatio="none" className="h-16 w-full">
            <defs>
              <linearGradient id="cp-spark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1e5b3e" stopOpacity=".28" />
                <stop offset="1" stopColor="#1e5b3e" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 52 40 46 80 50 120 34 160 40 200 24 240 30 300 12" fill="none" stroke="#1e5b3e" strokeWidth="2.4" />
            <path d="M0 52 40 46 80 50 120 34 160 40 200 24 240 30 300 12 300 66 0 66 Z" fill="url(#cp-spark)" />
          </svg>
        </div>
        <div className="rounded-xl border border-ink/8 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-semibold">Gelen talepler</span>
            <span className="font-mono text-[10px] text-ink/45">7 yeni</span>
          </div>
          <div className="space-y-1.5">
            {[{ n: "Ahmet Y.", m: "3+1 · 5M altı" }, { n: "Deniz K.", m: "Arsa · Alikahya" }].map((l) => (
              <div key={l.n} className="rounded-lg border border-ink/8 bg-paper px-2.5 py-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-brand-600" />{l.n}</div>
                <div className="mt-0.5 font-mono text-[9px] text-ink/45">{l.m}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CrmPreview({ listings = [] }: { listings?: DemoListing[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (paused || reduced.current) return;
    const id = setInterval(() => setActive((a) => (a + 1) % TABS.length), 4200);
    return () => clearInterval(id);
  }, [paused]);

  const tab = TABS[active];

  return (
    <div
      className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_40px_90px_-50px_rgba(20,63,43,0.55)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center gap-2 border-b border-ink/8 bg-paper px-3.5 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
        <span className="ml-2 rounded-md border border-ink/10 bg-white px-2.5 py-1 font-mono text-[10px] text-ink/45">
          panel.emlakflow.app
        </span>
      </div>
      <div className="grid grid-cols-[168px_1fr] max-[440px]:grid-cols-1">
        <div className="border-r border-ink/8 bg-paper p-2.5 max-[440px]:hidden">
          {TABS.map((t, i) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(i)}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium transition-colors ${
                i === active ? "bg-brand-50 text-brand-700" : "text-ink/55 hover:bg-ink/[0.03]"
              }`}
            >
              <t.icon size={14} className={i === active ? "text-brand-600" : "opacity-60"} />
              {t.label}
            </button>
          ))}
          <div className="my-2 border-t border-ink/8" />
          {EXTRA_MENU.map((m) => (
            <div key={m} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-ink/40">
              <Contact size={14} className="opacity-50" />
              {m}
            </div>
          ))}
        </div>
        <div className="bg-white p-4">
          <div className="mb-3 flex items-center gap-2 min-[440px]:hidden">
            <span className="font-display text-sm font-bold">{tab.label}</span>
          </div>
          <div key={active} className="landing-demo-view">
            <View tab={tab.key} listings={listings} />
          </div>
          <div className="mt-3 flex gap-1.5 min-[440px]:hidden">
            {TABS.map((t, i) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActive(i)}
                aria-label={t.label}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i === active ? "bg-brand-600" : "bg-ink/15"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
