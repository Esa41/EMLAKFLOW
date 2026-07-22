import type { Metadata } from "next";
import { LandingContent, type DemoListing } from "@/components/landing/landing-content";
import { getBaseUrl } from "@/lib/url";
import { prisma } from "@/lib/prisma";
import { PLANS, FREE_LISTING_LIMIT, CREDIT_TOPUP_PACKS } from "@/lib/plans";

/** Landing statik içerik — CDN cache (FCP için HTML TTFB düşer). */
export const revalidate = 3600;

const BASE_URL = getBaseUrl();

// SEO: ana sayfa emlakçıya net kelimelerle konuşur (web sitesi + ilan/müşteri takibi).
export const metadata: Metadata = {
  title: {
    absolute: "Ücretsiz Emlak Web Sitesi + İlan ve Müşteri Takip Programı | EmlakFlow",
  },
  description:
    "Emlakçıya özel ücretsiz web sitesi: ilanlarınızı ekleyin, sitenizi paylaşın; gelen talepleri, kiraları ve randevuları tek panelden takip edin. 5 ilana kadar ücretsiz, kredi kartı yok.",
  keywords: [
    "emlak web sitesi",
    "ücretsiz emlak sitesi",
    "emlakçı programı",
    "emlak ilan takip programı",
    "emlak müşteri takibi",
    "emlakçı web sitesi",
    "emlak ofisi yazılımı",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Emlakçının dijital ofisi — ücretsiz web sitesi + iş takibi",
    description:
      "İlanların, müşterilerin ve web siten tek yerde. 5 ilana kadar ücretsiz, kredi kartı yok.",
    url: BASE_URL,
    type: "website",
  },
};

// schema.org SoftwareApplication — Google'da yazılım zengin sonucu için.
// Fiyatlar lib/plans.ts'ten türetilir; elle senkron gerekmez.
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
    "Emlakçılar için ücretsiz web sitesi, ilan ve portföy yönetimi, müşteri/talep takibi, kira takibi ve harita vitrini sunan platform. İsteğe bağlı AI tanıtım videosu jetonla.",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: String(PLANS.premium.yearlyTRY),
    priceCurrency: "TRY",
    offerCount: Object.keys(PLANS).length,
    description: `CRM ${FREE_LISTING_LIMIT} ilana kadar ücretsiz; AI tanıtım videosu ₺${CREDIT_TOPUP_PACKS[0].priceTRY}'den başlayan krediyle. Premium'da ayda 10 video dahil.`,
  },
  publisher: { "@type": "Organization", name: "EmlakFlow", url: BASE_URL },
};

const tlMoney = new Intl.NumberFormat("tr-TR");

/** Landing önizlemeleri için gerçek demo ofisi (Prestij) ilanları — gerçekçilik için. */
async function getDemoListings(): Promise<{ office: string; listings: DemoListing[] }> {
  try {
    const t = await prisma.tenant.findFirst({
      where: { slug: "prestij-gayrimenkul" },
      select: { id: true, name: true },
    });
    if (!t) return { office: "", listings: [] };
    const rows = await prisma.listing.findMany({
      where: { tenantId: t.id, status: "ACTIVE", media: { some: {} } },
      take: 6,
      orderBy: { updatedAt: "desc" },
      select: {
        title: true,
        price: true,
        rooms: true,
        netArea: true,
        grossArea: true,
        district: true,
        purpose: true,
        media: { take: 1, orderBy: { order: "asc" }, select: { url: true, thumbUrl: true } },
      },
    });
    const listings: DemoListing[] = rows.map((l) => {
      const area = l.netArea ?? l.grossArea;
      const raw = l.media[0]?.thumbUrl || l.media[0]?.url || "";
      return {
        title: l.title,
        price: `${tlMoney.format(Number(l.price))} ₺${l.purpose === "RENT" ? "/ay" : ""}`,
        meta: [area ? `${area} m²` : null, l.rooms].filter(Boolean).join(" · ") || "Arsa",
        district: l.district,
        tag: l.purpose === "RENT" ? "Kiralık" : "Satılık",
        img: raw.replace(/([?&])w=\d+/, "$1w=560"),
      };
    });
    return { office: t.name, listings };
  } catch {
    return { office: "", listings: [] };
  }
}

export default async function LandingPage() {
  const demo = await getDemoListings();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <LandingContent demoOffice={demo.office} demoListings={demo.listings} />
    </>
  );
}
