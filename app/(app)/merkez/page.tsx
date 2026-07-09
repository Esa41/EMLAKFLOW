import { getSession } from "@/lib/auth";
import { canViewTeamActivity } from "@/lib/permissions";
import { MerkezHub } from "@/components/merkez-hub";

export const metadata = {
  title: "Bildirimler & Faaliyet",
};

export default async function MerkezPage() {
  const session = (await getSession())!;
  const canViewTeam = canViewTeamActivity(session.role);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <MerkezHub canViewTeam={canViewTeam} />
    </div>
  );
}
