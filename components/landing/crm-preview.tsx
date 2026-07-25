"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Globe,
  Building2,
  Contact,
  KeyRound,
  CalendarClock,
  BarChart3,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import type { DemoListing } from "./landing-content";

/**
 * Ana sayfada gömülü, INTERAKTİF dashboard demosu (modal yok).
 * "Tek yerde" şeridi (HeroDemoNav) ve panel demosu (CrmPreview) AYNI state'i
 * paylaşır (HeroDemoProvider): şeride tıkla → panel değişir; boşta ikisi de
 * kendiliğinden döner. Sekme etiketleri şeritteki kelimelerle birebir aynı.
 * İçerik seed verisini (İzmit portföyü) yansıtır.
 */

export const HERO_TABS = [
  { key: "websiten", label: "Web siten", icon: Globe },
  { key: "ilanlar", label: "İlanların", icon: Building2 },
  { key: "musteriler", label: "Müşterilerin", icon: Contact },
  { key: "kira", label: "Kiralar", icon: KeyRound },
  { key: "randevular", label: "Randevular", icon: CalendarClock },
  { key: "istatistik", label: "İstatistikler", icon: BarChart3 },
] as const;

// Menüde ayrıca görünen (panelde var olan) diğer bölümler — görsel bütünlük için.
const EXTRA_MENU = [
  { label: "AI Stüdyo", icon: Sparkles },
  { label: "Sohbet", icon: MessageSquare },
];

// ── Paylaşılan demo state'i (şerit + panel senkron) ──

type DemoCtx = {
  active: number;
  setActive: (i: number) => void;
  setPaused: (p: boolean) => void;
};

const Ctx = createContext<DemoCtx | null>(null);

export function useHeroDemo(): DemoCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useHeroDemo must be used within HeroDemoProvider");
  return c;
}

export function HeroDemoProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (paused || reduced.current) return;
    const id = setInterval(
      () => setActive((a) => (a + 1) % HERO_TABS.length),
      4200,
    );
    return () => clearInterval(id);
  }, [paused]);

  return (
    <Ctx.Provider value={{ active, setActive, setPaused }}>
      {children}
    </Ctx.Provider>
  );
}

// ── "Tek yerde" şeridi — panelin kumandası ──

