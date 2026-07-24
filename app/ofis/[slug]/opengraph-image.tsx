import { ImageResponse } from "next/og";
import { isPremium } from "@/lib/plans-config";
import { prisma } from "@/lib/prisma";
import { isAutoVertical } from "@/lib/verticals";

/**
 * Ofis vitrini OG kartı — WhatsApp/Instagram paylaşımlarında rastgele bir
 * ilan fotoğrafı yerine ofisin markalı kartı görünür. Dosya-tabanlı metadata
 * aynı segmentteki generateMetadata görsellerine baskındır; ilan detayları
 * ([id] segmenti) kendi kapak fotoğrafını kullanmaya devam eder.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Ofis vitrini — güncel satılık ve kiralık portföy";

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      name: true,
      brandName: true,
      city: true,
      district: true,
      brandColor: true,
      primaryColor: true,
      plan: true,
      vertical: true,
      _count: { select: { listings: { where: { status: "ACTIVE" } } } },
    },
  });

  const brand = tenant?.primaryColor || tenant?.brandColor || "#1e5b3e";
  const name = tenant?.brandName?.trim() || tenant?.name || "Vitrin";
  const yer = [tenant?.district, tenant?.city].filter(Boolean).join(" · ");
  const count = tenant?._count.listings ?? 0;
  const isAuto = isAutoVertical(tenant?.vertical ?? null);
  const portfoyLabel = isAuto ? "Araç Portföyü" : "Satılık & Kiralık Portföy";
  const hidePlatform = isPremium(tenant?.plan);

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
          background: `linear-gradient(135deg, #101210 0%, ${brand} 130%)`,
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            opacity: 0.75,
          }}
        >
          {yer || portfoyLabel}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: name.length > 18 ? 72 : 96,
              fontWeight: 800,
              lineHeight: 1.1,
              display: "flex",
            }}
          >
            {name}
          </div>
          <div style={{ fontSize: 38, opacity: 0.9, display: "flex" }}>
            {portfoyLabel}
            {count > 0 ? ` — ${count} güncel ilan` : ""}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            opacity: 0.7,
          }}
        >
          <div style={{ display: "flex" }}>
            {hidePlatform ? name : "emlakflow.app vitrini"}
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 24px",
              borderRadius: 999,
              border: "2px solid rgba(255,255,255,0.35)",
            }}
          >
            Portföyü İncele →
          </div>
        </div>
      </div>
    ),
    size,
  );
}
