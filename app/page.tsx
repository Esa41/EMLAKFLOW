import { LandingContent } from "@/components/landing/landing-content";
import { getBaseUrl } from "@/lib/url";

/** Landing statik içerik — CDN cache (FCP için HTML TTFB düşer). */
export const revalidate = 3600;

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
    highPrice: "25000",
    priceCurrency: "TRY",
    offerCount: 2,
    description:
      "CRM 20 ilana kadar ücretsiz; 20+ ilan için Pro yıllık paket. AI tanıtım videosu krediyle.",
  },
  publisher: { "@type": "Organization", name: "EmlakFlow", url: BASE_URL },
};

export default function LandingPage() {
  return (
    <>
      {/* Mapbox DNS/TLS — ScrubHero chunk’tan önce ısınır (FCP’ye dokunmaz) */}
      <link rel="preconnect" href="https://api.mapbox.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://a.tiles.mapbox.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://b.tiles.mapbox.com" crossOrigin="anonymous" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <LandingContent />
    </>
  );
}
