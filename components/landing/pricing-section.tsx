import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { PLANS } from "@/lib/plans";

/**
 * Landing fiyatlandırma bölümü — OFİS BAŞINA paket (danışman başına değil).
 * Fiyat/limit kaynağı tek: lib/plans.ts PLANS. Gerekçeler:
 * docs/fiyatlandirma-calismasi.md
 */

const tl = new Intl.NumberFormat("tr-TR");

type CardDef = {
  plan: (typeof PLANS)[keyof typeof PLANS];
  features: string[];
  cta: string;
  highlight?: boolean;
  premium?: boolean;
  featuresIntro?: string;
};

const CARDS: CardDef[] = [
  {
    plan: PLANS.free,
    cta: "Ücretsiz başla",
    features: [
      `${PLANS.free.listingLimit} ilan hakkı`,
      "1 kullanıcı",
      "Portföy ve kişi yönetimi",
      "Fırsat panosu (kanban)",
      "Harita vitrini (EmlakFlow rozetli)",
      "Vitrin talep formu",
    ],
  },
  {
    plan: PLANS.pro,
    cta: "Pro'yu dene",
    highlight: true,
    features: [
      "Sınırsız ilan",
      `${PLANS.pro.userLimit} kullanıcıya kadar ekip`,
      "Rozetsiz vitrin + kendi logon ve marka rengin",
      "Alıcı–portföy akıllı eşleştirme",
      "Ajanda, görev ve yer gösterme takibi",
      "Ekip sohbeti + vitrin canlı sohbet",
      "Kira takibi ve otomatik hatırlatmalar",
      "Sözleşme üretimi",
      "Danışman kazanç paylaşımı",
    ],
  },
  {
    plan: PLANS.premium,
    cta: "Premium'u dene",
    premium: true,
    featuresIntro: "Pro'daki her şey, artı:",
    features: [
      "AI ilan metni ve SEO üretimi",
      "AI fiyat danışmanı (emsal analizi)",
      "Haftalık mülk sahibi raporu (WhatsApp/PDF)",
      "Vitrin dönüşüm analitiği (funnel)",
      "Sosyal medya senkronizasyonu",
      "Çevre ve konum skoru",
      "Sınırsız kullanıcı",
      "Öncelikli destek",
    ],
  },
];

export function PricingSection() {
  return (
    <section id="fiyatlar" className="border-t border-ink/8 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-600">
            Fiyatlandırma
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ofis başına tek fiyat. Danışman başına değil.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink/60">
            Ekibindeki herkese hesap aç, kazanç paylaşımını sistem hesaplasın.
            Kullanıcı başına ücret yok, sürpriz yok.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {CARDS.map(({ plan, features, cta, highlight, premium, featuresIntro }) => (
            <div
              key={plan.key}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                highlight
                  ? "border-brand-600 bg-brand-50/60 shadow-[0_16px_48px_-16px_rgba(30,91,62,0.35)]"
                  : "border-ink/12 bg-paper"
              }`}
            >
              {highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                  En çok tercih edilen
                </span>
              )}
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl font-extrabold tracking-tight">
                  {plan.name}
                </h3>
                {premium && <Sparkles size={16} className="text-brand-600" />}
              </div>
              <p className="mt-1 text-[13px] text-ink/55">{plan.tagline}</p>

              <p className="mt-5 flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-extrabold tracking-tight">
                  {plan.monthlyTRY === 0 ? "₺0" : `₺${tl.format(plan.monthlyTRY)}`}
                </span>
                <span className="text-sm text-ink/50">
                  {plan.monthlyTRY === 0 ? "her zaman" : "/ ay · ofis başına"}
                </span>
              </p>
              {plan.monthlyTRY > 0 && (
                <p className="mt-1 text-[12px] text-ink/45">
                  Yıllık ödemede ₺{tl.format(plan.yearlyTRY)}/yıl — 2 ay hediye
                </p>
              )}

              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {featuresIntro && (
                  <li className="font-semibold text-ink/80">{featuresIntro}</li>
                )}
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-ink/70">
                    <Check size={15} className="mt-0.5 shrink-0 text-brand-600" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`mt-7 rounded-xl py-3 text-center text-sm font-bold transition-colors ${
                  highlight || premium
                    ? "btn-selvi text-white"
                    : "border border-ink/20 bg-white text-ink hover:border-ink/50"
                }`}
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-[12px] text-ink/45">
          Fiyatlara KDV dahil değildir. Kredi kartı olmadan kayıt olun,
          dilediğiniz zaman yükseltin — kurulum ücreti ve taahhüt yok.
        </p>
      </div>
    </section>
  );
}
