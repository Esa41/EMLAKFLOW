import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reconcileMergeJob } from "@/lib/studio-reconcile";

// Shotstack render webhook'u — birleştirme bitince Shotstack buraya POST atar.
// Vercel Hobby'de cron günde bir çalıştığı için bu webhook, kullanıcı sekmeyi
// kapatsa bile merge'ün gerçek zamanlı tamamlanmasını sağlar (polling backstop
// olarak kalır; claim mantığı çift teslimatı zararsız kılar).
//
// Doğrulama: ?token=SHOTSTACK_WEBHOOK_SECRET (cron route'taki shared-secret
// deseni). Secret env'de tanımlı değilse mergeProject callback göndermez.

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const secret = process.env.SHOTSTACK_WEBHOOK_SECRET;
  if (!secret || req.nextUrl.searchParams.get("token") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { type?: string; action?: string; id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz gövde." });
  }

  // Yalnızca render tamamlanma/başarısızlık bildirimleri işlenir
  if (
    body.action !== "render" ||
    !body.id ||
    (body.status !== "done" && body.status !== "failed")
  ) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const job = await prisma.studioJob.findFirst({
    where: {
      externalRequestId: body.id,
      type: "VIDEO_MERGE",
      status: "PROCESSING",
    },
    select: {
      id: true,
      provider: true,
      externalRequestId: true,
      project: { select: { id: true, tenantId: true } },
    },
  });
  // İş bulunamadıysa (polling önce davranmış olabilir) sessizce 200 —
  // aksi halde Shotstack yeniden dener.
  if (!job?.project || !job.externalRequestId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await reconcileMergeJob(
      { id: job.id, provider: job.provider, externalRequestId: job.externalRequestId },
      job.project,
    );
  } catch {
    // Mutabakat hatası polling/cron tarafından telafi edilir
  }
  return NextResponse.json({ ok: true });
}
