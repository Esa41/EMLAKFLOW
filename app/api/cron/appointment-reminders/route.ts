import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { officeBrand } from "@/lib/office-brand";
import { sendAppointmentReminderEmail } from "@/lib/marketing-mailer";

export const maxDuration = 60;

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "long",
  timeZone: "Europe/Istanbul",
});
const timeFmt = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

/**
 * Randevu hatırlatmaları — gecelik cron (vercel.json).
 * Önümüzdeki 24 saat içinde başlayan, e-postası olan müşterili randevulara
 * ofis markalı hatırlatma gönderir. Mükerrer koruması: EmailLog.refId.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "SCHEDULED",
      startsAt: { gte: now, lt: in24h },
      contact: { email: { not: null } },
    },
    select: {
      id: true,
      tenantId: true,
      title: true,
      startsAt: true,
      contact: { select: { id: true, fullName: true, email: true } },
      listing: {
        select: { title: true, neighborhood: true, district: true, city: true },
      },
    },
  });

  let sent = 0;
  const brands = new Map<string, Awaited<ReturnType<typeof officeBrand>>>();

  for (const a of appointments) {
    if (!a.contact?.email) continue;

    // Aynı randevuya daha önce hatırlatma gitmiş mi?
    const already = await prisma.emailLog.findFirst({
      where: { refId: a.id, kind: "appointment" },
      select: { id: true },
    });
    if (already) continue;

    if (!brands.has(a.tenantId)) {
      brands.set(a.tenantId, await officeBrand(a.tenantId));
    }
    const office = brands.get(a.tenantId);
    if (!office) continue;

    // Konum: ilanın semti; ilan bağlı değilse randevu başlığı, o da yoksa ofis
    const location = a.listing
      ? [a.listing.neighborhood, a.listing.district, a.listing.city]
          .filter(Boolean)
          .join(", ") || a.listing.title
      : a.title || "Ofisimiz";

    const res = await sendAppointmentReminderEmail(
      a.contact.email,
      a.contact.fullName,
      dateFmt.format(a.startsAt),
      timeFmt.format(a.startsAt),
      location,
      office.brand,
      {
        tenantId: a.tenantId,
        kind: "appointment",
        contactId: a.contact.id,
        refId: a.id,
      },
    ).catch((err) => {
      console.error("[appointment-reminders]", a.id, err);
      return { sent: false };
    });
    if (res.sent) sent++;
  }

  return NextResponse.json({ checked: appointments.length, sent });
}
