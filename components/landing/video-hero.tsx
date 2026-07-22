import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Play, Sparkles } from "lucide-react";

/**
 * Video-first hero: solda vaat, sağda "reels telefonu + yatay tur karesi"
 * kompozisyonu. Referans videolar üretilene dek kareler Ken Burns animasyonlu
 * fotoğraf (saf CSS); videoUrl prop'ları verildiğinde aynı yuvaya <video>
 * oturur — tasarım değişmez.
 */

// Prestij Gayrimenkul vitrin setlerinden kapaklar (seed ile aynı kaynak)
const LANDSCAPE_POSTER =
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80";
const PORTRAIT_POSTER =
  "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=900&q=80";

type Props = {
  /** 16:9 referans tur videosu (mp4) — üretilince bağlanır */
  landscapeVideoUrl?: string;
  /** 9:16 reels videosu (mp4) — üretilince bağlanır */
  portraitVideoUrl?: string;
};

function Slot({
  videoUrl,
  poster,
  alt,
  sizes,
  kenburnsClass = "landing-kenburns",
}: {
  videoUrl?: string;
  poster: string;
  alt: string;
  sizes: string;
  kenburnsClass?: string;
}) {
  if (videoUrl) {
    return (
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={videoUrl}
        poster={poster}
        muted
        loop
        playsInline
        autoPlay
      />
    );
  }
  return (
    <Image
      src={poster}
      alt={alt}
      fill
      priority
      sizes={sizes}
      className={`object-cover ${kenburnsClass}`}
    />
  );
}

export function VideoHero({ landscapeVideoUrl, portraitVideoUrl }: Props) {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div className="landing-hero-grid-dark absolute inset-0" aria-hidden />
      <div className="landing-glow-orb landing-glow-orb-a absolute -left-24 top-24 h-96 w-96 opacity-30" aria-hidden />
      <div className="landing-glow-orb landing-glow-orb-b absolute -right-16 bottom-8 h-80 w-80 opacity-25" aria-hidden />

      <div className="relative mx-auto grid min-h-[92vh] max-w-6xl items-center gap-14 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pt-36">
        {/* ── Vaat ── */}
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-100">
            <Sparkles size={13} />
            AI Stüdyo · Emlak ofisleri için
          </p>
          <h1 className="mt-6 font-display text-[clamp(2.6rem,6.5vw,4.9rem)] font-extrabold leading-[1.02] tracking-tight">
            İlanının filmini
            <br />
            <span className="bg-gradient-to-r from-brand-100 via-white to-brand-100 bg-clip-text text-transparent">
              2 dakikada çek.
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/65">
            7 fotoğraf yükle — yapay zekâ odadan odaya süzülen ev turunu çeksin;
            seslendirme, müzik, altyazı ve fiyat kartıyla kurgulansın. Sen
            sadece paylaş.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand-600 px-7 py-3.5 text-base font-bold text-white shadow-[0_8px_28px_-6px_rgba(30,91,62,0.6)] transition-all hover:bg-brand-500"
            >
              Ücretsiz başla
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#sablonlar"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/20 px-7 py-3.5 text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              <Play size={16} className="fill-current" />
              Örnek videoları izle
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/55">
            {["CRM'i 20 ilana kadar ücretsiz", "Kredi kartı gerekmez", "Video ₺400'den başlar"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check size={14} className="text-brand-100" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Video sahnesi: eğik 16:9 tur karesi + önde 9:16 reels telefonu ── */}
        <div className="relative mx-auto w-full max-w-[440px]" aria-hidden>
          <div className="relative aspect-[4/4.6]">
            {/* Yatay tur karesi */}
            <div className="absolute -left-[8%] top-[7%] w-[104%] -rotate-6 overflow-hidden rounded-2xl border border-white/12 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)]">
              <div className="relative aspect-video">
                <Slot
                  videoUrl={landscapeVideoUrl}
                  poster={LANDSCAPE_POSTER}
                  alt="Havuzlu modern villa tanıtım videosu karesi"
                  sizes="(max-width: 1024px) 90vw, 460px"
                  kenburnsClass="landing-kenburns landing-kenburns-slow"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                {/* Fiyat kartı overlay'i — Shotstack bannerBottom stilinin minyatürü */}
                <div className="absolute bottom-3 left-3 rounded-lg bg-[#0e7490]/85 px-3 py-1.5 text-[12px] font-bold text-white">
                  ₺85.000.000
                </div>
                <div className="absolute bottom-3 right-3 rounded bg-black/55 px-2 py-1 font-mono text-[10px] text-white/85">
                  Zekeriyaköy · Sarıyer
                </div>
              </div>
            </div>

            {/* Reels telefonu */}
            <div className="absolute bottom-0 right-0 w-[52%] overflow-hidden rounded-[1.9rem] border-[5px] border-black/80 shadow-[0_32px_70px_-18px_rgba(0,0,0,0.85)] ring-1 ring-white/15">
              <div className="relative aspect-[9/16]">
                <Slot
                  videoUrl={portraitVideoUrl}
                  poster={PORTRAIT_POSTER}
                  alt="Dikey sosyal medya tanıtım videosu karesi"
                  sizes="(max-width: 1024px) 45vw, 230px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/25" />
                {/* Reels ilerleme çubuğu */}
                <div className="absolute inset-x-2.5 top-2 h-0.5 overflow-hidden rounded-full bg-white/25">
                  <div className="landing-reel-progress h-full w-full bg-white" />
                </div>
                {/* Hook kartı — Shotstack hook stilinin minyatürü */}
                <div className="absolute left-1/2 top-[22%] -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#dc2626]/90 px-2.5 py-1 text-[11px] font-extrabold text-white">
                  Bu fiyata İstanbul&apos;da?
                </div>
                {/* Altyazı bandı */}
                <div className="absolute inset-x-2 bottom-[14%] text-center font-display text-[12px] font-extrabold uppercase leading-tight text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.9)]">
                  Cihangir&apos;de tasarım 2+1
                </div>
                <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 rounded-full bg-white/92 px-2.5 py-0.5 text-[10px] font-bold text-ink">
                  ₺14.500.000
                </div>
              </div>
            </div>

            {/* Yüzen özellik rozeti */}
            <div className="landing-float-b absolute -left-2 bottom-[16%] rounded-xl border border-white/12 bg-ink/85 px-3.5 py-2.5 shadow-xl backdrop-blur">
              <p className="font-mono text-[9px] uppercase tracking-wider text-brand-100">10 sn · otomatik kurgu</p>
              <p className="mt-0.5 text-[11px] font-semibold text-white">
                Seslendirme + müzik + altyazı
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
