import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserIsSuperAdmin } from "@/lib/plans";
import { sendOutboundToLead } from "@/lib/admin-marketing-send";
import { getAdminMarketingTemplate } from "@/lib/admin-marketing-templates";

const BATCH_LIMIT = 20;

/**
 * POST /api/admin/leads/send — seçili lead'lere veya bekleyenlere (max 20).
 * Body: { leadIds?: string[], templateKey?, subject?, body? }
 */
export async function POST(req: Request) {
  if (!(await currentUserIsSuperAdmin())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const templateKey = String(body?.templateKey ?? "demo-invite").trim();
  const subject = body?.subject ? String(body.subject) : undefined;
  const message = body?.body ? String(body.body) : undefined;
  const leadIds = Array.isArray(body?.leadIds)
    ? (body.leadIds as unknown[])
        .map((x) => String(x))
        .filter(Boolean)
        .slice(0, BATCH_LIMIT)
    : [];

  if (!getAdminMarketingTemplate(templateKey) && templateKey !== "custom") {
    return NextResponse.json({ error: "Geçersiz şablon." }, { status: 400 });
  }

  const targets =
    leadIds.length > 0
      ? await prisma.marketingLead.findMany({
          where: { id: { in: leadIds } },
          orderBy: { createdAt: "asc" },
          take: BATCH_LIMIT,
        })
      : await prisma.marketingLead.findMany({
          where: { status: "PENDING" },
          orderBy: { createdAt: "asc" },
          take: BATCH_LIMIT,
        });

  if (targets.length === 0) {
    return NextResponse.json({
      sent: 0,
      failed: 0,
      message: "Gönderilecek lead yok.",
    });
  }

  let sent = 0;
  let failed = 0;
  const errors: Array<{ email: string; error: string }> = [];

  for (const lead of targets) {
    const result = await sendOutboundToLead({
      leadId: lead.id,
      templateKey,
      subject,
      body: message,
    });
    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
      errors.push({
        email: lead.email,
        error: result.error ?? "Bilinmeyen hata",
      });
    }
  }

  return NextResponse.json({
    sent,
    failed,
    total: targets.length,
    errors: errors.slice(0, 10),
    message: `${sent} e-posta gönderildi${failed ? `, ${failed} başarısız` : ""}.`,
  });
}
