import Image from "next/image";
import { MonitorPlay, Play, Smartphone } from "lucide-react";
import { TEMPLATES, type TemplateKey } from "@/lib/studio-templates";
import { ScrollReveal } from "./scroll-reveal";

/**
 * Şablon galerisi — referans videoların satış rafı. Şablon tanımları tek
 * kaynaktan (lib/studio-templates.ts) gelir; kapaklar Prestij Gayrimenkul
 * vitrin setleriyle eşleşir. `videoUrl` dolduğunda kapak yerine mp4 önizleme
 * bağlanacak (aynı yuva).
 */

const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=75`;

const PREVIEWS: Record<TemplateKey, { cover: string; videoUrl?: string }> = {
  fpv_tour: { cover: U("1600607687939-ce8a6c25118c") },
  cinematic_fpv: { cover: U("1618221195710-dd6b41faaea6") },
  fpv_reels: { cover: U("1615873968403-89e068629265") },
  luxury_showcase: { cover: U("1613490493576-7fde63acd811") },
  golden_hour: { cover: U("1600585154340-be6161a56a0c") },
  classic_interior: { cover: U("1560448204-e02f11c3d0e2") },
  land_drone: { cover: U("1500382017468-9049fed747ef") },
  social_promo: { cover: U("1505873242700-f289a29e1e0f") },
};

export function TemplateGallery() {
  const templates = Object.values(TEMPLATES);
  return (
    <section id="sablonlar" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <ScrollReveal>
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-600">
              Şablon galerisi
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Sen şablonu seç,
              <br />
              yönetmenlik bizde.
            </h2>
            <p className="mt-4 text-lg text-ink/55">
              Villadan arsaya, ev turundan Instagram reels&apos;e — her ilan
              tipine hazır bir kurgu dili.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {templates.map((t, i) => {
            const preview = PREVIEWS[t.key];
            const portrait = t.aspectRatio === "9:16";
            return (
              <ScrollReveal key={t.key} delay={(i % 4) * 70}>
                <article className="group h-full overflow-hidden rounded-2xl border border-ink/10 bg-white transition-all hover:-translate-y-1 hover:border-brand-500/30 hover:shadow-[0_20px_50px_-18px_rgba(23,32,28,0.3)]">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={preview.cover}
                      alt={`${t.label} şablonu önizlemesi`}
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 280px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    {t.badge && (
                      <span className="absolute left-3 top-3 rounded-full bg-brand-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        {t.badge}
                      </span>
                    )}
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded bg-black/55 px-2 py-0.5 font-mono text-[10px] font-semibold text-white">
                      {portrait ? <Smartphone size={11} /> : <MonitorPlay size={11} />}
                      {t.aspectRatio}
                    </span>
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                      <h3 className="font-display text-lg font-extrabold leading-tight text-white">
                        {t.label}
                      </h3>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-ink opacity-90 transition-all group-hover:scale-110 group-hover:opacity-100">
                        <Play size={15} className="ml-0.5 fill-current" />
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[13px] leading-relaxed text-ink/55">{t.subtitle}</p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-ink/40">
                      {t.targetListingTypes === "land"
                        ? "Arsa · tarla için önerilir"
                        : t.targetListingTypes === "housing"
                          ? "Konut ilanları için"
                          : "Her ilan tipine uygun"}
                    </p>
                  </div>
                </article>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal delay={150}>
          <p className="mt-10 text-center text-sm text-ink/45">
            Örnek videolar bu rafta yayınlanacak — her şablonun gerçek çıktısını
            izleyip aynısını kendi ilanın için üretebileceksin.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
