import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserIsSuperAdmin } from "@/lib/plans";
import { sendOutboundToLead } from "@/lib/admin-marketing-send";
import { getAdminMarketingTemplate } from "@/lib/admin-marketing-templates";

/**
 * POST /api/admin/leads/[id]/send — kişiye özel outbound mail.
 * Body: { templateKey, subject?, body? }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await currentUserIsSuperAdmin())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const templateKey = String(body?.templateKey ?? "demo-invite").trim();
  const subject = body?.subject ? String(body.subject) : undefined;
  const message = body?.body ? String(body.body) : undefined;

  if (!getAdminMarketingTemplate(templateKey) && templateKey !== "custom") {
    return NextResponse.json({ error: "Geçersiz şablon." }, { status: 400 });
  }

  const result = await sendOutboundToLead({
    leadId: id,
    templateKey,
    subject,
    body: message,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Gönderilemedi." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, emailId: result.emailId });
}
