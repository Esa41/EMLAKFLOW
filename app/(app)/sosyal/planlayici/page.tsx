import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { PlannerPanel } from "@/components/social/planner-panel";
import { listStudioVideosForSocial } from "@/lib/social-os/studio-media";

export default async function PlanlayiciPage({
  searchParams,
}: {
  searchParams: Promise<{
    focus?: string;
    listingId?: string;
    pack?: string;
    studioProjectId?: string;
  }>;
}) {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);
  const sp = await searchParams;

  const [listings, assets, studioVideos] = await Promise.all([
    db.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        refCode: true,
        title: true,
        purpose: true,
        type: true,
        price: true,
      },
      take: 100,
    }),
    db.contentAsset.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        listing: { select: { refCode: true, title: true } },
      },
    }),
    listStudioVideosForSocial(session.tenantId, {
      listingId: sp.listingId,
      take: 30,
    }),
  ]);

  // Deep link: studioProjectId varsa tüm videoları çek (listing filtresiz)
  const videos =
    sp.studioProjectId && !studioVideos.some((v) => v.id === sp.studioProjectId)
      ? await listStudioVideosForSocial(session.tenantId, { take: 40 })
      : studioVideos;

  let ordered = assets;
  if (sp.focus) {
    const idx = assets.findIndex((a) => a.id === sp.focus);
    if (idx > 0) {
      ordered = [assets[idx], ...assets.filter((_, i) => i !== idx)];
    }
  }

  let initialListingId = sp.listingId ?? null;
  if (!initialListingId && sp.studioProjectId) {
    const hit = videos.find(
      (v) => v.kind === "project" && v.id === sp.studioProjectId,
    );
    if (hit) initialListingId = hit.listingId;
  }

  return (
    <PlannerPanel
      listings={listings.map((l) => ({
        id: l.id,
        refCode: l.refCode,
        title: l.title,
        purpose: l.purpose,
        type: l.type,
        price: Number(l.price),
      }))}
      studioVideos={videos}
      initialListingId={initialListingId}
      initialPackId={sp.pack ?? null}
      initialAssets={ordered.map((a) => ({
        id: a.id,
        headline: a.headline,
        caption: a.caption,
        cta: a.cta,
        format: a.format,
        tone: a.tone,
        status: a.status,
        hashtags: a.hashtags,
        mediaUrls: a.mediaUrls,
        listing: a.listing,
        postingRec: a.postingRec,
        createdAt: a.createdAt.toISOString(),
      }))}
    />
  );
}
