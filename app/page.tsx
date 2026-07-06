import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Calendar,
  ChevronRight,
  FileText,
  MapPin,
  MessageCircle,
  Rss,
  Sparkles,
  Target,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { LandingHeroMap } from "@/components/landing-hero-map";
import { ScrollReveal } from "@/components/scroll-reveal";

const MARQUEE_ITEMS = [
  "Harita vitrini",
  "Akıllı eşleştirme",
  "Kanban satış hattı",
  "Otomatik komisyon",
  "Portal XML feed",
  "Canlı vitrin sohbeti",
  "SEO AI",
  "Sözleşme taslağı",
  "Ajanda & randevu",
  "Ekip yönetimi",
  "Lead yakalama",
  "Analitik",
];

const SIDEBAR_NAV = ["Bugün", "Portföy", "Satış Hattı", "Kasa"];

const STATS = [
  { value: "7+", label: "Modül tek panelde" },
  { value: "0", label: "Kod bilgisi gerekir" },
  { value: "1", label: "Tıkla vitrin linki" },
  { value: "∞", label: "Pro'da sınırsız ilan" },
];

const STEPS = [
  {
    num: "01",
    title: "Ofisinizi açın",
    desc: "Kayıt olun, şehir ve ofis adını girin. 30 saniye.",
  },
  {
    num: "02",
    title: "İlanları girin",
    desc: "Fotoğraf yükleyin, konum seçin. Vitrin linkiniz hazır.",
  },
  {
    num: "03",
    title: "Linki paylaşın",
    desc: "WhatsApp, Instagram, kartvizit — müşteri haritada gezer.",
  },
];

const EXTRA_FEATURES = [
  {
    icon: Sparkles,
    title: "SEO AI",
    desc: "İlan başlığı ve açıklaması otomatik üretilir.",
  },
  {
    icon: FileText,
    title: "Sözleşme taslağı",
    desc: "Ofis bilgilerinizle hazır sözleşme metni.",
  },
  {
    icon: Calendar,
    title: "Ajanda",
    desc: "Yer gösterimleri ve randevular tek takvimde.",
  },
  {
    icon: Bell,
    title: "Anlık bildirim",
    desc: "Lead, eşleşme ve satış anında zilde.",
  },
];

const FREE_FEATURES = [
  "Tüm Pro özellikleri açık",
  "Sınırsız ilan denemesi",
  "Kendi vitrin linkiniz",
  "İstediğiniz zaman iptal",
];

const PRO_FEATURES = [
  "Sınırsız ilan & danışman",
  "Harita vitrini + canlı sohbet",
  "Portal XML feed",
  "Komisyon & sözleşme modülü",
  "Öncelikli destek",
];

