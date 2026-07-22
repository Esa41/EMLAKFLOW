import Image from "next/image";
import { ArrowRight, Captions, Mic, Music, Play, Wallet } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

/**
 * Önce/Sonra şeridi: 7 ham ilan fotoğrafı → kurgulanmış tanıtım videosu.
 * Fotoğraflar Prestij Gayrimenkul "Maslak 3+1" vitrin setinden (seed ile aynı).
 */

const U = (id: string, w = 400) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

const RAW_PHOTOS = [
  "1600607687939-ce8a6c25118c",
  "1600607687920-4e2a09cf159d",
  "1600607687644-c7171b42498f",
  "1600585152220-90363fe7e115",
  "1600566752355-35792bedcfea",
  "1600566753086-00f18fb6b3ea",
  "1595526114035-0d45ed16cfbf",
];

const RESULT_FEATURES = [
  { icon: Mic, label: "Seslendirme" },
  { icon: Music, label: "Müzik" },
  { icon: Captions, label: "Altyazı" },
  { icon: Wallet, label: "Fiyat kartı" },
];

export function BeforeAfter() {
  return (
    <section className="border-b border-ink/8 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-600">
              Önce / Sonra
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Fotoğrafını yükle.
              <br />
              Gerisini stüdyo halleder.
            </h2>
          </div>
        </ScrollReveal>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1fr_auto_1.15fr] lg:gap-8">
          {/* Ham fotoğraflar */}
          <ScrollReveal from="left">
            <div>
              <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/40">
                Elindeki — 7 telefon fotoğrafı
              </p>
              <div className="grid grid-cols-4 gap-2">
                {RAW_PHOTOS.map((id, i) => (
                  <div
                    key={id}
                    className={`relative aspect-square overflow-hidden rounded-lg border border-ink/10 ${
                      i % 3 === 0 ? "rotate-1" : i % 3 === 1 ? "-rotate-1" : ""
                    }`}
                  >
                    <Image
                      src={U(id)}
                      alt=""
                      fill
                      loading="lazy"
                      sizes="(max-width: 1024px) 22vw, 110px"
                      className="object-cover"
                    />
                  </div>
                ))}
                <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-ink/20 bg-paper font-mono text-[10px] text-ink/40">
                  +yükle
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Dönüşüm oku */}
          <ScrollReveal from="scale" delay={120}>
            <div className="flex items-center justify-center gap-3 lg:flex-col">
              <span className="hidden h-px w-10 bg-ink/15 lg:block" />
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_10px_30px_-8px_rgba(30,91,62,0.55)]">
                <ArrowRight size={22} className="rotate-90 lg:rotate-0" />
              </div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-600 lg:mt-1">
                2 dakika
              </p>
              <span className="hidden h-px w-10 bg-ink/15 lg:block" />
            </div>
          </ScrollReveal>

          {/* Kurgulanmış video */}
          <ScrollReveal from="right" delay={180}>
            <div>
              <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-600">
                Vitrindeki — kurgulanmış tanıtım videosu
              </p>
              <div className="group relative overflow-hidden rounded-2xl border border-ink/12 shadow-[0_32px_70px_-28px_rgba(23,32,28,0.5)]">
                <div className="relative aspect-video">
                  <Image
                    src={U("1600607687939-ce8a6c25118c", 1200)}
                    alt="Maslak 3+1 tanıtım videosu önizlemesi"
                    fill
                    loading="lazy"
                    sizes="(max-width: 1024px) 92vw, 600px"
                    className="landing-kenburns object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  {/* Oynat düğmesi */}
                  <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-2xl transition-transform group-hover:scale-110">
                    <Play size={24} className="ml-1 fill-current" />
                  </div>
                  <span className="absolute right-3 top-3 rounded bg-black/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
                    0:10
                  </span>
                  {/* Kurgu katmanı minyatürleri */}
                  <div className="absolute bottom-3 left-3 rounded-lg bg-[#0e7490]/85 px-3 py-1.5 text-[12px] font-bold text-white">
                    Maslak · Sarıyer
                  </div>
                  <div className="absolute bottom-3 right-3 text-right font-display text-lg font-extrabold text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                    ₺21.500.000
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {RESULT_FEATURES.map((f) => (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/25 bg-brand-50 px-3 py-1.5 text-[12px] font-semibold text-brand-700"
                  >
                    <f.icon size={13} />
                    {f.label}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-paper px-3 py-1.5 text-[12px] font-medium text-ink/60">
                  + ofis logon ve kapanış kartın
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
