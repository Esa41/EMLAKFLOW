import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, ChevronRight, LayoutDashboard, Map, Smartphone } from "lucide-react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await getSession();
  if (session) {
    redirect("/platform");
  }

  return (
    <div className="min-h-screen bg-brand-50 text-ink selection:bg-brand-500/30 selection:text-brand-900">
      {/* Navigation */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/20 bg-white/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
              <Map size={18} strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-extrabold tracking-tight text-ink">EmlakFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/giris" className="text-sm font-semibold text-ink/70 transition-colors hover:text-ink">
              Giriş Yap
            </Link>
            <Link
              href="/giris"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-ink px-5 py-2 font-medium text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 ease-out group-hover:translate-x-full" />
              <span className="text-sm font-bold">Ücretsiz Dene</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pb-20 pt-32 lg:pt-48">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-200/50 via-brand-50/20 to-brand-50" />
        
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-700 opacity-0 fill-mode-forwards">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600"></span>
              </span>
              Yeni Nesil Emlak Teknolojisi
            </div>
            
            <h1 className="animate-fade-in-up font-display text-5xl font-extrabold tracking-tight text-ink opacity-0 fill-mode-forwards sm:text-7xl lg:text-8xl" style={{ animationDelay: "150ms" }}>
              Sadece ev satmayın, <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">marka yaratın.</span>
            </h1>
            
            <p className="mx-auto mt-8 max-w-2xl animate-fade-in-up text-lg leading-relaxed text-ink/60 opacity-0 fill-mode-forwards sm:text-xl" style={{ animationDelay: "300ms" }}>
              Müşterilerinizi şık bir vitrinle büyüleyin, portföyünüzü Kanban CRM ile yönetin ve bir daha asla komisyon veya müşteri kaybı yaşamayın.
            </p>
            
            <div className="mt-10 flex animate-fade-in-up flex-col items-center justify-center gap-4 opacity-0 fill-mode-forwards sm:flex-row" style={{ animationDelay: "450ms" }}>
              <Link
                href="/giris"
                className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-ink px-8 text-base font-bold text-white shadow-xl transition-all hover:bg-ink/90 sm:w-auto"
              >
                14 Gün Ücretsiz Başla
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#ozellikler"
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-bold text-ink shadow-sm ring-1 ring-inset ring-ink/10 transition-all hover:bg-ink/5 sm:w-auto"
              >
                Özellikleri Keşfet
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="ozellikler" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Geleneksel yöntemleri unutun.</h2>
            <p className="mt-4 text-lg text-ink/60">İhtiyacınız olan her şey tek bir akıllı platformda birleşti.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm ring-1 ring-ink/5 transition-all hover:shadow-xl">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 transition-transform group-hover:scale-110">
                <Map size={24} />
              </div>
              <h3 className="mb-3 font-display text-2xl font-bold">Zarif Harita Vitrini</h3>
              <p className="mb-8 text-ink/65 leading-relaxed">
                Size özel, markalı bir web sitesi. Portföyünüzü Airbnb şıklığında bir harita arayüzüyle sunun. Kodlama veya tasarım bilgisine gerek yok.
              </p>
              <div className="absolute -bottom-10 -right-10 opacity-30 transition-all group-hover:opacity-100 group-hover:scale-105">
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 0C44.7715 0 0 44.7715 0 100C0 155.228 44.7715 200 100 200C155.228 200 200 155.228 200 100C200 44.7715 155.228 0 100 0ZM100 180C55.8172 180 20 144.183 20 100C20 55.8172 55.8172 20 100 20C144.183 20 180 55.8172 180 100C180 144.183 144.183 180 100 180Z" fill="currentColor" className="text-brand-100"/>
                  <path d="M100 40C66.8629 40 40 66.8629 40 100C40 133.137 66.8629 160 100 160C133.137 160 160 133.137 160 100C160 66.8629 133.137 40 100 40ZM100 140C77.9086 140 60 122.091 60 100C60 77.9086 77.9086 60 100 60C122.091 60 140 77.9086 140 100C140 122.091 122.091 140 100 140Z" fill="currentColor" className="text-brand-200"/>
                  <circle cx="100" cy="100" r="20" fill="currentColor" className="text-brand-500"/>
                </svg>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative overflow-hidden rounded-3xl bg-ink p-8 text-white shadow-xl lg:col-span-2">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-brand-600/30 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm transition-transform group-hover:scale-110">
                  <LayoutDashboard size={24} />
                </div>
                <h3 className="mb-3 font-display text-2xl font-bold">Görsel Müşteri Panosu (Kanban)</h3>
                <p className="max-w-md text-white/70 leading-relaxed">
                  Excel tablolarında kaybolmayın. Müşterilerinizi ve fırsatları tıpkı bir Trello panosu gibi sürükleyip bırakarak yönetin. Kiminle nerede kaldığınızı anında görün.
                </p>
                <div className="mt-8 flex gap-3">
                  <div className="h-32 w-1/3 rounded-xl bg-white/5 border border-white/10 p-3 shadow-inner backdrop-blur-md">
                    <div className="mb-2 h-4 w-1/2 rounded bg-white/20"></div>
                    <div className="mb-2 h-16 rounded bg-white/10"></div>
                  </div>
                  <div className="h-32 w-1/3 -translate-y-4 rounded-xl bg-white/10 border border-white/20 p-3 shadow-2xl backdrop-blur-md transition-transform group-hover:-translate-y-6">
                    <div className="mb-2 h-4 w-2/3 rounded bg-white/30"></div>
                    <div className="mb-2 h-12 rounded bg-brand-500"></div>
                    <div className="h-4 w-1/3 rounded bg-white/20"></div>
                  </div>
                  <div className="h-32 w-1/3 rounded-xl bg-white/5 border border-white/10 p-3 shadow-inner backdrop-blur-md">
                    <div className="mb-2 h-4 w-1/3 rounded bg-white/20"></div>
                    <div className="mb-2 h-10 rounded bg-white/10"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm ring-1 ring-ink/5 transition-all hover:shadow-xl lg:col-span-2">
              <div className="flex h-full flex-col justify-between sm:flex-row sm:items-center">
                <div className="z-10 max-w-md">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
                    <BarChart3 size={24} />
                  </div>
                  <h3 className="mb-3 font-display text-2xl font-bold">Otomatik Komisyon Takibi</h3>
                  <p className="text-ink/65 leading-relaxed">
                    Satış tamamlandığında komisyon hesaplamalarıyla uğraşmayın. Danışman, ofis ve diğer kesintiler anında hesaplanır ve kasanıza işlenir.
                  </p>
                </div>
                <div className="relative mt-8 h-40 w-full sm:mt-0 sm:w-64">
                  <div className="absolute bottom-0 right-0 h-32 w-48 rounded-2xl border border-ink/5 bg-white p-4 shadow-xl transition-transform group-hover:-translate-y-2 group-hover:-translate-x-2">
                    <div className="mb-2 text-xs font-semibold text-ink/40 uppercase tracking-wide">Toplam Komisyon</div>
                    <div className="font-display text-2xl font-bold text-ink">₺ 145.000</div>
                    <div className="mt-4 flex items-center justify-between text-xs text-ink/60">
                      <span>Danışman Payı</span>
                      <span className="font-semibold text-ink">₺ 72.500</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative overflow-hidden rounded-3xl bg-brand-600 p-8 text-white shadow-lg transition-all hover:shadow-xl hover:bg-brand-500">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm transition-transform group-hover:scale-110">
                <Smartphone size={24} />
              </div>
              <h3 className="mb-3 font-display text-2xl font-bold">Mobil Uyumlu</h3>
              <p className="text-white/80 leading-relaxed">
                Sahadayken portföyünüzü ekleyin, müşterinize anında harita linkini yollayın. Cebinizdeki ofis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / Process Section */}
      <section className="border-t border-ink/5 bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Nasıl Çalışır?</h2>
            <p className="mt-4 text-ink/60">Dijitalleşmek hiç bu kadar kolay olmamıştı.</p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Kaydolun & Özelleştirin",
                desc: "Saniyeler içinde hesabınızı açın. Marka renginizi ve logonuzu yükleyin.",
              },
              {
                step: "2",
                title: "Portföyünüzü Ekleyin",
                desc: "İlan detaylarınızı ve yüksek çözünürlüklü fotoğraflarınızı sisteme girin.",
              },
              {
                step: "3",
                title: "Satışa Başlayın",
                desc: "Kendi web site linkinizi müşterilerinizle paylaşın, fırsatları panodan yönetin.",
              },
            ].map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-ink/5 bg-brand-50/50 p-8 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl font-black text-brand-600 shadow-sm ring-1 ring-ink/5">
                  {s.step}
                </div>
                <h3 className="mb-2 text-xl font-bold">{s.title}</h3>
                <p className="text-ink/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-ink py-24 text-white sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-900/40 via-ink to-ink" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl font-extrabold sm:text-5xl">Geleceğin ofisini bugün kurun.</h2>
          <p className="mt-6 text-lg text-white/70">
            EmlakFlow'un sunduğu ayrıcalıklı araçlarla tanışmak için kredi kartı gerekmeden ücretsiz denemeye başlayın.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/giris"
              className="group relative flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-bold text-ink transition-transform hover:scale-105 active:scale-95 sm:w-auto"
            >
              Hemen Ücretsiz Başla
              <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/50">14 gün ücretsiz deneme · Kredi kartı gerekmez · İstediğiniz zaman iptal edin</p>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-ink/10 bg-brand-50 py-12 text-center text-sm text-ink/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-ink text-white">
              <Map size={12} strokeWidth={3} />
            </div>
            <span className="font-display font-bold text-ink">EmlakFlow</span>
          </div>
          <p>© {new Date().getFullYear()} EmlakFlow Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
