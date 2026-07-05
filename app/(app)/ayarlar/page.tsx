import { randomBytes } from "crypto";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const session = (await getSession())!;

  let tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
  });
  if (!tenant) return null;

  // Feed token yoksa üret
  if (!tenant.feedToken) {
    tenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: { feedToken: randomBytes(24).toString("hex") },
    });
  }

  const appUrl = process.env.AUTH_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[27px] font-extrabold tracking-tight">Ayarlar</h1>
        <p className="mt-1 text-sm text-ink/55">
          Ofis profili, komisyon oranları ve portal yayın ayarları.
        </p>
      </div>
      <SettingsForm
        isOwner={session.role === "OWNER"}
        appUrl={appUrl}
        initial={{
          name: tenant.name,
          phone: tenant.phone ?? "",
          city: tenant.city ?? "",
          district: tenant.district ?? "",
          plan: tenant.plan,
          commissionRate: String(tenant.commissionRate),
          agentSharePct: String(tenant.agentSharePct),
          portalSahibinden: tenant.portalSahibinden,
          portalHepsiemlak: tenant.portalHepsiemlak,
          portalEmlakjet: tenant.portalEmlakjet,
          feedToken: tenant.feedToken!,
          slug: tenant.slug,
          showcaseEnabled: tenant.showcaseEnabled,
          showcaseTagline: tenant.showcaseTagline ?? "",
          whatsapp: tenant.whatsapp ?? "",
          aboutTitle: tenant.aboutTitle ?? "",
          aboutText: tenant.aboutText ?? "",
          visionText: tenant.visionText ?? "",
          aboutStats:
            Array.isArray(tenant.aboutStats) && tenant.aboutStats.length
              ? (tenant.aboutStats as Array<{ value: string; label: string }>)
              : [
                  { value: "", label: "" },
                  { value: "", label: "" },
                  { value: "", label: "" },
                ],
          showTeam: tenant.showTeam,
        }}
      />
    </div>
  );
}
