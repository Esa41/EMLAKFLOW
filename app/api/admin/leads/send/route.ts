import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserIsSuperAdmin } from "@/lib/plans";
import { sendMail } from "@/lib/mailer";
import { renderMarketingLeadEmail } from "@/lib/marketing-lead-mail";

const BATCH_LIMIT = 50;

export async function POST() {
  if (!(await currentUserIsSuperAdmin())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const pending = await prisma.marketingLead.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: BATCH_LIMIT,
  });

  if (pending.length === 0) {
    return NextResponse.json({
      sent: 0,
      failed: 0,
      message: "Gönderilecek bekleyen lead yok.",
    });
  }

  let sent = 0;
  let failed = 0;
  const errors: Array<{ email: string; error: string }> = [];

  for (const lead of pending) {
    const { subject, html, text } = renderMarketingLeadEmail({
      firmaAdi: lead.firmaAdi,
      yetkiliIsmi: lead.yetkiliIsmi,
    });

    const result = await sendMail({
      to: lead.email,
      subject,
      html,
      text,
    });

    if (result.sent) {
      await prisma.marketingLead.update({
        where: { id: lead.id },
        data: { status: "SENT" },
      });
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
    total: pending.length,
    errors: errors.slice(0, 10),
    message: `${sent} e-posta gönderildi${failed ? `, ${failed} başarısız` : ""}.`,
  });
}
