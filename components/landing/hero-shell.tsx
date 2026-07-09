import Link from "next/link";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";

/**
 * Sunucu / loading fallback — Mapbox beklemeden FCP için anında boyanır.
 * ScrubHero ile aynı manifesto metni (CLS yok).
 */
export function HeroShell() {
  return (
    <div className="relative h-[100svh] overflow-hidden">
      <div className="absolute inset-0 bg-[#e8ebe4]" aria-hidden>
        <div className="landing-hero-grid absolute inset-0 opacity-60" />
        <div className="fiyat-pin landing-float-a absolute left-[18%] top-[28%] text-[10px]">
          ₺4.2M
        </div>
        <div className="fiyat-pin fiyat-pin-kira landing-float-b absolute right-[22%] top-[42%] text-[10px]">
          ₺28K/ay
        </div>
        <div className="fiyat-pin landing-float-c absolute bottom-[32%] left-[42%] text-[10px]">
          ₺6.5M
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-paper/70 via-transparent to-paper/80" />
        <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-paper via-paper/50 to-transparent lg:w-[70%]" />
      </div>
      <div className="absolute inset-0 flex items-center">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-white/70 px-4 py-1.5 text-sm font-medium text-brand-700 backdrop-blur">
              <Sparkles size={14} className="text-brand-600" />
              Yeni nesil emlak ofisi platformu
            </div>
            <h1 className="mt-6 font-display text-[clamp(2.75rem,7.5vw,5.5rem)] font-extrabold leading-[1.02] tracking-tight">
              İlan sizden,
              <br />
              <span className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 bg-clip-text text-transparent">
                gerisi EmlakFlow&apos;dan.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/65 sm:text-xl">
              Harita vitrini, müşteri takibi, satış hattı ve kazanç — hepsi tek
              akıcı panelde. Kaydırın, ofisinizin nasıl aktığını görün.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand-600 px-7 py-3.5 text-base font-bold text-white shadow-[0_8px_28px_-6px_rgba(30,91,62,0.45)] transition-all hover:bg-brand-700"
              >
                14 gün ücretsiz dene
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/ofis/atlas-gayrimenkul"
                className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-ink/12 bg-white/90 px-7 py-3.5 text-base font-bold text-ink backdrop-blur transition-all hover:bg-white"
              >
                Canlı vitrini gez
                <ChevronRight size={18} />
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink/50">
              Kredi kartı gerekmez · 5 dakikada kurulum
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
