import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { NotificationBell } from "@/components/notification-bell";
import { BrandLogo } from "@/components/brand-logo";
import { TeamChatProvider } from "@/components/team-chat-context";
import { TeamChatTrigger } from "@/components/team-chat-trigger";
import { TeamChatDrawer } from "@/components/team-chat-drawer";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeScript } from "@/components/theme-script";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { slug: true, showcaseEnabled: true, vertical: true },
  });
  const showcaseSlug = tenant?.showcaseEnabled ? tenant.slug : null;
  const vertical = tenant?.vertical ?? session.vertical ?? "REAL_ESTATE";

  const today = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <ThemeProvider>
      <ThemeScript />
      <TeamChatProvider>
        <div className="app-shell">
          <Sidebar
            tenantName={session.tenantName}
            userName={session.name}
            showcaseSlug={showcaseSlug}
            vertical={vertical}
          />
          <div className="lg:pl-[260px]">
            <header className="sticky top-0 z-30 border-b border-ink/[0.06] bg-[var(--app-header-bg)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/[0.07]">
              <div className="flex h-[52px] items-center gap-3 px-4 lg:px-8">
                <MobileNav
                  tenantName={session.tenantName}
                  userName={session.name}
                  showcaseSlug={showcaseSlug}
                  vertical={vertical}
                />
                <div className="lg:hidden">
                  <BrandLogo vertical={vertical} className="text-lg" />
                </div>
                <input
                  type="search"
                  placeholder="İlan, müşteri veya künye ara…"
                  className="hidden w-72 rounded-full border-0 bg-ink/[0.05] px-4 py-2 text-[13px] outline-none placeholder:text-ink/35 focus:bg-ink/[0.07] focus:ring-2 focus:ring-brand-500/20 sm:block dark:bg-white/[0.06] dark:placeholder:text-white/35 dark:focus:bg-white/[0.09]"
                />
                <div className="ml-auto flex items-center gap-2">
                  <ThemeToggle />
                  <TeamChatTrigger />
                  <NotificationBell />
                  <div className="hidden text-right text-[11px] font-medium leading-relaxed text-ink/40 sm:block dark:text-white/40">
                    {session.tenantName}
                    <br />
                    {today}
                  </div>
                </div>
              </div>
            </header>
            <main className="p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
          <TeamChatDrawer
            currentUserId={session.userId}
            currentUserName={session.name}
          />
        </div>
      </TeamChatProvider>
    </ThemeProvider>
  );
}
