import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentStatus } from "@/lib/rentals";
import { notificationLinks } from "@/lib/notification-links";

export const maxDuration = 60;

/** Kira vadesi hatırlatmaları — gecelik cron */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in3 = new Date(now);
  in3.setDate(in3.getDate() + 3);

  const unpaid = await prisma.rentPayment.findMany({
    where: { paidAt: null, dueDate: { lte: in3 } },
    include: {
      agreement: {
        include: {
          contact: true,
          tenant: { include: { users: { where: { role: "OWNER" }, take: 1 } } },
        },
      },
    },
  });

  let sent = 0;

  for (const p of unpaid) {
    const st = paymentStatus(null, p.dueDate, now);
    const owner = p.agreement.tenant.users[0];
    if (!owner) continue;

    const title =
      st === "OVERDUE"
        ? `Geciken kira: ${p.agreement.title}`
        : `Yaklaşan kira: ${p.agreement.title}`;

    const body =
      st === "OVERDUE"
        ? `${p.agreement.contact.fullName} — ${p.periodLabel} dönemi ödenmedi.`
        : `${p.agreement.contact.fullName} — vade ${p.dueDate.toLocaleDateString("tr-TR")}.`;

    const exists = await prisma.notification.findFirst({
      where: {
        tenantId: p.tenantId,
        userId: owner.id,
        title,
        createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      },
    });
    if (exists) continue;

    await prisma.notification.create({
      data: {
        tenantId: p.tenantId,
        userId: owner.id,
        title,
        body,
        href: notificationLinks.rentals(p.agreementId),
        category: "system",
        severity: st === "OVERDUE" ? "urgent" : "action",
      },
    });
    sent++;
  }

  // Sözleşme bitişine 30 gün kala
  const renewBy = new Date(now);
  renewBy.setDate(renewBy.getDate() + 30);
  const expiring = await prisma.rentalAgreement.findMany({
    where: { status: "ACTIVE", endDate: { lte: renewBy, gte: now } },
    include: { tenant: { include: { users: { where: { role: "OWNER" }, take: 1 } } } },
  });

  for (const a of expiring) {
    const owner = a.tenant.users[0];
    if (!owner) continue;
    await prisma.notification.create({
      data: {
        tenantId: a.tenantId,
        userId: owner.id,
        title: `Sözleşme yenileme: ${a.title}`,
        body: `Bitiş tarihi ${a.endDate.toLocaleDateString("tr-TR")} — yenilemeyi planlayın.`,
        href: notificationLinks.rentals(a.id),
        category: "system",
        severity: "action",
      },
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
