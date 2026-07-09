import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Resend webhook — email.opened / email.clicked olaylarını MarketingLead'e yansıtır.
 * Resend Dashboard → Webhooks → bu URL'yi ekleyin.
 * Opsiyonel: RESEND_WEBHOOK_SECRET ile Bearer / svix-style doğrulama.
 */

type ResendWebhookPayload = {
  type?: string;
  data?: {
    email_id?: string;
    to?: string[] | string;
    from?: string;
    subject?: string;
    created_at?: string;
  };
};

function extractEmail(to: string[] | string | undefined): string | null {
  if (!to) return null;
  if (Array.isArray(to)) {
    const first = to[0]?.trim().toLowerCase();
    return first || null;
  }
  const single = to.trim().toLowerCase();
  return single || null;
}

function verifyWebhookSecret(req: Request): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) return true; // secret yoksa (dev) kabul et

  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const headerSecret = req.headers.get("x-resend-webhook-secret");
  if (headerSecret === secret) return true;

  return false;
}

export async function POST(req: Request) {
  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  let payload: ResendWebhookPayload;
  try {
    payload = (await req.json()) as ResendWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const type = payload.type ?? "";
  const email = extractEmail(payload.data?.to);

  if (!email) {
    return NextResponse.json({ ok: true, skipped: "no-email" });
  }

  let nextStatus: "OPENED" | "CLICKED" | null = null;
  if (type === "email.opened") nextStatus = "OPENED";
  if (type === "email.clicked") nextStatus = "CLICKED";

  if (!nextStatus) {
    return NextResponse.json({ ok: true, skipped: "unhandled-event", type });
  }

  const lead = await prisma.marketingLead.findUnique({
    where: { email },
    select: { id: true, status: true },
  });

  if (!lead) {
    return NextResponse.json({ ok: true, skipped: "lead-not-found" });
  }

  // İlerleme sırası: PENDING < SENT < OPENED < CLICKED < DEMO_BOOKED
  // REJECTED'a geri düşürme; CLICKED OPENED'ı ezer; OPENED CLICKED'ı geri almaz.
  const rank: Record<string, number> = {
    PENDING: 0,
    SENT: 1,
    OPENED: 2,
    CLICKED: 3,
    REJECTED: -1,
    DEMO_BOOKED: 4,
  };

  const currentRank = rank[lead.status] ?? 0;
  const nextRank = rank[nextStatus] ?? 0;

  if (nextRank > currentRank) {
    await prisma.marketingLead.update({
      where: { id: lead.id },
      data: { status: nextStatus },
    });
  }

  return NextResponse.json({ ok: true, status: nextStatus });
}

export async function GET() {
  return NextResponse.json({ error: "Yalnızca POST" }, { status: 405 });
}
