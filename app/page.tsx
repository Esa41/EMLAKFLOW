import { LandingContent } from "@/components/landing/landing-content";
import { getBaseUrl } from "@/lib/url";

const BASE_URL = getBaseUrl();

// schema.org SoftwareApplication — Google'da yazılım zengin sonucu için.
// Plan/fiyat yapısı değişirse lib/plans.ts ile birlikte burayı da güncelle.
const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "EmlakFlow",
  url: BASE_URL,
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Real Estate CRM",
  operatingSystem: "Web",
  inLanguage: "tr",
  description:
    "Türkiye'deki emlak ofisleri için portföy yönetimi, CRM, harita vitrini ve otomatik kazanç paylaşımı sunan B2B SaaS platformu.",
  // Paket yapısıyla senkron tut: lib/plans.ts PLANS
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "2990",
    priceCurrency: "TRY",
    offerCount: 3,
    description:
      "Başlangıç ücretsiz; Pro ve Premium paketler ofis başına aylık abonelik",
  },
  publisher: { "@type": "Organization", name: "EmlakFlow", url: BASE_URL },
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <LandingContent />
    </>
  );
}