export function HeroDemoNav() {
  const { active, setActive, setPaused } = useHeroDemo();
  return (
    <div
      className="mx-auto mt-14 flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-2 border-y border-ink/8 py-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="mr-1 font-mono text-[11px] uppercase tracking-wide text-ink/45">
        Tek yerde
      </span>
      {HERO_TABS.map((t, i) => (
        <button
          key={t.key}
          type="button"
          onClick={() => setActive(i)}
          className={`rounded-full px-3 py-1.5 text-[15px] font-bold transition-colors ${
            i === active
              ? "bg-brand-600 text-white"
              : "text-ink/60 hover:bg-ink/[0.05] hover:text-ink"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

const LISTINGS = [
  { t: "Yahya Kaptan · 3+1", p: "4.850.000 ₺", v: 412, st: "Satılık", bg: "from-[#c9b08a] to-[#7d6247]" },
  { t: "Yuvacık · 4+1 müstakil", p: "7.200.000 ₺", v: 286, st: "Satılık", bg: "from-[#9fae7e] to-[#55663b]" },
  { t: "28 Haziran · 2+1", p: "22.000 ₺/ay", v: 194, st: "Kiralık", bg: "from-[#a9c3c8] to-[#3f7d7e]" },
  { t: "Körfez · 1+1", p: "2.450.000 ₺", v: 158, st: "Satılık", bg: "from-[#b79a8a] to-[#5f4636]" },
];

// Satış hattı — GERÇEK aşama adları (lib/labels.ts STAGE_TR).
const PIPELINE = [
  { h: "Yeni", n: 4, cards: [{ n: "Ahmet Yılmaz", m: "3+1 · 5M altı" }, { n: "Ceren A.", m: "Kiralık · 2+1" }] },
  { h: "İletişimde", n: 2, cards: [{ n: "Deniz Kaya", m: "Arsa · Alikahya" }] },
  { h: "Yer Gösterildi", n: 1, cards: [{ n: "Elif Toprak", m: "Villa · Kartepe" }] },
];

function View({ tab, listings, office }: { tab: string; listings: DemoListing[]; office: string }) {
  if (tab === "ilanlar") {
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
  if (tab === "musteriler") {
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
  if (tab === "randevular") {
    const items = [
      { t: "10:00", n: "Ahmet Y.", m: "Yahya Kaptan · 3+1", k: "Yer gösterme", c: "text-brand-700 bg-brand-50" },
      { t: "14:30", n: "Deniz K.", m: "Alikahya · arsa", k: "Görüşme", c: "text-ink/60 bg-ink/[0.05]" },
      { t: "16:00", n: "Elif T.", m: "Kartepe · villa", k: "Sözleşme", c: "text-[#8a5a2b] bg-[#f2e5d3]" },
    ];
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[12px] font-semibold">Bugün · 3 randevu</span>
          <span className="font-mono text-[10px] text-ink/45">Cuma, 25 Tem</span>
        </div>
        {items.map((r) => (
          <div key={r.t} className="flex items-center gap-3 rounded-xl border border-ink/8 bg-white p-2.5">
            <div className="w-11 shrink-0 text-center">
              <div className="text-[13px] font-bold text-brand-600">{r.t}</div>
            </div>
            <div className="min-w-0 flex-1 border-l border-ink/8 pl-3">
              <div className="truncate text-[12.5px] font-semibold">{r.n}</div>
              <div className="font-mono text-[9px] text-ink/45">{r.m}</div>
            </div>
            <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold ${r.c}`}>{r.k}</span>
          </div>
        ))}
      </div>
    );
  }
  if (tab === "istatistik") {
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
  // websiten — public vitrin (kendi web siteniz) önizlemesi
  const cards: { title: string; price: string; img: string; bg: string }[] =
    listings.length >= 2
      ? listings.slice(0, 2).map((l) => ({ title: l.title, price: l.price, img: l.img, bg: "" }))
      : LISTINGS.slice(0, 2).map((l) => ({ title: l.t, price: l.p, img: "", bg: l.bg }));
  return (
    <div className="overflow-hidden rounded-xl border border-ink/8 bg-white">
      <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-[#2e7d55] px-3.5 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-[12.5px] font-bold text-white">{office || "Prestij Gayrimenkul"}</div>
          <div className="font-mono text-[8.5px] text-white/70">emlakflow.app/ofis/…</div>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 font-mono text-[8.5px] font-semibold text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Canlı
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 p-2.5">
        {cards.map((l, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-ink/8">
            {l.img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.img} alt="" loading="lazy" className="h-16 w-full object-cover" />
            ) : (
              <div className={`h-16 w-full bg-gradient-to-br ${l.bg}`} />
            )}
            <div className="px-2 py-1.5">
              <div className="truncate text-[10.5px] font-semibold">{l.title}</div>
              <div className="font-mono text-[9px] text-brand-600">{l.price}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-ink/8 px-3 py-2">
        <span className="text-[10.5px] text-ink/55">Ziyaretçi talebi → panelinize düşer</span>
        <span className="rounded-full bg-brand-600 px-2.5 py-1 text-[9.5px] font-bold text-white">Talep Gönder</span>
      </div>
    </div>
  );
}

export function CrmPreview({
  listings = [],
  office = "",
}: {
  listings?: DemoListing[];
  office?: string;
}) {
  const { active, setActive, setPaused } = useHeroDemo();
  const tab = HERO_TABS[active];

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
          {HERO_TABS.map((t, i) => (
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
            <div key={m.label} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-ink/40">
              <m.icon size={14} className="opacity-50" />
              {m.label}
            </div>
          ))}
        </div>
        <div className="bg-white p-4">
          <div className="mb-3 flex items-center gap-2 min-[440px]:hidden">
            <span className="font-display text-sm font-bold">{tab.label}</span>
          </div>
          <div key={active} className="landing-demo-view">
            <View tab={tab.key} listings={listings} office={office} />
          </div>
          <div className="mt-3 flex gap-1.5 min-[440px]:hidden">
            {HERO_TABS.map((t, i) => (
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
