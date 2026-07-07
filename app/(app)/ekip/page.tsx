import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { TeamManager, type TeamMember } from "@/components/team-manager";
import { OpenTeamChatButton } from "@/components/open-team-chat-button";

export default async function TeamPage() {
  const session = (await getSession())!;

  const users = await forTenant(session.tenantId).user.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      _count: {
        select: {
          listings: { where: { status: "ACTIVE" } },
          deals: { where: { stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } } },
        },
      },
    },
  });

  return (
    <div className="app-page dash-in space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="app-page-meta">
            {users.filter((u) => u.isActive).length} aktif üye
          </p>
          <h1 className="app-page-title">Ekip Yönetimi</h1>
          <p className="app-page-desc">
            Roller, portföy ve fırsat yükleri — sohbet sağ üstteki mesaj
            simgesinden açılır.
          </p>
        </div>
        <OpenTeamChatButton />
      </div>

      <TeamManager
        initialUsers={users as TeamMember[]}
        isOwner={session.role === "OWNER"}
        currentUserId={session.userId}
      />
    </div>
  );
}
