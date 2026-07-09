import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Resend webhook — opened / clicked / bounced → MarketingOutboundEmail + Lead.
 * Eşleşme: önce email_id (resendId), yoksa alıcı e-postası.
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
  if (!secret) return true;

  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const headerSecret = req.headers.get("x-resend-webhook-secret");
  if (headerSecret === secret) return true;

  return false;
}

const LEAD_RANK: Record<string, number> = {
  PENDING: 0,
  SENT: 1,
  OPENED: 2,
  CLICKED: 3,
  REJECTED: -1,
  DEMO_BOOKED: 4,
};

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
  const resendId = payload.data?.email_id?.trim() || null;
  const email = extractEmail(payload.data?.to);
  const now = new Date();

  let outboundEvent: "opened" | "clicked" | "bounced" | null = null;
  let nextLeadStatus: "OPENED" | "CLICKED" | null = null;

  if (type === "email.opened") {
    outboundEvent = "opened";
    nextLeadStatus = "OPENED";
  } else if (type === "email.clicked") {
    outboundEvent = "clicked";
    nextLeadStatus = "CLICKED";
  } else if (
    type === "email.bounced" ||
    type === "email.complained"
  ) {
    outboundEvent = "bounced";
  } else {
    return NextResponse.json({ ok: true, skipped: "unhandled-event", type });
  }

  // 1) Outbound satırı: resendId ile
  let outbound = resendId
    ? await prisma.marketingOutboundEmail.findUnique({
        where: { resendId },
      })
    : null;

  // 2) Fallback: alıcı e-postasına göre en son gönderim
  if (!outbound && email) {
    const lead = await prisma.marketingLead.findUnique({
      where: { email },
      select: { id: true },
    });
    if (lead) {
      outbound = await prisma.marketingOutboundEmail.findFirst({
        where: { leadId: lead.id, status: { in: ["sent", "opened", "clicked"] } },
        orderBy: { sentAt: "desc" },
      });
    }
  }

  if (outbound) {
    const data: {
      status?: string;
      openedAt?: Date;
      clickedAt?: Date;
      error?: string;
    } = {};

    if (outboundEvent === "opened") {
      if (!outbound.openedAt) data.openedAt = now;
      if (outbound.status === "sent") data.status = "opened";
    } else if (outboundEvent === "clicked") {
      if (!outbound.clickedAt) data.clickedAt = now;
      if (!outbound.openedAt) data.openedAt = now;
      data.status = "clicked";
    } else if (outboundEvent === "bounced") {
      data.status = "bounced";
      data.error = type;
    }

    if (Object.keys(data).length > 0) {
      await prisma.marketingOutboundEmail.update({
        where: { id: outbound.id },
        data,
      });
    }
  }

  // Lead status + timestamps
  const lead =
    outbound
      ? await prisma.marketingLead.findUnique({
          where: { id: outbound.leadId },
          select: { id: true, status: true },
        })
      : email
        ? await prisma.marketingLead.findUnique({
            where: { email },
            select: { id: true, status: true },
          })
        : null;

  if (!lead) {
    return NextResponse.json({
      ok: true,
      outboundUpdated: !!outbound,
      skipped: outbound ? undefined : "lead-not-found",
    });
  }

  const leadData: {
    status?: "OPENED" | "CLICKED";
    openedAt?: Date;
    clickedAt?: Date;
  } = {};

  if (outboundEvent === "opened") {
    leadData.openedAt = now;
  }
  if (outboundEvent === "clicked") {
    leadData.clickedAt = now;
    leadData.openedAt = now;
  }

  if (nextLeadStatus) {
    const currentRank = LEAD_RANK[lead.status] ?? 0;
    const nextRank = LEAD_RANK[nextLeadStatus] ?? 0;
    if (nextRank > currentRank) {
      leadData.status = nextLeadStatus;
    }
  }

  if (Object.keys(leadData).length > 0) {
    await prisma.marketingLead.update({
      where: { id: lead.id },
      data: leadData,
    });
  }

  return NextResponse.json({
    ok: true,
    event: outboundEvent,
    leadStatus: nextLeadStatus,
  });
}

export async function GET() {
  return NextResponse.json({ error: "Yalnızca POST" }, { status: 405 });
}
