import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { publicUrl } from "@/lib/r2";
import type { ContractType } from "@prisma/client";

const TYPES: ContractType[] = [
  "AUTHORIZATION",
  "VIEWING_FORM",
  "SALE_CONTRACT",
  "RENT_CONTRACT",
];

/** Sözleşmeleri listeler — opsiyonel ?listingId= / ?contactId= / ?dealId= filtresiyle. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);

  const sp = req.nextUrl.searchParams;
  const listingId = sp.get("listingId");
  const contactId = sp.get("contactId");
  const dealId = sp.get("dealId");

  const contracts = await db.contract.findMany({
    where: {
      ...(listingId ? { listingId } : {}),
      ...(contactId ? { contactId } : {}),
      ...(dealId ? { dealId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { refCode: true, title: true } },
      contact: { select: { fullName: true, phone: true } },
      deal: { select: { id: true, stage: true } },
    },
  });

  return NextResponse.json({ contracts });
}

/** Body: { type, contactId?, listingId?, dealId?, fileUrl?, fileKey?, signedAt?, expiresAt? } */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);

  const body = await req.json().catch(() => null);
  if (!body?.type || !TYPES.includes(body.type)) {
    return NextResponse.json(
      { error: "Geçersiz sözleşme türü." },
      { status: 400 },
    );
  }

  // fileUrl verilmediyse ama fileKey verildiyse (doğrudan R2 yükleme akışı), sunucuda türet
  const fileUrl =
    body.fileUrl || (body.fileKey ? publicUrl(body.fileKey) : null);

  const contract = await db.contract.create({
    data: {
      tenantId: session.tenantId,
      type: body.type,
      contactId: body.contactId || null,
      listingId: body.listingId || null,
      dealId: body.dealId || null,
      fileUrl,
      fileKey: body.fileKey || null,
      signedAt: body.signedAt ? new Date(body.signedAt) : null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  });

  return NextResponse.json({ contract }, { status: 201 });
}
