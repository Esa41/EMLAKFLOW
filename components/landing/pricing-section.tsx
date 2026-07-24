import Link from "next/link";
import { Check } from "lucide-react";
import {
  PLANS,
  STUDIO_ALLOTMENT,
  CREDIT_TOPUP_PACKS,
  CREDITS_PER_VIDEO,
  FREE_LISTING_LIMIT,
} from "@/lib/plans";

const tlFmt = new Intl.NumberFormat("tr-TR");

/**
 * Landing fiyatlandırma — Başlangıç + Pro + Kurumsal (white-label).
 * Fiyat/limit kaynağı: lib/plans.ts PLANS. Kurumsal satış odaklıdır.
 */

const tl = new Intl.NumberFormat("tr-TR");

const ENTERPRISE_CTA =
  process.env.NEXT_PUBLIC_ENTERPRISE_CONTACT_URL ??
  "mailto:hello@emlakflow.app?subject=Kurumsal%20White-Label%20Demo";

const CARDS = [
  {
    key: "free",
    name: PLANS.free.name,
    tagline: PLANS.free.tagline,
    cta: "Ücretsiz başla",
    href: "/register",
    highlight: false,
    priceLabel: "₺0",
    priceSuffix: "her zaman",
    yearlyNote: null as string | null,
    features: [
      `${PLANS.free.listingLimit} ilana kadar ücretsiz`,
      "Sınırsız kullanıcı — tüm ekibin",
      "Portföy, kişi ve fırsat yönetimi",
      "Harita vitrini + talep formu",
      "Ajanda, görev, kira takibi",
      `AI Stüdyo: ayda ${STUDIO_ALLOTMENT.free.image} ücretsiz foto iyileştirme`,
      `AI tanıtım videosu — kredi ile (₺${tl.format(CREDIT_TOPUP_PACKS[0].priceTRY)}'den başlayan)`,
    ],
  },
  {
    key: "pro",
    name: PLANS.pro.name,
    tagline: PLANS.pro.tagline,
    cta: "Pro'ya geç",
    href: "/register",
    highlight: true,
    priceLabel: `₺${tl.format(PLANS.pro.yearlyTRY)}`,
    priceSuffix: "/ yıl · ofis başına",
    yearlyNote: `${FREE_LISTING_LIMIT}+ ilanlı ofisler için — sınırsız portföy`,
    features: [
      "Sınırsız ilan (20+ ilan için gerekli)",
      "Sınırsız kullanıcı — tüm ekibine hesap aç",
      "Alıcı–portföy akıllı eşleştirme",
      "AI ilan metni, SEO ve fiyat danışmanı",
      "Haftalık mülk sahibi raporu (WhatsApp/PDF)",
      "Vitrin dönüşüm analitiği",
      "Ekip sohbeti + vitrin canlı sohbet",
      "Sözleşme üretimi + danışman kazanç paylaşımı",
      `AI Stüdyo: ayda ${STUDIO_ALLOTMENT.pro.image} foto iyileştirme dahil`,
      "AI tanıtım videosu — kredi ile (Pro üye indirimi)",
    ],
  },
  {
    key: "premium",
    name: PLANS.premium.name,
    tagline: PLANS.premium.tagline,
    cta: "Demo randevusu al",
    href: ENTERPRISE_CTA,
    highlight: false,
    enterprise: true,
    priceLabel: `₺${tl.format(PLANS.premium.monthlyTRY)}`,
    priceSuffix: "/ ay",
    yearlyNote: `Yıllık ₺${tl.format(PLANS.premium.yearlyTRY)} — 2 ay hediye`,
    features: [
      `Ayda ${STUDIO_ALLOTMENT.premium.video / CREDITS_PER_VIDEO} AI tanıtım videosu (${tl.format(STUDIO_ALLOTMENT.premium.video)} kredi) dahil — krediyle ₺${tl.format((STUDIO_ALLOTMENT.premium.video / CREDITS_PER_VIDEO) * 12 * CREDIT_TOPUP_PACKS[0].priceTRY)}/yıl değer`,
      "Pro’daki tüm özellikler dahil",
      `AI Stüdyo: ayda ${STUDIO_ALLOTMENT.premium.image} foto iyileştirme dahil`,
      "Rozetsiz vitrin + kendi logon ve marka rengin",
      "Kendi alan adınız (custom domain)",
      "Panel ve vitrinde EmlakFlow gizlenir",
      "Ücretsiz kurulum + öncelikli destek",
      "Çoklu ofis / franchise yapıları",
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
            Videoyu al, CRM&apos;i hediye götür.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink/60">
            Danışman başına ücret yok, kredi kartsız kayıt. Video kredisi
            kullanılana dek durur — ay sonunda sıfırlanmaz.
          </p>
        </div>

        {/* AI Stüdyo video kredisi — satış hiyerarşisinde önce video */}
        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-brand-500/25 bg-brand-50/50 p-7">
          <div className="text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-600">
              AI Stüdyo — Video Kredisi
            </p>
            <h3 className="mt-2 font-display text-xl font-extrabold tracking-tight">
              {CREDITS_PER_VIDEO} kredi = bir ilan tanıtım videosu
            </h3>
            <p className="mt-2 text-[13px] text-ink/55">
              Ücretsiz planda bile video üretin — seslendirme, müzik, altyazı
              ve ofis logosu dahil.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {CREDIT_TOPUP_PACKS.map((pack) => (
              <div
                key={pack.key}
                className="relative rounded-xl border border-ink/12 bg-white p-5 text-center"
              >
                {"badge" in pack && pack.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {pack.badge}
                  </span>
                )}
                <p className="font-display text-2xl font-extrabold tracking-tight">
                  {tlFmt.format(pack.credits)}
                  <span className="ml-1 text-sm font-medium text-ink/50">kredi</span>
                </p>
                <p className="mt-1 text-lg font-bold text-brand-600">
                  ₺{tlFmt.format(pack.priceTRY)}
                </p>
                <p className="mt-0.5 text-[11px] text-ink/45">
                  ≈ {pack.credits / CREDITS_PER_VIDEO} tam video
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-3">
          {CARDS.map((card) => {
            const isEnterprise = "enterprise" in card && card.enterprise;
            return (
              <div
                key={card.key}
                className={`relative flex flex-col rounded-2xl border p-7 ${
                  card.highlight
                    ? "border-brand-600 bg-brand-50/60 shadow-[0_16px_48px_-16px_rgba(30,91,62,0.35)]"
                    : isEnterprise
                      ? "border-ink/20 bg-gradient-to-b from-ink/[0.03] to-paper"
                      : "border-ink/12 bg-paper"
                }`}
              >
                {card.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    Tüm özellikler
                  </span>
                )}
                {isEnterprise && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ink px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    White-label
                  </span>
                )}
                <h3 className="font-display text-xl font-extrabold tracking-tight">
                  {card.name}
                </h3>
                <p className="mt-1 text-[13px] text-ink/55">{card.tagline}</p>

                {isEnterprise ? (
                  <p className="mt-5 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                    {card.priceLabel}
                  </p>
                ) : (
                  <p className="mt-5 flex items-baseline gap-1.5">
                    <span className="font-display text-4xl font-extrabold tracking-tight">
                      {card.priceLabel}
                    </span>
                    {card.priceSuffix && (
                      <span className="text-sm text-ink/50">{card.priceSuffix}</span>
                    )}
                  </p>
                )}
                {card.yearlyNote && (
                  <p className="mt-1 text-[12px] text-ink/45">{card.yearlyNote}</p>
                )}

                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {card.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-ink/70">
                      <Check
                        size={15}
                        className={`mt-0.5 shrink-0 ${
                          isEnterprise ? "text-ink" : "text-brand-600"
                        }`}
                      />
                      <span
                        className={
                          isEnterprise &&
                          (f.includes("Custom Domain") ||
                            f.includes("White-label") ||
                            f.includes("Kurulum") ||
                            f.includes("Öncelikli"))
                            ? "font-semibold text-ink"
                            : undefined
                        }
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={card.href}
                  {...(card.href.startsWith("mailto:") ||
                  card.href.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className={`mt-7 rounded-xl py-3 text-center text-sm font-bold transition-colors ${
                    card.highlight
                      ? "btn-selvi text-white"
                      : isEnterprise
                        ? "bg-ink text-white hover:bg-ink/90"
                        : "border border-ink/20 bg-white text-ink hover:border-ink/50"
                  }`}
                >
                  {card.cta}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Kurumsal — 50+ ilanlı ofisler için hacim katmanı */}
        <div className="mx-auto mt-8 flex max-w-5xl flex-col items-center justify-between gap-5 rounded-2xl border border-ink/15 bg-gradient-to-r from-ink/[0.04] to-paper p-7 sm:flex-row">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl font-extrabold tracking-tight">
                {PLANS.kurumsal.name}
              </h3>
              <span className="rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                50+ ilan
              </span>
            </div>
            <p className="mt-1 text-[13px] text-ink/60">
              Ayda {STUDIO_ALLOTMENT.kurumsal.video / CREDITS_PER_VIDEO} AI
              tanıtım videosu ({tl.format(STUDIO_ALLOTMENT.kurumsal.video)} kredi
              — video başı ₺{tl.format(Math.round(PLANS.kurumsal.monthlyTRY / (STUDIO_ALLOTMENT.kurumsal.video / CREDITS_PER_VIDEO)))}) +
              tüm Premium hakları: sınırsız ilan ve ekip, white-label, öncelikli
              destek.
            </p>
          </div>
          <div className="shrink-0 text-center sm:text-right">
            <p className="font-display text-3xl font-extrabold tracking-tight">
              ₺{tl.format(PLANS.kurumsal.monthlyTRY)}
              <span className="ml-1 text-sm font-medium text-ink/50">/ ay</span>
            </p>
            <p className="mt-0.5 text-[12px] text-ink/45">
              Yıllık ₺{tl.format(PLANS.kurumsal.yearlyTRY)} — 2 ay hediye
            </p>
            <Link
              href={ENTERPRISE_CTA}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-xl bg-ink px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-ink/90"
            >
              Kurumsal görüşme planla
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-[12px] text-ink/45">
          Fiyatlara KDV dahil değildir. Kredi kartı olmadan kayıt olun,
          dilediğiniz zaman yükseltin — kurulum ücreti ve taahhüt yok.
          Kurumsal white-label kurulumu ekibimiz tarafından yapılır.
        </p>
      </div>
    </section>
  );
}
