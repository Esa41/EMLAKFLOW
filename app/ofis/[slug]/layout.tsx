import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LiveChatWidget } from "@/components/live-chat-widget";

export default async function ShowcaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, name: true, phone: true, city: true, district: true, showcaseEnabled: true },
  });
  if (!tenant || !tenant.showcaseEnabled) notFound();

  return (
    <div className="min-h-screen">
      {/* Antet — müşteri yüzü */}
      <header className="sticky top-0 z-30 border-b border-ink bg-paper">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Link href={`/ofis/${slug}`} className="min-w-0">
            <p className="truncate font-display text-lg font-extrabold tracking-tight">
              {tenant.name}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/45">
              {[tenant.district, tenant.city].filter(Boolean).join(" · ") || "Gayrimenkul"}
            </p>
          </Link>
          {tenant.phone && (
            <a
              href={`tel:${tenant.phone.replace(/\s/g, "")}`}
              className="btn-selvi ml-auto flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
            >
              <Phone size={15} /> Ara
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>

      <footer className="border-t border-ink/15 py-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
          {tenant.name} · Vitrin <span className="text-brand-600">EmlakFlow</span> ile hazırlandı
        </p>
      </footer>
      
      <LiveChatWidget tenantId={tenant.id} />
    </div>
  );
}
