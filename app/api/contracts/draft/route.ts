import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { renderContractHtml, type ContractData } from "@/lib/contract";
import type { ContractType } from "@prisma/client";

const TYPES: ContractType[] = [
  "AUTHORIZATION",
  "VIEWING_FORM",
  "SALE_CONTRACT",
  "RENT_CONTRACT",
];

/**
 * Otomatik sözleşme taslağı — tarayıcıya doğrudan HTML döner (JSON değil).
 * ?type=SALE_CONTRACT&contactId=xxx&listingId=yyy&dealId=zzz
 * Yeni sekmede açılıp Ctrl/Cmd+P ile PDF'e çevrilmek üzere tasarlanmıştır.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const type = sp.get("type") as ContractType | null;
  const contactId = sp.get("contactId");
  const listingId = sp.get("listingId");
  const dealId = sp.get("dealId");

  if (!type || !TYPES.includes(type)) {
    return NextResponse.json(
      { error: "Geçersiz sözleşme türü." },
      { status: 400 },
    );
  }
  if (!contactId) {
    return NextResponse.json({ error: "Müşteri seçilmeli." }, { status: 400 });
  }

  const db = forTenant(session.tenantId);

  const [tenant, contact, listing, deal] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        name: true,
        phone: true,
        contractCompanyTitle: true,
        contractRepresentative: true,
        contractAddress: true,
        contractTaxNo: true,
        contractExtraClauses: true,
      },
    }),
    db.contact.findUnique({
      where: { id: contactId },
      select: { fullName: true, phone: true, email: true },
    }),
    listingId
      ? db.listing.findUnique({
          where: { id: listingId },
          select: {
            refCode: true,
            title: true,
            city: true,
            district: true,
            neighborhood: true,
            address: true,
            price: true,
            purpose: true,
            rooms: true,
            netArea: true,
            grossArea: true,
          },
        })
      : Promise.resolve(null),
    dealId
      ? db.deal.findUnique({ where: { id: dealId }, select: { value: true } })
      : Promise.resolve(null),
  ]);

  if (!tenant)
    return NextResponse.json({ error: "Ofis bulunamadı." }, { status: 404 });
  if (!contact)
    return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 });

  const data: ContractData = {
    type,
    tenant,
    contact,
    listing: listing ? { ...listing, price: Number(listing.price) } : null,
    dealValue: deal?.value != null ? Number(deal.value) : null,
  };

  const html = renderContractHtml(data);
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
