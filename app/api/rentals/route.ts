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
      contact: {
        select: { id: true, fullName: true, phone: true, nationalId: true },
      },
      listing: { select: { id: true, refCode: true, title: true } },
      payments: { orderBy: { dueDate: "asc" } },
    },
  });

  return NextResponse.json({ agreements });
}

/**
 * Body: {
 *   title, startDate, endDate, rentAmount,
 *   contactId?         — mevcut kişi
 *   newContact?        — { fullName, phone?, nationalId?, address? } satır içi yeni kiracı
 *   listingId?, propertyAddress?, deposit?, period?, paymentDueDay?,
 *   ownerName?, ownerNationalId?, increaseRate?,
 *   contractFileUrl?, contractFileKey?, contractFileName?, note?
 * }
 * contactId VEYA newContact'tan biri gelmeli. listingId opsiyoneldir —
 * ofis, portföyünde olmayan bir mülkün kirasını da takip edebilir.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);
  const body = await req.json().catch(() => null);

  /* Alan bazlı doğrulama — eskiden eksik alan ne olursa olsun beş alanın
     tamamı listeleniyordu ("title, contactId, startDate… zorunlu"), kullanıcı
     hangisini doldurmadığını anlayamıyordu. */
  const fieldErrors: Record<string, string> = {};
  if (!body?.title?.trim()) fieldErrors.title = "Sözleşme başlığı gerekli.";
  if (!body?.startDate) fieldErrors.startDate = "Başlangıç tarihi gerekli.";
  if (!body?.endDate) fieldErrors.endDate = "Bitiş tarihi gerekli.";
  if (!body?.rentAmount || Number(body.rentAmount) <= 0)
    fieldErrors.rentAmount = "Kira bedeli gerekli.";

  const newContact = body?.newContact;
  const hasNewContact = !!newContact?.fullName?.trim();
  if (!body?.contactId && !hasNewContact) {
    fieldErrors.contactId = "Kiracı seçin ya da yeni kişi bilgilerini girin.";
  }

  const startDate = new Date(body?.startDate);
  const endDate = new Date(body?.endDate);
  if (body?.startDate && Number.isNaN(startDate.getTime()))
    fieldErrors.startDate = "Başlangıç tarihi geçersiz.";
  if (body?.endDate && Number.isNaN(endDate.getTime()))
    fieldErrors.endDate = "Bitiş tarihi geçersiz.";
  if (
    !fieldErrors.startDate &&
    !fieldErrors.endDate &&
    endDate <= startDate
  ) {
    fieldErrors.endDate = "Bitiş tarihi başlangıçtan sonra olmalı.";
  }

  const dueDay = body?.paymentDueDay ? Number(body.paymentDueDay) : 1;
  if (dueDay < 1 || dueDay > 31) {
    fieldErrors.paymentDueDay = "Ödeme günü 1–31 arasında olmalı.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      { error: Object.values(fieldErrors)[0], fieldErrors },
      { status: 400 },
    );
  }

  /* Satır içi kiracı: emlakçı önce "Müşteriler"e gidip kişi oluşturmak
     zorunda kalmasın — sözleşmeyi keserken aynı formdan eklesin. */
  let contactId: string = body.contactId;
  if (!contactId && hasNewContact) {
    const created = await db.contact.create({
      data: {
        tenantId: session.tenantId,
        type: "TENANT_C",
        fullName: newContact.fullName.trim(),
        phone: newContact.phone?.trim() || null,
        nationalId: newContact.nationalId?.trim() || null,
        address: newContact.address?.trim() || null,
      },
      select: { id: true },
    });
    contactId = created.id;
  }

  const period = (body.period ?? "MONTHLY") as RentalPeriod;
  const rentAmount = Number(body.rentAmount);

  const agreement = await db.rentalAgreement.create({
    data: {
      tenantId: session.tenantId,
      title: body.title.trim(),
      contactId,
      listingId: body.listingId || null,
      propertyAddress: body.propertyAddress?.trim() || null,
      ownerName: body.ownerName?.trim() || null,
      ownerNationalId: body.ownerNationalId?.trim() || null,
      increaseRate:
        body.increaseRate != null && body.increaseRate !== ""
          ? Number(body.increaseRate)
          : null,
      contractFileUrl: body.contractFileUrl || null,
      contractFileKey: body.contractFileKey || null,
      contractFileName: body.contractFileName || null,
      startDate,
      endDate,
      rentAmount,
      deposit: body.deposit != null ? Number(body.deposit) : null,
      period,
      paymentDueDay: dueDay,
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
