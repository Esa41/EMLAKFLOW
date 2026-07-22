import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { SocialContentPanel } from "@/components/social-content-panel";
import { getVertical } from "@/lib/verticals";

export default async function TakipPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);
  const sp = await searchParams;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { vertical: true },
  });
  const v = getVertical(tenant?.vertical);

  const [posts, listings, accounts] = await Promise.all([
    db.socialPost.findMany({
      orderBy: { publishedAt: "desc" },
      include: {
        listing: { select: { id: true, refCode: true, title: true } },
      },
    }),
    db.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: { id: true, refCode: true, title: true },
    }),
    db.socialAccount.findMany({
      select: { id: true, platform: true, username: true },
    }),
  ]);

  const rows = posts.map((p) => ({
    id: p.id,
    platform: p.platform,
    url: p.url,
    kind: p.kind,
    caption: p.caption,
    views: p.views,
    likes: p.likes,
    comments: p.comments,
    reach: p.reach,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    listing: p.listing,
  }));

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink/55">
        {v.labels.social} — bağlı hesaplar, manuel ekleme ve performans.
      </p>
      <SocialContentPanel
        initialPosts={rows}
        listings={listings}
        accounts={accounts}
        connected={sp.connected === "1"}
        error={sp.error ?? null}
      />
    </div>
  );
}
