import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  FileText,
  MessageCircle,
  Rss,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { LandingNav } from "./landing-nav";
import { ScrubHero } from "./scrub-hero";
import { ScrollReveal } from "./scroll-reveal";
import { ScrollStory } from "./scroll-story";
import { CountUp } from "./count-up";
import { FeatureMarquee } from "./marquee";
import { KanbanMockup, MatchMockup, PortalMockup, ChatMockup } from "./product-mockups";

/* ── Yardımcı görseller ── */

function VitrinVisual() {
  return (
    <div>
      <div className="flex items-center gap-2 rounded-t-xl border border-b-0 border-ink/10 bg-paper px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
        <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
        <span className="h-2 w-2 rounded-full bg-[#28c840]" />
        <span className="mx-auto rounded bg-white px-3 py-0.5 font-mono text-[10px] text-ink/45">
          emlakflow.com/ofis/sizin-ofisiniz
        </span>
      </div>
      <div className="relative h-56 overflow-hidden rounded-b-xl border border-ink/10 bg-[#e8ebe4]">
        <div className="landing-hero-grid absolute inset-0 opacity-70" />
        <div className="fiyat-pin landing-float-a absolute left-[18%] top-[24%] text-[10px]">₺4.2M</div>
        <div className="fiyat-pin fiyat-pin-kira landing-float-b absolute right-[22%] top-[42%] text-[10px]">
          ₺28K/ay
        </div>
        <div className="fiyat-pin landing-float-c absolute bottom-[22%] left-[42%] text-[10px]">₺6.5M</div>
        <div className="absolute bottom-3 right-3 rounded-lg border border-ink/10 bg-white px-3 py-2 shadow-md">
          <p className="font-mono text-[9px] uppercase tracking-wider text-brand-600">Yeni lead</p>
          <p className="text-[11px] font-semibold text-ink">Ayşe Y. — vitrin formu</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {["Sahibinden ✓", "Hepsiemlak ✓", "Emlakjet ✓"].map((p) => (
          <span
            key={p}
            className="rounded-full border border-ink/10 bg-paper px-2.5 py-1 text-[10px] font-medium text-ink/60"
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

function CommissionVisual() {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-5">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink/40">Satış #2847 · Başiskele 3+1</p>
      <p className="mt-1 font-display text-4xl font-extrabold text-ink">₺145.000</p>
      <div className="mt-4 space-y-2 border-t border-ink/8 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-ink/55">Danışman payı (%50)</span>
          <span className="font-semibold">₺72.500</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink/55">Ofis payı</span>
          <span className="font-semibold">₺72.500</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink/55">KDV dahil fatura</span>
          <span className="font-semibold text-brand-600">Hazır</span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700">
        <Zap size={14} />
        Satış kapanınca otomatik hesaplandı
      </div>
    </div>
  );
}

const STORY_STEPS = [
  {
    no: "01 — YAYINLA",
    title: "İlan bir kez girilir, her yerde görünür.",
    body: "Fotoğraf, detay ve konum — hepsi tek formda. Harita vitrininiz ve portal ilanlarınız aynı anda güncellenir. Çift giriş, eski fiyat, kopuk ilan derdi biter.",
    visual: <VitrinVisual />,
  },
  {
    no: "02 — EŞLEŞTİR",
    title: "Doğru alıcı, doğru ilan — otomatik.",
    body: "Yeni ilan yayına girdiği an açık talepler skorlanır: bütçe, semt, oda sayısı. Sabah ofise geldiğinizde arayacağınız müşteri listesi hazırdır.",
    visual: <MatchMockup />,
  },
  {
    no: "03 — YÜRÜT",
    title: "Satış hattı tek panoda, ekip senkron.",
    body: "Yeni → Yer gösterildi → Teklif → Sözleşme. Sürükle-bırak kanbanda hiçbir müşteri unutulmaz, hiçbir teklif havada kalmaz.",
    visual: <KanbanMockup />,
  },
  {
    no: "04 — KAZAN",
    title: "Satış kapanır, herkesin payı ekranda.",
    body: "İmza atıldığı an danışman payı ve ofis payı kendiliğinden hesaplanır. Ay sonu Excel'i, WhatsApp'ta pay hesabı, hesap makinesi — hepsi tarihe karışır.",
    visual: <CommissionVisual />,
  },
];

const SMALL_FEATURES = [
  { icon: Sparkles, title: "AI ilan yazarı", desc: "Başlığı ve açıklamayı yapay zekâ yazar — saniyeler içinde, aramaya hazır." },
  { icon: FileText, title: "Tek tık sözleşme", desc: "Ofis bilgilerinizle dolu, yazdırmaya hazır sözleşme — sıfırdan yazmak yok." },
  { icon: Calendar, title: "Akıllı ajanda", desc: "Yer gösterimleri, görüşmeler ve randevular tek takvimde; çakışırsa haber verir." },
  { icon: Bell, title: "Anlık bildirim", desc: "Yeni lead, taze eşleşme, kapanan satış — olduğu saniye cebinizde." },
  { icon: Users, title: "Ekip yönetimi", desc: "Danışman bazlı portföy, yetki ve performans — kim neyi kapattı, tek bakışta." },
  { icon: BarChart3, title: "Canlı analitik", desc: "Vitrin trafiği, dönüşüm ve aylık ciro — kararlarınızı his değil veri versin." },
];

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
    primary:
      "bg-brand-600 text-white shadow-[0_8px_28px_-6px_rgba(30,91,62,0.45)] hover:bg-brand-700 hover:shadow-[0_12px_36px_-6px_rgba(30,91,62,0.55)]",
    secondary: "border border-ink/12 bg-white/90 text-ink backdrop-blur hover:bg-white",
    inverse: "bg-white text-ink hover:bg-brand-50",
    "ghost-dark": "border border-white/20 text-white hover:bg-white/10",
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

export function LandingContent() {
  return (
    <div className="landing-root min-h-screen bg-paper text-ink selection:bg-brand-500/25">
      <LandingNav />

      {/* ── Hero: scroll'un sürdüğü sinematik harita ── */}
      <section className="relative">
        <ScrubHero />
      </section>

      <FeatureMarquee />

      {/* ── Scroll story: bir satışın yolculuğu ── */}
      <section id="yolculuk" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <ScrollReveal>
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-600">
                Nasıl çalışır
              </p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
                İlk tıktan imzaya,
                <br />
                dört adımda akış.
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-4 lg:mt-0">
            <ScrollStory steps={STORY_STEPS} />
          </div>
        </div>
      </section>

      {/* ── Sayılar ── */}
      <section className="border-y border-ink/8 bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-5 sm:px-8 lg:grid-cols-4">
          {[
            { to: 60, suffix: " sn", label: "İlan girişinden vitrine" },
            { to: 3, suffix: "", label: "Portal, tek kaynaktan güncel" },
            { to: 7, suffix: "+", label: "Modül, tek panelde" },
            { to: 14, suffix: "", label: "Gün ücretsiz deneme" },
          ].map((s, i) => (
            <ScrollReveal key={s.label} delay={i * 80}>
              <div className="text-center">
                <p className="font-display text-5xl font-extrabold tracking-tight text-brand-600 sm:text-6xl">
                  <CountUp to={s.to} suffix={s.suffix} />
                </p>
                <p className="mt-2 text-sm text-ink/55">{s.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Özellik bento ── */}
      <section id="ozellikler" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <ScrollReveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-600">
                Özellikler
              </p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
                Beş ayrı uygulama değil.
                <br />
                Tek akıcı panel.
              </h2>
              <p className="mt-4 text-lg text-ink/55">
                Vitrinden ekip yönetimine, ofisinizin tüm ritmi aynı ekranda atar.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
            {/* Büyük koyu kart: vitrin sohbeti */}
            <ScrollReveal from="left" className="lg:col-span-7">
              <article className="group flex h-full flex-col rounded-3xl border border-ink/20 bg-ink p-7 text-white transition-all hover:-translate-y-1 hover:shadow-[0_28px_60px_-20px_rgba(23,32,28,0.5)] sm:p-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <MessageCircle size={20} />
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white/70">
                    Canlı sohbet
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold">
                  Gece yazılan mesaj, sabah lead olarak bekler.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  Vitrin sohbeti doğrudan CRM&apos;e bağlı. Hiçbir mesaj
                  WhatsApp karmaşasında kaybolmaz — her konuşma takip altında.
                </p>
                <div className="mt-6 flex-1 rounded-2xl bg-white/[0.06] p-4">
                  <ChatMockup />
                </div>
              </article>
            </ScrollReveal>

            {/* Portal feed */}
            <ScrollReveal from="right" delay={80} className="lg:col-span-5">
              <article className="group flex h-full flex-col rounded-3xl border border-ink/10 bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-[0_28px_60px_-24px_rgba(23,32,28,0.25)] sm:p-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Rss size={20} />
                  </div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                    Portallar
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold">
                  Sahibinden, Hepsiemlak, Emlakjet — tek kaynak.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/55">
                  İlanı bir kez girin, portallarınız kendini güncellesin.
                  Eski fiyat, kopuk link, unutulan ilan kalmaz.
                </p>
                <div className="mt-6 flex-1">
                  <PortalMockup />
                </div>
              </article>
            </ScrollReveal>
          </div>

          {/* Küçük kartlar */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SMALL_FEATURES.map((x, i) => (
              <ScrollReveal key={x.title} delay={i * 60}>
                <div className="group h-full rounded-2xl border border-ink/10 bg-white p-6 transition-all hover:-translate-y-1 hover:border-brand-500/30 hover:shadow-[0_16px_40px_-16px_rgba(23,32,28,0.2)]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <x.icon size={19} />
                  </div>
                  <h4 className="mt-4 font-display text-lg font-bold">{x.title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/55">{x.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden bg-ink py-28 text-white sm:py-36">
        <div className="landing-glow-orb landing-glow-orb-a absolute -left-20 top-10 h-80 w-80 opacity-25" aria-hidden />
        <div className="landing-glow-orb landing-glow-orb-b absolute -right-24 bottom-0 h-96 w-96 opacity-20" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
          <ScrollReveal from="scale">
            <h2 className="font-display text-[clamp(2.5rem,7vw,5rem)] font-extrabold leading-[1.05] tracking-tight">
              Excel&apos;i kapatın.
              <br />
              <span className="bg-gradient-to-r from-brand-100 via-white to-brand-100 bg-clip-text text-transparent">
                Akışa geçin.
              </span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={120}>
            <p className="mx-auto mt-6 max-w-lg text-lg text-white/60">
              14 gün boyunca tüm modüller açık. Kredi kartı yok,
              kurulum 5 dakika.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={220}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <CtaButton href="/register" variant="inverse">
                14 gün ücretsiz dene
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </CtaButton>
              <CtaButton href="/ofis/atlas-gayrimenkul" variant="ghost-dark">
                Demo vitrini incele
              </CtaButton>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-ink/10 bg-paper py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
          <p className="font-display text-lg font-extrabold">
            Emlak<span className="text-brand-600">Flow</span>
          </p>
          <p className="text-sm text-ink/45">© {new Date().getFullYear()} · ESAPP PropTech</p>
          <div className="flex gap-6 text-sm text-ink/50">
            <Link href="/blog" className="hover:text-ink">
              Blog
            </Link>
            <Link href="/login" className="hover:text-ink">
              Giriş
            </Link>
            <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              Ücretsiz dene
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
