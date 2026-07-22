import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { PlannerPanel } from "@/components/social/planner-panel";

export default async function PlanlayiciPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);
  const sp = await searchParams;

  const [listings, assets] = await Promise.all([
    db.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: { id: true, refCode: true, title: true },
      take: 100,
    }),
    db.contentAsset.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        listing: { select: { refCode: true, title: true } },
      },
    }),
  ]);

  let ordered = assets;
  if (sp.focus) {
    const idx = assets.findIndex((a) => a.id === sp.focus);
    if (idx > 0) {
      ordered = [assets[idx], ...assets.filter((_, i) => i !== idx)];
    }
  }

  return (
    <PlannerPanel
      listings={listings}
      initialAssets={ordered.map((a) => ({
        id: a.id,
        headline: a.headline,
        caption: a.caption,
        cta: a.cta,
        format: a.format,
        tone: a.tone,
        status: a.status,
        hashtags: a.hashtags,
        listing: a.listing,
        postingRec: a.postingRec,
        createdAt: a.createdAt.toISOString(),
      }))}
    />
  );
}
