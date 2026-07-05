import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { NotificationBell } from "@/components/notification-bell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { slug: true, showcaseEnabled: true },
  });
  const showcaseSlug = tenant?.showcaseEnabled ? tenant.slug : null;

  const today = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="min-h-screen">
      <Sidebar tenantName={session.tenantName} userName={session.name} showcaseSlug={showcaseSlug} />
      <div className="lg:pl-64">
        {/* Antet — başlık bloğu */}
        <header className="sticky top-0 z-30 border-b border-ink bg-paper">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-8">
            <MobileNav tenantName={session.tenantName} userName={session.name} showcaseSlug={showcaseSlug} />
            <div className="lg:hidden">
              <p className="font-display text-lg font-extrabold tracking-tight">
                Emlak<span className="text-brand-600">Flow</span>
              </p>
            </div>
            <input
              type="search"
              placeholder="İlan, müşteri veya künye ara…"
              className="hidden w-72 rounded-lg border border-ink/20 bg-white px-4 py-2 text-sm outline-none placeholder:text-ink/35 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/25 sm:block"
            />
            <div className="ml-auto flex items-center gap-3">
              <NotificationBell />
              <div className="hidden text-right font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-ink/45 sm:block">
                {session.tenantName}
                <br />
                {today} · Günlük
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