export default async function LandingPage() {
  const session = await getSession();
  if (session) {
    redirect("/platform");
  }

  const marqueeDoubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div className="landing-root min-h-screen bg-paper text-ink selection:bg-brand-500/25">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-ink/8 bg-paper/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link href="/" className="font-display text-xl font-extrabold tracking-tight">
            Emlak<span className="text-brand-600">Flow</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-ink/60 md:flex">
            <a href="#ozellikler" className="transition-colors hover:text-ink">
              Özellikler
            </a>
            <a href="#fiyat" className="transition-colors hover:text-ink">
              Fiyat
            </a>
            <Link
              href="/ofis/atlas-gayrimenkul"
              target="_blank"
              className="transition-colors hover:text-ink"
            >
              Canlı demo
            </Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-semibold text-ink/65 transition-colors hover:text-ink sm:inline"
            >
              Giriş
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] sm:px-5"
            >
              Ücretsiz dene
              <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div
          className="landing-hero-grid absolute inset-0 -z-10 opacity-[0.35]"
          aria-hidden
        />
        <div
          className="landing-glow-orb landing-glow-orb-a absolute -left-32 top-20 -z-10 h-96 w-96 opacity-40"
          aria-hidden
        />
        <div
          className="landing-glow-orb landing-glow-orb-b absolute -right-32 top-40 -z-10 h-80 w-80 opacity-30"
          aria-hidden
        />

        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <ScrollReveal>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-700">
                <Sparkles size={14} className="text-brand-600" aria-hidden />
                Türk emlak ofisleri için tek platform
              </div>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <h1 className="font-display text-[2.75rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Portföyden komisyona
                <br />
                <span className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 bg-clip-text text-transparent">
                  tek akış.
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={160}>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink/60 sm:text-xl">
                Harita vitrini, akıllı eşleştirme, satış hattı ve otomatik komisyon — dağınık
                Excel, WhatsApp ve portal panellerinin yerine.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={240}>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <Link
                  href="/register"
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-8 py-3.5 text-base font-bold text-white shadow-[0_8px_30px_-4px_rgba(30,91,62,0.45)] transition-all hover:bg-brand-700 hover:shadow-[0_12px_40px_-4px_rgba(30,91,62,0.5)] sm:h-auto sm:w-auto"
                >
                  Ücretsiz dene — 14 gün
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
                <Link
                  href="/ofis/atlas-gayrimenkul"
                  target="_blank"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-ink/12 bg-white px-8 py-3.5 text-base font-bold text-ink transition-colors hover:bg-ink/[0.03] sm:h-auto sm:w-auto"
                >
                  Canlı vitrin demo
                  <ChevronRight size={18} aria-hidden />
                </Link>
              </div>
              <p className="mt-4 text-sm text-ink/45">
                Kredi kartı gerekmez · 5 dakikada kurulum
              </p>
            </ScrollReveal>
          </div>

          {/* Browser mockup */}
          <ScrollReveal delay={320} className="mt-16 sm:mt-20">
            <div className="landing-mockup-shell relative mx-auto w-full max-w-4xl">
              <div className="landing-glow-orb landing-glow-orb-a" aria-hidden />
              <div className="landing-glow-orb landing-glow-orb-b" aria-hidden />

              <div className="relative overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_32px_80px_-20px_rgba(23,32,28,0.35)] ring-1 ring-ink/5">
                <div className="flex items-center gap-2 border-b border-ink/8 bg-paper/80 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  <div className="mx-auto flex h-7 max-w-xs flex-1 items-center justify-center rounded-md bg-white px-3 font-mono text-[10px] text-ink/45">
                    emlakflow.com/ofis/atlas-gayrimenkul
                  </div>
                </div>

                <div className="grid min-h-[280px] grid-cols-[140px_1fr] sm:min-h-[340px] sm:grid-cols-[180px_1fr]">
                  <div className="hidden border-r border-ink/8 bg-brand-50/40 p-3 sm:block">
                    <div className="mb-4 font-display text-sm font-extrabold">
                      Emlak<span className="text-brand-600">Flow</span>
                    </div>
                    {SIDEBAR_NAV.map((item) => (
                      <div
                        key={item}
                        className={`mb-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
                          item === "Bugün"
                            ? "bg-brand-600 text-white"
                            : "text-ink/55"
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="relative overflow-hidden">
                    <LandingHeroMap />
                  </div>
                </div>
              </div>

              <div className="landing-float-c absolute -left-2 top-8 hidden rounded-xl border border-ink/10 bg-white px-4 py-3 shadow-xl sm:block lg:-left-8">
                <p className="font-mono text-[9px] uppercase tracking-wider text-ink/40">
                  Eşleşme
                </p>
                <p className="font-display text-2xl font-extrabold text-brand-600">94</p>
                <p className="text-[10px] text-ink/50">3+1 talep ↔ yeni ilan</p>
              </div>

              <div className="landing-float-a absolute -right-2 bottom-12 hidden rounded-xl border border-ink/10 bg-ink px-4 py-3 text-white shadow-xl sm:block lg:-right-6">
                <p className="font-mono text-[9px] uppercase tracking-wider text-white/50">
                  Komisyon
                </p>
                <p className="font-display text-xl font-extrabold">₺145.000</p>
                <p className="text-[10px] text-white/60">Otomatik hesaplandı</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Marquee */}
      <div className="landing-marquee-wrap border-y border-ink/8 bg-white py-4">
        <div className="landing-marquee-track flex gap-3">
          {marqueeDoubled.map((label, i) => (
            <span
              key={`${label}-${i}`}
              className="shrink-0 rounded-full border border-ink/10 bg-paper px-4 py-1.5 text-sm font-medium text-ink/70"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <section className="border-b border-ink/8 bg-white py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 sm:grid-cols-4 sm:px-8">
          {STATS.map((stat) => (
            <ScrollReveal key={stat.label}>
              <div className="text-center">
                <p className="font-display text-3xl font-extrabold text-brand-600 sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-ink/55">{stat.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="ozellikler" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <ScrollReveal>
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">
                Özellikler
              </p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
                Ofisinizin her işi,
                <br className="hidden sm:block" />
                tek ekranda birleşir.
              </h2>
              <p className="mt-4 text-lg text-ink/55">
                Parça parça yazılım almayın. Vitrinden kasaya kadar uçtan uca.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
            {/* Harita vitrini */}
            <ScrollReveal delay={0} className="lg:col-span-7">
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white p-6 transition-shadow hover:shadow-[0_20px_50px_-20px_rgba(23,32,28,0.2)] sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <MapPin size={20} aria-hidden />
                  </div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                    Vitrin
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold sm:text-2xl">
                  Airbnb şıklığında, sizin markanızla.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/55">
                  Her ilan haritada fiyat plakasıyla durur. Müşteri tıklar, künyeli detay görür,
                  WhatsApp&apos;tan yazar veya form doldurur — lead anında satış hattınıza düşer.
                </p>
                <div className="mt-6 flex-1">
                  <div className="relative h-48 overflow-hidden rounded-xl bg-[#e8ede5] sm:h-56">
                    <div
                      className="absolute inset-0 opacity-50"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(30,91,62,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(30,91,62,0.1) 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                      }}
                    />
                    <div className="fiyat-pin absolute left-[20%] top-[25%] text-[10px]">
                      ₺4.2M
                    </div>
                    <div className="fiyat-pin fiyat-pin-kira absolute right-[25%] top-[45%] text-[10px]">
                      ₺28K
                    </div>
                    <div className="fiyat-pin absolute bottom-[20%] left-[40%] text-[10px]">
                      ₺2.8M
                    </div>
                  </div>
                </div>
              </article>
            </ScrollReveal>

            {/* Akıllı eşleştirme */}
            <ScrollReveal delay={60} className="lg:col-span-5">
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/20 bg-ink p-6 text-white transition-shadow hover:shadow-[0_20px_50px_-20px_rgba(23,32,28,0.2)] sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Target size={20} aria-hidden />
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white/70">
                    AI
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold sm:text-2xl">
                  Yeni ilan girdiğiniz an sistem arar.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  Açık talepler otomatik skorlanır. Bütçe, semt, oda sayısı — hangi müşteriyi önce
                  arayacağınızı bilirsiniz.
                </p>
                <div className="mt-6 flex-1">
                  <div className="space-y-2">
                    {[
                      { score: 94, name: "Mehmet K.", detail: "Bütçe + semt + oda sayısı", hot: true },
                      { score: 87, name: "Selin A.", detail: "Kartepe · 3+1 · max 4.5M", hot: false },
                      { score: 76, name: "Can D.", detail: "Deniz manzarası tercihi", hot: false },
                    ].map((lead) => (
                      <div
                        key={lead.name}
                        className="flex items-center gap-3 rounded-xl border border-ink/8 bg-white p-3 shadow-sm"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold ${
                            lead.hot
                              ? "bg-brand-600 text-white"
                              : "bg-brand-100 text-brand-700"
                          }`}
                        >
                          {lead.score}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink">{lead.name}</p>
                          <p className="truncate text-[11px] text-ink/50">{lead.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </ScrollReveal>

            {/* Satış hattı */}
            <ScrollReveal delay={120} className="lg:col-span-6">
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white p-6 transition-shadow hover:shadow-[0_20px_50px_-20px_rgba(23,32,28,0.2)] sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Users size={20} aria-hidden />
                  </div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                    CRM
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold sm:text-2xl">
                  Excel tablosu değil, görsel pipeline.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/55">
                  Yeni → Yer gösterildi → Teklif → Sözleşme. Sürükle-bırak Kanban ile ekibiniz aynı
                  sayfada kalır.
                </p>
                <div className="mt-6 flex-1">
                  <div className="flex gap-2.5 p-1 sm:gap-3">
                    <div className="min-w-0 flex-1 rounded-xl bg-ink/5 p-2 sm:p-2.5">
                      <p className="mb-2 truncate font-mono text-[9px] font-semibold uppercase tracking-wider text-ink/45">
                        Yeni
                      </p>
                      {[0, 1].map((i) => (
                        <div
                          key={i}
                          className="mb-2 rounded-lg border border-ink/8 bg-white p-2.5 shadow-sm"
                        >
                          <div className="h-1.5 w-2/3 rounded bg-ink/15" />
                          <div className="mt-2 h-1 w-1/2 rounded bg-ink/10" />
                        </div>
                      ))}
                    </div>
                    <div className="min-w-0 flex-1 rounded-xl bg-ink/5 p-2 sm:p-2.5">
                      <p className="mb-2 truncate font-mono text-[9px] font-semibold uppercase tracking-wider text-ink/45">
                        Yer Gösterildi
                      </p>
                      <div className="mb-2 rounded-lg border border-brand-500/30 bg-brand-50 p-2.5 shadow-sm ring-2 ring-brand-500/20">
                        <div className="h-1.5 w-2/3 rounded bg-ink/15" />
                        <div className="mt-2 h-1 w-1/2 rounded bg-ink/10" />
                        <p className="mt-2 text-[10px] font-semibold text-brand-700">
                          ₺3.2M · İzmit
                        </p>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 rounded-xl bg-ink/5 p-2 sm:p-2.5">
                      <p className="mb-2 truncate font-mono text-[9px] font-semibold uppercase tracking-wider text-ink/45">
                        Teklif
                      </p>
                      <div className="mb-2 rounded-lg border border-ink/8 bg-white p-2.5 shadow-sm">
                        <div className="h-1.5 w-2/3 rounded bg-ink/15" />
                        <div className="mt-2 h-1 w-1/2 rounded bg-ink/10" />
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </ScrollReveal>

            {/* Otomatik komisyon */}
            <ScrollReveal delay={180} className="lg:col-span-6">
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white p-6 transition-shadow hover:shadow-[0_20px_50px_-20px_rgba(23,32,28,0.2)] sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Wallet size={20} aria-hidden />
                  </div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                    Finans
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold sm:text-2xl">
                  Satış kapandı, kasa hazır.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/55">
                  Danışman payı, ofis kesintisi, KDV — tek tıkla hesaplanır. Ay sonu tartışması
                  biter.
                </p>
                <div className="mt-6 flex-1">
                  <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-lg">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-ink/40">
                      Satış #2847
                    </p>
                    <p className="mt-1 font-display text-3xl font-extrabold text-ink">
                      ₺145.000
                    </p>
                    <div className="mt-4 space-y-2 border-t border-ink/8 pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-ink/55">Danışman (%50)</span>
                        <span className="font-semibold">₺72.500</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-ink/55">Ofis payı</span>
                        <span className="font-semibold">₺72.500</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700">
                      <Zap size={14} aria-hidden />
                      Otomatik hesaplandı
                    </div>
                  </div>
                </div>
              </article>
            </ScrollReveal>

            {/* Portallar */}
            <ScrollReveal delay={240} className="lg:col-span-5">
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/20 bg-ink p-6 text-white transition-shadow hover:shadow-[0_20px_50px_-20px_rgba(23,32,28,0.2)] sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Rss size={20} aria-hidden />
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white/70">
                    Portallar
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold sm:text-2xl">
                  Sahibinden, Hepsiemlak, Emlakjet.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  İlanı bir kez girin. XML feed ile portallara otomatik akar. Çift giriş, eski fiyat
                  derdi yok.
                </p>
                <div className="mt-6 flex-1">
                  <div className="rounded-xl border border-ink/10 bg-ink p-4 text-white">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-white/45">
                      XML Feed
                    </p>
                    <p className="mt-1 truncate font-mono text-[11px] text-brand-100">
                      /api/feed/••••••.xml
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {["Sahibinden", "Hepsiemlak", "Emlakjet"].map((portal) => (
                        <span
                          key={portal}
                          className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-medium"
                        >
                          {portal} ✓
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-[10px] text-white/50">
                      Tek kaynak — tüm portallar senkron
                    </p>
                  </div>
                </div>
              </article>
            </ScrollReveal>

            {/* Canlı vitrin sohbeti */}
            <ScrollReveal delay={300} className="lg:col-span-7">
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white p-6 transition-shadow hover:shadow-[0_20px_50px_-20px_rgba(23,32,28,0.2)] sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <MessageCircle size={20} aria-hidden />
                  </div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                    Sohbet
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold sm:text-2xl">
                  Ziyaretçi yazar, siz anında görürsünüz.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/55">
                  Vitrindeki sohbet kutusu doğrudan CRM&apos;e bağlı. Gece yarısı gelen mesaj sabaha
                  lead olarak bekler.
                </p>
                <div className="mt-6 flex-1">
                  <div className="space-y-2.5">
                    <div className="ml-6 rounded-2xl rounded-tr-sm bg-brand-600 px-3 py-2 text-[11px] text-white">
                      Merhaba, Başiskele&apos;deki 3+1 hâlâ müsait mi?
                    </div>
                    <div className="mr-6 rounded-2xl rounded-tl-sm border border-ink/10 bg-white px-3 py-2 text-[11px] text-ink shadow-sm">
                      Evet! Yarın 14:00 yer gösterimi yapabilirim 🏠
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
                      </span>
                      <span className="text-[10px] font-medium text-brand-700">
                        Vitrin sohbeti · CRM&apos;e düştü
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={100}>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {EXTRA_FEATURES.map((feat) => (
                <div
                  key={feat.title}
                  className="rounded-2xl border border-ink/10 bg-brand-50/50 p-5 transition-colors hover:bg-brand-50"
                >
                  <feat.icon size={18} className="text-brand-600" aria-hidden />
                  <h4 className="mt-3 font-display font-bold">{feat.title}</h4>
                  <p className="mt-1 text-sm text-ink/55">{feat.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-ink/8 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <ScrollReveal>
            <div className="mx-auto max-w-xl text-center">
              <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
                3 adımda canlıdasınız
              </h2>
              <p className="mt-3 text-ink/55">Kurulum danışmanlığı yok. Kendiniz açarsınız.</p>
            </div>
          </ScrollReveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 80}>
                <div className="relative rounded-2xl border border-ink/10 bg-paper p-7">
                  <span className="font-display text-4xl font-extrabold text-brand-500/25">
                    {step.num}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/55">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="fiyat" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <ScrollReveal>
            <div className="mx-auto max-w-xl text-center">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">
                Fiyat
              </p>
              <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-5xl">
                Paket yok. Net fiyat.
              </h2>
              <p className="mt-4 text-lg text-ink/55">
                Deneyin, beğenirseniz Pro. Gizli katman, ek modül, sürpriz fatura yok.
              </p>
            </div>
          </ScrollReveal>

          <div className="mx-auto mt-14 grid max-w-3xl gap-5 sm:grid-cols-2">
            <ScrollReveal delay={0}>
              <div className="flex h-full flex-col rounded-2xl border border-ink/10 bg-white p-8">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink/45">
                  Ücretsiz dene
                </p>
                <p className="mt-4 font-display text-4xl font-extrabold">0 ₺</p>
                <p className="mt-1 text-sm text-ink/50">14 gün · kredi kartı yok</p>
                <ul className="mt-8 flex-1 space-y-3 text-sm text-ink/70">
                  {FREE_FEATURES.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="mt-8 flex h-12 items-center justify-center rounded-full border border-ink/15 font-bold text-ink transition-colors hover:bg-ink/[0.04]"
                >
                  Hemen başla
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-brand-600 bg-white p-8 shadow-[0_20px_60px_-20px_rgba(30,91,62,0.35)]">
                <div className="absolute right-4 top-4 rounded-full bg-brand-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Önerilen
                </div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-brand-600">
                  Pro
                </p>
                <div className="mt-4">
                  <span className="font-display text-4xl font-extrabold">2.500 ₺</span>
                  <span className="text-ink/50"> / ay</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-brand-700">
                  veya 25.000 ₺ / yıl — 2 ay bedava
                </p>
                <ul className="mt-8 flex-1 space-y-3 text-sm text-ink/70">
                  {PRO_FEATURES.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="mt-8 flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 font-bold text-white transition-colors hover:bg-brand-700"
                >
                  14 gün ücretsiz dene
                  <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-ink py-24 text-white sm:py-32">
        <div
          className="landing-glow-orb landing-glow-orb-a absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 opacity-20"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <ScrollReveal>
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Müşteriniz haritada gezerken
              <br />
              siz satışı kapatın.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-lg text-white/60">
              Atlas Gayrimenkul gibi ofislerin vitrinini görün, kendi ofisinizi 5 dakikada kurun.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-bold text-ink transition-transform hover:scale-[1.02] sm:w-auto"
              >
                Ücretsiz dene
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link
                href="/ofis/atlas-gayrimenkul"
                target="_blank"
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full border border-white/20 px-8 text-base font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                Demo vitrin
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/10 bg-paper py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
          <p className="font-display text-lg font-extrabold">
            Emlak<span className="text-brand-600">Flow</span>
          </p>
          <p className="text-sm text-ink/45">
            © {new Date().getFullYear()} · ESAPP PropTech vertikali
          </p>
          <div className="flex gap-6 text-sm text-ink/50">
            <Link href="/login" className="hover:text-ink">
              Giriş
            </Link>
            <Link href="/register" className="hover:text-ink">
              Kayıt
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
