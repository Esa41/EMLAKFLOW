import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/plans";

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
      `${PLANS.free.listingLimit} ilan hakkı`,
      "1 kullanıcı",
      "Portföy ve kişi yönetimi",
      "Fırsat panosu (kanban)",
      "Harita vitrini (EmlakFlow rozetli)",
      "Vitrin talep formu",
    ],
  },
  {
    key: "pro",
    name: PLANS.pro.name,
    tagline: PLANS.pro.tagline,
    cta: "Pro'ya geç",
    href: "/register",
    highlight: true,
    priceLabel: `₺${tl.format(PLANS.pro.monthlyTRY)}`,
    priceSuffix: "/ ay · ofis başına",
    yearlyNote: `Yıllık ödemede ₺${tl.format(PLANS.pro.yearlyTRY)}/yıl — 2 ay hediye`,
    features: [
      "Sınırsız ilan",
      "Sınırsız kullanıcı — tüm ekibine hesap aç",
      "Alıcı–portföy akıllı eşleştirme",
      "AI ilan metni, SEO ve fiyat danışmanı",
      "Haftalık mülk sahibi raporu (WhatsApp/PDF)",
      "Vitrin dönüşüm analitiği",
      "Ajanda, görev ve yer gösterme takibi",
      "Ekip sohbeti + vitrin canlı sohbet",
      "Kira takibi ve otomatik hatırlatmalar",
      "Sözleşme üretimi + danışman kazanç paylaşımı",
    ],
  },
  {
    key: "enterprise",
    name: "Premium",
    tagline: "Kendi markanız, kendi alan adınız",
    cta: "Demo randevusu al",
    href: ENTERPRISE_CTA,
    highlight: false,
    enterprise: true,
    priceLabel: "İletişime Geç",
    priceSuffix: null as string | null,
    yearlyNote: "Özel fiyatlandırma · white-label dahil",
    features: [
      "Pro’daki tüm özellikler dahil",
      "Rozetsiz vitrin + kendi logon ve marka rengin",
      "Kendi alan adınız (custom domain)",
      "Panel ve vitrinde EmlakFlow gizlenir",
      "Ücretsiz kurulum hizmeti",
      "Öncelikli destek",
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
            Ofisinize uygun paket. Markanıza özel çözüm.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink/60">
            Danışman başına ücret yok. Premium’da kendi alan adınız ve
            panelde EmlakFlow’suz white-label markalama.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
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

        <p className="mt-8 text-center text-[12px] text-ink/45">
          Fiyatlara KDV dahil değildir. Kredi kartı olmadan kayıt olun,
          dilediğiniz zaman yükseltin — kurulum ücreti ve taahhüt yok.
          Kurumsal white-label kurulumu ekibimiz tarafından yapılır.
        </p>
      </div>
    </section>
  );
}
