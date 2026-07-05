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
  colorScheme: "only light" as const,
};

export const metadata: Metadata = {
  title: "EmlakFlow — Ofisinizin işletim sistemi",
  description:
    "Türk emlak ofisleri için portföy, satış hattı ve hak ediş yönetimi. ESAPP vertikali.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
