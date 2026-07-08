import { ImageResponse } from "next/og";

/**
 * Global OG kartı — landing ve kendi og:image'ı olmayan tüm sayfaların
 * sosyal paylaşım görseli. Vitrin ofis sayfalarının markalı kartı ayrı:
 * app/ofis/[slug]/opengraph-image.tsx; ilan detayları kapak fotoğrafını
 * kullanmaya devam eder (generateMetadata openGraph.images).
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "EmlakFlow — modern emlak ofisinin tek paneli";

const BRAND = "#1e5b3e"; // tapu yeşili (globals.css --app-brand-fill)

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: `linear-gradient(135deg, #0d1f16 0%, ${BRAND} 100%)`,
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 5,
              background: "#79c69e",
              display: "flex",
            }}
          />
          B2B Emlak Yönetim Platformu
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 110, fontWeight: 800, display: "flex" }}>
            EmlakFlow
          </div>
          <div
            style={{
              fontSize: 40,
              lineHeight: 1.3,
              opacity: 0.92,
              display: "flex",
            }}
          >
            İlan sizden, gerisi EmlakFlow&apos;dan.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {["Harita Vitrini", "Akıllı Eşleştirme", "CRM + Kazanç Paylaşımı"].map(
            (t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  padding: "12px 26px",
                  borderRadius: 999,
                  border: "2px solid rgba(255,255,255,0.35)",
                  fontSize: 26,
                }}
              >
                {t}
              </div>
            ),
          )}
        </div>
      </div>
    ),
    size,
  );
}
