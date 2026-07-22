import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Globe,
  LayoutGrid,
  Users,
  Wallet,
} from "lucide-react";
import { LandingNav } from "./landing-nav";
import { ScrollReveal } from "./scroll-reveal";
import { CrmPreview } from "./crm-preview";
import { PricingCompare } from "./pricing-compare";
import { FREE_LISTING_LIMIT } from "@/lib/plans";

/* Gerçek demo ofisi (Prestij) ilanı — landing önizlemelerinde kullanılır. */
export type DemoListing = {
  title: string;
  price: string;
  meta: string;
  district: string;
  tag: string;
  img: string;
};

/* ─────────────  Görsel mock'lar  ───────────── */

function SiteMock({ office, listings }: { office: string; listings: DemoListing[] }) {
  const cards = listings.slice(0, 3);
  const real = cards.length === 3;
  const fallback = [
    { price: "4.850.000 ₺", meta: "145 m² · 3+1" },
    { price: "7.200.000 ₺", meta: "230 m² · 4+1" },
    { price: "2.450.000 ₺", meta: "68 m² · 1+1" },
  ];
  const gradients = ["from-[#c9b08a] to-[#7d6247]", "from-[#9fae7e] to-[#55663b]", "from-[#a9c3c8] to-[#3f7d7e]"];
  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_40px_90px_-50px_rgba(20,63,43,0.55)]">
      <div className="relative h-44 bg-gradient-to-br from-[#6f9c7d] via-[#2f6047] to-[#1c3f2f]">
        <span className="absolute right-3.5 top-3.5 rounded-md border border-white/40 px-2 py-1 font-mono text-[9px] tracking-wide text-white/90">
          {real ? "emlakflow.app/ofis/prestij-gayrimenkul" : "selin-emlak.emlakflow.app"}
        </span>
        <div className="absolute bottom-4 left-4 text-white">
          <div className="text-[17px] font-bold">{real ? office : "Selin Emlak"}</div>
          <div className="text-[11px] opacity-85">Güvenilir alım-satım</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2.5 p-3.5">
        {real
          ? cards.map((c) => (
              <div key={c.title} className="overflow-hidden rounded-xl border border-ink/8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.img} alt={c.title} loading="lazy" className="h-16 w-full object-cover" />
                <div className="px-2 py-2">
                  <div className="text-[11px] font-bold">{c.price}</div>
                  <div className="mt-0.5 font-mono text-[8.5px] text-ink/45">{c.meta}</div>
                </div>
              </div>
            ))
          : fallback.map((c, i) => (
              <div key={c.price} className="overflow-hidden rounded-xl border border-ink/8">
                <div className={`h-16 bg-gradient-to-br ${gradients[i]}`} />
                <div className="px-2 py-2">
                  <div className="text-[11px] font-bold">{c.price}</div>
                  <div className="mt-0.5 font-mono text-[8.5px] text-ink/45">{c.meta}</div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

function TalepMock() {
  const cols = [
    { h: "Yeni", n: "4", cards: [{ n: "Ahmet Yılmaz", m: "3+1 arıyor · 5M altı" }, { n: "Ceren A.", m: "Kiralık · 2+1" }] },
    { h: "Aradım", n: "2", cards: [{ n: "Deniz Kaya", m: "Arsa · Alikahya" }] },
    { h: "Görüştüm", n: "1", cards: [{ n: "Elif Toprak", m: "Villa · Kartepe" }] },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {cols.map((c) => (
        <div key={c.h} className="rounded-lg border border-ink/8 bg-paper p-2">
          <div className="mb-1.5 flex items-center justify-between font-mono text-[8.5px] uppercase tracking-wide text-ink/45">
            <span>{c.h}</span>
            <span>{c.n}</span>
          </div>
          {c.cards.map((l) => (
            <div key={l.n} className="mb-1.5 rounded-md border border-ink/8 bg-white px-2 py-1.5">
              <div className="text-[10.5px] font-semibold leading-tight">{l.n}</div>
              <div className="mt-0.5 font-mono text-[8px] text-ink/45">{l.m}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function StatMock() {
  const bars = [40, 62, 48, 78, 66, 92];
  return (
    <div className="rounded-xl border border-ink/8 bg-paper p-3">
      <div className="flex h-20 items-end gap-1.5">
        {bars.map((h, i) => (
          <div key={i} className={`flex-1 rounded-t ${i === bars.length - 1 ? "bg-brand-600" : "bg-brand-600/55"}`} style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[9px] text-ink/40">
        {["Pzt", "Sal", "Çar", "Per", "Cum", "Bugün"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
    </div>
  );
}

function RentMock() {
  return (
    <div className="rounded-xl border border-ink/8 bg-paper p-3">
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
      <div className="flex justify-between border-t border-ink/8 py-1.5 text-[11px]">
        <span>Yuvacık · daire</span>
        <span className="font-mono">18.500 ₺ · 3 gün sonra</span>
      </div>
      <div className="flex justify-between border-t border-ink/8 py-1.5 text-[11px] text-[#b4552f]">
        <span className="text-ink">Körfez · dükkan</span>
        <span className="font-mono">24.000 ₺ · gecikti</span>
      </div>
    </div>
  );
}

/* ─────────────  Ortak  ───────────── */

function CtaButton({
  href,
  variant = "primary",
  children,
}: {
  href: string;
  variant?: "primary" | "secondary" | "inverse" | "ghost-dark";
  children: ReactNode;
}) {
  const styles = {
    primary: "bg-brand-600 text-white shadow-[0_8px_28px_-6px_rgba(30,91,62,0.45)] hover:bg-brand-700",
    secondary: "border border-ink/12 bg-white text-ink hover:bg-paper",
    inverse: "bg-white text-brand-700 hover:bg-brand-50",
    "ghost-dark": "border border-white/25 text-white hover:bg-white/10",
  };
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-7 py-3.5 text-base font-bold transition-all ${styles[variant]}`}
    >
      {children}
    </Link>
  );
}

const FEATURES = [
  {
    icon: Users,
    title: "Gelen talepler kaybolmasın",
    desc: "Web sitenizi, WhatsApp'ı ve telefonu arayan herkes tek listede. Kimi aradınız, kimi bekliyor — hepsi bir bakışta belli.",
    mock: <TalepMock />,
    big: true,
  },
  {
    icon: BarChart3,
    title: "Hangi ilan ilgi görüyor",
    desc: "Her ilanınızın kaç kez görüldüğünü, talebin nereden geldiğini görün.",
    mock: <StatMock />,
    big: false,
  },
  {
    icon: LayoutGrid,
    title: "Günün özeti önünüzde",
    desc: "Her sabah bugünkü randevularınız, aramalarınız ve yeni talepler karşınızda.",
    mock: (
      <div className="space-y-1.5 rounded-xl border border-ink/8 bg-paper p-3">
        {[
          { t: "14:00 · Yer gösterimi", r: "Yuvacık", c: "text-ink/45" },
          { t: "Ahmet Bey'i ara", r: "gecikti", c: "text-[#b4552f]" },
          { t: "Yeni talep: 3+1", r: "bugün", c: "text-brand-600" },
        ].map((x) => (
          <div key={x.t} className="flex items-center justify-between text-[12px]">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
              {x.t}
            </span>
            <span className={`font-mono text-[10px] ${x.c}`}>{x.r}</span>
          </div>
        ))}
      </div>
    ),
    big: false,
  },
  {
    icon: Wallet,
    title: "Kira takibi kendini yapsın",
    desc: "Sözleşmeler, bu ay ne tahsil edildi, hangi ödeme yaklaşıyor, hangisi gecikti — siz sadece bakın.",
    mock: <RentMock />,
    big: true,
  },
];

/* Fiyatlar — TASLAK (fiyat çalışmasında netleşecek). Model: 3 katman + kredi (Stüdyo'da). */
const PRO_MONTHLY = 599;
const PRO_YEARLY = 5990;
const tl = new Intl.NumberFormat("tr-TR");

export function LandingContent({
  demoOffice = "",
  demoListings = [],
}: {
  demoOffice?: string;
  demoListings?: DemoListing[];
}) {
  return (
    <div className="landing-root min-h-screen bg-paper text-ink selection:bg-brand-500/25">
      <LandingNav />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-5 pb-16 pt-28 sm:px-8 sm:pt-36">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-70"
          style={{ background: "radial-gradient(80% 90% at 78% 0%, rgba(30,91,62,0.10), transparent 60%)" }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.08fr]">
          <ScrollReveal>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-600/20 bg-brand-50 px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
                Emlakçının ücretsiz web sitesi + iş takibi
              </span>
              <h1 className="mt-5 font-display text-[clamp(2.5rem,5.6vw,4rem)] font-extrabold leading-[1.02] tracking-tight">
                İlanların, müşterilerin
                <br />
                ve <span className="text-brand-600">web siten</span> — tek yerde.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/60">
                Ücretsiz emlak web siteni dakikalar içinde aç, ilanlarını ekle,
                linkini paylaş. Gelen talepleri, kiralarını ve randevularını da
                aynı yerden takip et — deftere, Excel'e gerek yok.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <CtaButton href="/register">
                  Ücretsiz başla
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </CtaButton>
                <CtaButton href="/ofis/prestij-gayrimenkul" variant="secondary">
                  Örnek siteyi gör
                </CtaButton>
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm text-ink/55">
                <Check size={15} className="text-brand-600" />
                Kredi kartı yok · {FREE_LISTING_LIMIT} ilana kadar ücretsiz
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal from="right" delay={120}>
            <CrmPreview listings={demoListings} />
          </ScrollReveal>
        </div>

        <ScrollReveal delay={160}>
          <div className="mx-auto mt-14 flex max-w-6xl flex-wrap items-center justify-center gap-x-7 gap-y-3 border-y border-ink/8 py-4">
            <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Tek yerde</span>
            {["Web siten", "İlanların", "Müşterilerin", "Kiralar", "Randevular", "İstatistikler"].map((t) => (
              <span key={t} className="text-[15px] font-bold">
                {t}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── ÜCRETSİZ WEB SİTESİ ── */}
      <section id="website" className="scroll-mt-20 px-5 py-24 sm:px-8">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
          <ScrollReveal from="left">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">
                Ücretsiz emlak web sitesi
              </p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-[2.75rem] sm:leading-[1.05]">
                Kendi siten, kendi adın.
                <br />
                Seni anlatır, seni pazarlar.
              </h2>
              <p className="mt-4 max-w-xl text-lg text-ink/60">
                İlanlarını ekle, hakkında ve iletişim bilgilerini yaz — profesyonel
                sitenizin linki hazır. WhatsApp'ta, Instagram'da paylaş; sitenden
                gelen her talep doğrudan panelinize düşsün.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  `${FREE_LISTING_LIMIT} ilan, harita ve “Hakkımda” bölümü — ücretsiz.`,
                  "Ziyaretçinin bıraktığı talep anında listenize gelir.",
                  "Hangi ilanın kaç kez görüldüğünü canlı takip edin.",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-[15px]">
                    <Check size={18} className="mt-0.5 shrink-0 text-brand-600" />
                    {t}
                  </li>
                ))}
              </ul>
              <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand-600/20 bg-brand-50 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-brand-700">
                <Globe size={13} /> İsteyen kendi alan adını bağlar (Pro)
              </span>
            </div>
          </ScrollReveal>
          <ScrollReveal from="right" delay={100}>
            <SiteMock office={demoOffice} listings={demoListings} />
          </ScrollReveal>
        </div>
      </section>

      {/* ── ÖZELLİKLER ── */}
      <section id="ozellikler" className="scroll-mt-20 border-t border-ink/8 bg-white px-5 py-24 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">
                Emlakçının iş takibi
              </p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
                İşinizin tamamı, tek ekranda.
              </h2>
              <p className="mt-4 text-lg text-ink/60">
                Deftere, Excel'e ve dağınık WhatsApp mesajlarına son. Portföyünüz,
                müşterileriniz ve kiralarınız aynı yerde — her sabah &ldquo;bugün ne
                yapmalıyım?&rdquo; sorusunun cevabı önünüzde.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-6">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 70} className={f.big ? "lg:col-span-4" : "lg:col-span-2"}>
                <article className="flex h-full flex-col rounded-3xl border border-ink/10 bg-paper p-6 transition-all hover:-translate-y-1 hover:shadow-[0_24px_50px_-26px_rgba(20,63,43,0.3)] sm:p-7">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <f.icon size={19} />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/55">{f.desc}</p>
                  <div className="mt-5">{f.mock}</div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── NASIL ÇALIŞIR ── */}
      <section id="nasil" className="scroll-mt-20 px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="max-w-xl">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">Nasıl çalışır</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Üç adımda yayında.</h2>
            </div>
          </ScrollReveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              { no: "01", t: "Ücretsiz kaydolun", d: "Kredi kartı yok. Bir dakikada paneliniz ve web siteniz hazır." },
              { no: "02", t: "İlanlarınızı ekleyin", d: "Fotoğrafları yükleyin, hakkınızda yazın. Siteniz sizi profesyonelce anlatsın." },
              { no: "03", t: "Paylaşın, takip edin", d: "Linkinizi paylaşın; gelen talepleri, kiraları ve randevuları panelden yönetin." },
            ].map((s, i) => (
              <ScrollReveal key={s.no} delay={i * 80}>
                <div className="h-full rounded-2xl border border-ink/10 bg-white p-6">
                  <div className="font-mono text-sm font-bold text-brand-600">{s.no}</div>
                  <h3 className="mt-3 font-display text-lg font-bold">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/55">{s.d}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FİYATLANDIRMA: 3 katman ── */}
      <section id="fiyatlar" className="scroll-mt-20 border-t border-ink/8 bg-white px-5 py-24 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">Fiyatlandırma</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Ücretsiz başlayın.</h2>
              <p className="mt-4 text-lg text-ink/60">
                {FREE_LISTING_LIMIT} ilana kadar her şey ücretsiz. Daha fazla ilan, kendi alan adı veya
                ekip gerektiğinde büyütün.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {/* Ücretsiz */}
            <ScrollReveal>
              <div className="flex h-full flex-col rounded-3xl border border-ink/10 bg-paper p-7">
                <div className="font-display text-lg font-bold">Ücretsiz</div>
                <div className="mt-1 min-h-[40px] text-sm text-ink/55">Denemek isteyen her emlakçı için</div>
                <div className="mt-3 font-display text-4xl font-extrabold tracking-tight">₺0</div>
                <div className="mt-1 text-sm text-ink/50">her zaman</div>
                <ul className="mt-6 space-y-2.5">
                  {[
                    `Kendi web siteniz + ${FREE_LISTING_LIMIT} ilan`,
                    "Müşteri ve talep takibi",
                    "Kira takibi, ajanda ve randevular",
                    "İlan görüntülenme istatistiği",
                    "AI tanıtım videosu — krediyle (Stüdyo'da)",
                  ].map((f) => (
                    <li key={f} className="flex gap-2 text-sm leading-snug">
                      <Check size={16} className="mt-0.5 shrink-0 text-brand-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  <CtaButton href="/register">Ücretsiz başla</CtaButton>
                </div>
              </div>
            </ScrollReveal>

            {/* Pro */}
            <ScrollReveal delay={80}>
              <div className="relative flex h-full flex-col rounded-3xl border border-brand-600 bg-white p-7 shadow-[0_24px_50px_-26px_rgba(20,63,43,0.35)]">
                <span className="absolute -top-3 left-7 rounded-full bg-brand-600 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-white">
                  En popüler
                </span>
                <div className="font-display text-lg font-bold">Pro</div>
                <div className="mt-1 min-h-[40px] text-sm text-ink/55">5 ilandan sonrası, kendi alan adı ve yönlendirme</div>
                <div className="mt-3 font-display text-4xl font-extrabold tracking-tight">
                  ₺{tl.format(PRO_MONTHLY)} <span className="text-[14px] font-medium text-ink/50">/ ay</span>
                </div>
                <div className="mt-1 text-sm text-ink/50">Yıllık ₺{tl.format(PRO_YEARLY)} — 2 ay hediye</div>
                <ul className="mt-6 space-y-2.5">
                  {[
                    "Sınırsız ilan (5 üstü)",
                    "Kendi alan adınız (domain)",
                    "Yönlendirme / referans kazancı",
                    "AI ilan metni, fiyat önerisi ve raporlar",
                    "Öncelikli destek",
                  ].map((f) => (
                    <li key={f} className="flex gap-2 text-sm leading-snug">
                      <Check size={16} className="mt-0.5 shrink-0 text-brand-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  <CtaButton href="mailto:hello@emlakflow.app?subject=Pro%20paket">İletişime geç</CtaButton>
                </div>
              </div>
            </ScrollReveal>

            {/* Premium */}
            <ScrollReveal delay={160}>
              <div className="flex h-full flex-col rounded-3xl border border-ink/10 bg-paper p-7">
                <div className="font-display text-lg font-bold">Premium</div>
                <div className="mt-1 min-h-[40px] text-sm text-ink/55">Ekipli ofisler ve markanız için</div>
                <div className="mt-3 font-display text-4xl font-extrabold tracking-tight">Ofisinize özel</div>
                <div className="mt-1 text-sm text-ink/50">size uygun teklif</div>
                <ul className="mt-6 space-y-2.5">
                  {[
                    "Pro'daki her şey dahil",
                    "Sınırsız ekip / çoklu kullanıcı",
                    "Rozetsiz vitrin (kendi markanız)",
                    "Şube / franchise yönetimi",
                    "Aylık tanıtım videosu paketi",
                  ].map((f) => (
                    <li key={f} className="flex gap-2 text-sm leading-snug">
                      <Check size={16} className="mt-0.5 shrink-0 text-brand-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  <CtaButton href="mailto:hello@emlakflow.app?subject=Premium%20paket" variant="secondary">
                    İletişime geç
                  </CtaButton>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Detay göster — karşılaştırma tablosu */}
          <ScrollReveal delay={120}>
            <PricingCompare />
          </ScrollReveal>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-5 pb-24 sm:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[26px] bg-brand-600 px-6 py-20 text-center text-white sm:py-24">
          <ScrollReveal from="scale">
            <h2 className="mx-auto max-w-[20ch] font-display text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1.05] tracking-tight">
              Web siteniz ve iş takibiniz, bugün başlasın.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={120}>
            <p className="mx-auto mt-5 max-w-lg text-lg text-white/75">
              Kredi kartı yok, kurulum yok. 10 dakikada siteniz yayında; büyüdükçe
              kendi alan adınızı ve videoları ekleyin.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <CtaButton href="/register" variant="inverse">
                Ücretsiz hesap aç
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </CtaButton>
              <CtaButton href="/ofis/prestij-gayrimenkul" variant="ghost-dark">
                Örnek siteyi gez
              </CtaButton>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-ink/10 bg-paper py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
          <p className="font-display text-lg font-extrabold">
            Emlak<span className="text-brand-600">Flow</span>
          </p>
          <p className="text-sm text-ink/45">© {new Date().getFullYear()} · Emlakçının dijital ofisi</p>
          <div className="flex gap-6 text-sm text-ink/50">
            <Link href="/blog" className="hover:text-ink">Blog</Link>
            <Link href="/login" className="hover:text-ink">Giriş</Link>
            <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">Ücretsiz başla</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
