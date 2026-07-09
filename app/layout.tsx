import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Schibsted_Grotesk,
  Spline_Sans_Mono,
} from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getBaseUrl } from "@/lib/url";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
});
const sans = Schibsted_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});
const mono = Spline_Sans_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e5b3e" },
    { media: "(prefers-color-scheme: dark)", color: "#1e5b3e" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const BASE_URL = getBaseUrl();

export const metadata: Metadata = {
  // Göreli OG/canonical URL'leri mutlak URL'ye çevirir (vitrin sayfaları dahil)
  metadataBase: new URL(BASE_URL),
  title: {
    default: "EmlakFlow — İlan sizden, gerisi EmlakFlow'dan",
    // Alt sayfalar yalnızca kendi başlığını verir; marka eki buradan gelir
    template: "%s | EmlakFlow",
  },
  description:
    "Harita vitrini, akıllı eşleştirme, kanban satış hattı ve otomatik kazanç paylaşımı — modern emlak ofisinin tek paneli.",
  applicationName: "EmlakFlow",
  keywords: [
    "emlak yazılımı",
    "emlak CRM",
    "portföy yönetim programı",
    "emlak ofisi yazılımı",
    "gayrimenkul danışmanı CRM",
  ],
  // PWA / iOS Ana Ekrana Ekle
  appleWebApp: {
    capable: true,
    title: "EmlakFlow",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "EmlakFlow",
    url: BASE_URL,
    title: "EmlakFlow — İlan sizden, gerisi EmlakFlow'dan",
    description:
      "Harita vitrini, akıllı eşleştirme, kanban satış hattı ve otomatik kazanç paylaşımı — modern emlak ofisinin tek paneli.",
  },
  twitter: {
    card: "summary_large_image",
    title: "EmlakFlow — Modern emlak ofisinin tek paneli",
    description:
      "Portföy, müşteri ve satış hattını tek yerden yönetin; vitrin sitenizi dakikalar içinde yayınlayın.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="tr"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="font-sans antialiased">
        {children}
        <PwaInstallPrompt />
        {/* Gerçek kullanıcı Core Web Vitals — yalnızca Vercel'de aktif, dev'de no-op */}
        <SpeedInsights />
      </body>
    </html>
  );
}
