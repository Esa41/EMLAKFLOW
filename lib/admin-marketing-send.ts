import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import {
  renderAdminMarketingEmail,
  type AdminMarketingVars,
} from "@/lib/admin-marketing-templates";

/**
 * Tek lead'e outbound mail gönder + MarketingOutboundEmail kaydı.
 */
export async function sendOutboundToLead(opts: {
  leadId: string;
  templateKey: string;
  subject?: string;
  body?: string;
}): Promise<{ ok: boolean; error?: string; emailId?: string }> {
  const lead = await prisma.marketingLead.findUnique({
    where: { id: opts.leadId },
  });
  if (!lead) return { ok: false, error: "Lead bulunamadı." };

  const vars: AdminMarketingVars = {
    firmaAdi: lead.firmaAdi,
    yetkiliIsmi: lead.yetkiliIsmi,
    bolge: lead.bolge,
  };

  const rendered = renderAdminMarketingEmail(opts.templateKey, vars, {
    subject: opts.subject,
    body: opts.body,
  });

  const result = await sendMail({
    to: lead.email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });

  const now = new Date();

  if (!result.sent) {
    await prisma.marketingOutboundEmail.create({
      data: {
        leadId: lead.id,
        templateKey: rendered.templateKey,
        subject: rendered.subject,
        preview: rendered.text.slice(0, 240),
        status: "failed",
        error: result.error ?? "Gönderilemedi",
        sentAt: now,
      },
    });
    return { ok: false, error: result.error ?? "E-posta gönderilemedi." };
  }

  const outbound = await prisma.marketingOutboundEmail.create({
    data: {
      leadId: lead.id,
      templateKey: rendered.templateKey,
      subject: rendered.subject,
      preview: rendered.text.slice(0, 240),
      status: "sent",
      resendId: result.id ?? null,
      sentAt: now,
    },
  });

  await prisma.marketingLead.update({
    where: { id: lead.id },
    data: {
      status: lead.status === "PENDING" ? "SENT" : lead.status,
      sentAt: now,
      lastEmailId: result.id ?? lead.lastEmailId,
    },
  });

  return { ok: true, emailId: outbound.id };
}
