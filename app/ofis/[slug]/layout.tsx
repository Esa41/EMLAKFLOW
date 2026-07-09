import { notFound, headers } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LiveChatWidget } from "@/components/live-chat-widget";
import { SiteAuthHeader } from "@/components/site-auth";
import { SiteSessionProvider } from "@/components/site-session-context";
import { brandPalette } from "@/lib/color";

// Vitrin ofisin markalı sayfasıdır: kök "%s | EmlakFlow" şablonunu nötrle —
// hem beyaz etiket hem de başlığın 60 karakteri aşmaması için.
export const metadata = {
  title: { template: "%s", default: "Vitrin" },
};

export default async function ShowcaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hdrs = await headers();
  const isCustomDomain = hdrs.get("x-showcase-custom-domain") === "1";

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      brandName: true,
      phone: true,
      city: true,
      district: true,
      showcaseEnabled: true,
      brandColor: true,
      primaryColor: true,
      logoUrl: true,
      customDomain: true,
    },
  });
  if (!tenant || !tenant.showcaseEnabled) notFound();

  // Oturum bilgisi bilinçli olarak burada OKUNMAZ: cookie okumak rotayı
  // dynamic yapar ve ilan detayının ISR önbelleğini bozar. Kullanıcı durumu
  // SiteSessionProvider'ın client fetch'iyle gelir.
  const palette = brandPalette(tenant.primaryColor || tenant.brandColor);
  const displayName = tenant.brandName?.trim() || tenant.name;
  const homeHref = isCustomDomain ? "/" : `/ofis/${slug}`;
  const whiteLabel = Boolean(tenant.customDomain || tenant.brandName);

  return (
    <SiteSessionProvider slug={slug}>
    <div className="min-h-screen" style={palette as React.CSSProperties}>
      {/* Antet — müşteri yüzü */}
      <header className="sticky top-0 z-30 border-b border-ink bg-paper">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Link href={homeHref} className="flex min-w-0 items-center gap-2.5">
            {tenant.logoUrl ? (
              <Image
                src={tenant.logoUrl}
                alt={displayName}
                width={36}
                height={36}
                className="shrink-0 rounded-lg object-contain"
              />
            ) : null}
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-extrabold tracking-tight">
                {displayName}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/45">
                {[tenant.district, tenant.city].filter(Boolean).join(" · ") || "Gayrimenkul"}
              </p>
            </div>
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <SiteAuthHeader slug={slug} />
            {tenant.phone && (
              <a
                href={`tel:${tenant.phone.replace(/\s/g, "")}`}
                className="btn-selvi hidden items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700 sm:flex"
              >
                <Phone size={15} /> Ara
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 md:pb-8">{children}</main>

      {/* Mobil sticky CTA bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/20 bg-paper/95 p-3 backdrop-blur-sm md:hidden">
        <div className="mx-auto flex max-w-5xl gap-2">
          {tenant.phone && (
            <a
              href={`tel:${tenant.phone.replace(/\s/g, "")}`}
              className="btn-selvi flex-1 rounded-lg py-3 text-center text-sm font-bold text-white"
            >
              📞 Hemen Ara
            </a>
          )}
          <a
            href="#talep-form"
            className="flex-1 rounded-lg border border-ink/20 bg-white py-3 text-center text-sm font-bold text-ink transition-colors hover:border-ink/50"
          >
            💬 Talep Bırak
          </a>
        </div>
      </div>

      <footer className="border-t border-ink/15 py-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
          {displayName}
          {!whiteLabel && (
            <>
              {" "}
              · Vitrin <span className="text-brand-600">EmlakFlow</span> ile
              hazırlandı
            </>
          )}
        </p>
      </footer>
      
      <LiveChatWidget tenantId={tenant.id} />
    </div>
    </SiteSessionProvider>
  );
}
