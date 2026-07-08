import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchMediaInsights } from "@/lib/social";

export const maxDuration = 120;

/** Gecelik sosyal metrik senkronu */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.socialAccount.findMany({
    where: { platform: "INSTAGRAM" },
    include: { posts: { where: { externalId: { not: null } } } },
  });

  let synced = 0;

  for (const acc of accounts) {
    for (const post of acc.posts) {
      if (!post.externalId) continue;
      try {
        const m = await fetchMediaInsights(post.externalId, acc.accessToken);
        await prisma.socialPost.update({
          where: { id: post.id },
          data: {
            views: m.views,
            likes: m.likes,
            comments: m.comments,
            shares: m.shares,
            reach: m.reach,
            lastSyncedAt: new Date(),
          },
        });
        await prisma.socialPostMetric.create({
          data: {
            postId: post.id,
            views: m.views,
            likes: m.likes,
            comments: m.comments,
            shares: m.shares,
            reach: m.reach,
          },
        });
        synced++;
      } catch {
        /* tek post hatası diğerlerini durdurmasın */
      }
    }
    await prisma.socialAccount.update({
      where: { id: acc.id },
      data: { lastSyncedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true, synced });
}
