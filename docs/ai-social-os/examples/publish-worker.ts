/**
 * QStash publish worker sketch (reference — not compiled into the app).
 * Target: app/api/social/publish/route.ts
 *
 * CalendarItem MVP fields: assetId, platform, scheduledAt, status.
 * Account/variant wiring lands with Meta publish adapter.
 */

import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { prisma } from "@/lib/prisma";

type PublishJob = {
  tenantId: string;
  calendarItemId: string;
  attemptId: string;
};

async function handler(req: Request) {
  const job = (await req.json()) as PublishJob;

  const item = await prisma.calendarItem.findFirst({
    where: { id: job.calendarItemId, tenantId: job.tenantId },
    include: { asset: true },
  });
  if (!item?.asset) {
    return Response.json({ ok: false, error: "missing_target" }, { status: 400 });
  }

  try {
    // await publishToPlatform(item.platform, item.asset, ...)
    await prisma.calendarItem.update({
      where: { id: item.id },
      data: { status: "PUBLISHED", publishedAt: new Date(), publishError: null },
    });
    return Response.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "publish_failed";
    await prisma.calendarItem.update({
      where: { id: item.id },
      data: { status: "FAILED", publishError: message },
    });
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export const POST = verifySignatureAppRouter(handler);
