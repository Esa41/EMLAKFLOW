import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { buildPaymentSchedule } from "@/lib/rentals";
import type { RentalPeriod } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);

  const agreements = await db.rentalAgreement.findMany({
    orderBy: { startDate: "desc" },
    include: {
      contact: { select: { id: true, fullName: true, phone: true } },
      listing: { select: { id: true, refCode: true, title: true } },
      payments: { orderBy: { dueDate: "asc" } },
    },
  });

  return NextResponse.json({ agreements });
}

/** Body: { title, contactId, listingId?, startDate, endDate, rentAmount, deposit?, period?, paymentDueDay?, note? } */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);
  const body = await req.json().catch(() => null);

  if (!body?.title || !body?.contactId || !body?.startDate || !body?.endDate || !body?.rentAmount) {
    return NextResponse.json(
      { error: "title, contactId, startDate, endDate, rentAmount zorunlu." },
      { status: 400 },
    );
  }

  const startDate = new Date(body.startDate);
  const endDate = new Date(body.endDate);
  const period = (body.period ?? "MONTHLY") as RentalPeriod;
  const rentAmount = Number(body.rentAmount);

  const agreement = await db.rentalAgreement.create({
    data: {
      tenantId: session.tenantId,
      title: body.title,
      contactId: body.contactId,
      listingId: body.listingId || null,
      startDate,
      endDate,
      rentAmount,
      deposit: body.deposit != null ? Number(body.deposit) : null,
      period,
      paymentDueDay: body.paymentDueDay ? Number(body.paymentDueDay) : 1,
      note: body.note || null,
    },
  });

  const schedule = buildPaymentSchedule({
    startDate,
    endDate,
    period,
    rentAmount,
    paymentDueDay: agreement.paymentDueDay,
  });

  if (schedule.length > 0) {
    await db.rentPayment.createMany({
      data: schedule.map((row) => ({
        tenantId: session.tenantId,
        agreementId: agreement.id,
        periodLabel: row.periodLabel,
        dueDate: row.dueDate,
        amount: row.amount,
      })),
    });
  }

  if (body.listingId) {
    await db.listing.update({
      where: { id: body.listingId },
      data: { status: "RENTED" },
    });
  }

  const full = await db.rentalAgreement.findUnique({
    where: { id: agreement.id },
    include: {
      contact: { select: { id: true, fullName: true, phone: true } },
      listing: { select: { id: true, refCode: true, title: true } },
      payments: { orderBy: { dueDate: "asc" } },
    },
  });

  return NextResponse.json({ agreement: full }, { status: 201 });
}
