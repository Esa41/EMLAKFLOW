import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Schibsted_Grotesk,
  Spline_Sans_Mono,
} from "next/font/google";
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

export const viewport = {
  colorScheme: "light" as const,
};

export const metadata: Metadata = {
  title: "EmlakFlow — İlan sizden, gerisi EmlakFlow'dan",
  description:
    "Harita vitrini, akıllı eşleştirme, kanban satış hattı ve otomatik kazanç paylaşımı — modern emlak ofisinin tek paneli.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="tr"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
