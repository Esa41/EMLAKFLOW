import { cookies } from "next/headers";
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
import { parseAppTheme, THEME_COOKIE } from "@/lib/theme";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const cookieStore = await cookies();
  const initialTheme = parseAppTheme(cookieStore.get(THEME_COOKIE)?.value);

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
    <ThemeProvider initialTheme={initialTheme}>
      <TeamChatProvider>
        <Sidebar
          tenantName={session.tenantName}
          userName={session.name}
          showcaseSlug={showcaseSlug}
          vertical={vertical}
        />
        <div className="lg:pl-[260px]">
          <header className="sticky top-0 z-30 border-b border-[var(--app-border)] bg-[var(--app-header-bg)] backdrop-blur-2xl backdrop-saturate-150">
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
                className="dash-input hidden w-72 rounded-full sm:block"
              />
              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
                <TeamChatTrigger />
                <NotificationBell />
                <div className="hidden text-right text-[11px] font-medium leading-relaxed text-ink/40 sm:block">
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
      </TeamChatProvider>
    </ThemeProvider>
  );
}
