import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { TeamManager, type TeamMember } from "@/components/team-manager";
import { TeamChat } from "@/components/team-chat";

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="font-display text-[27px] font-extrabold tracking-tight">Ekip Yönetimi</h1>
          <p className="mt-1 text-sm text-ink/55">
            {users.filter((u) => u.isActive).length} aktif üye — roller, portföy ve
            fırsat yükleri.
          </p>
        </div>
        <TeamManager
          initialUsers={users as TeamMember[]}
          isOwner={session.role === "OWNER"}
          currentUserId={session.userId}
        />
      </div>
      <div className="lg:col-span-1">
        <TeamChat currentUserId={session.userId} />
      </div>
    </div>
  );
}
