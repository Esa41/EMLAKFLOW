import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { officeBrand } from "@/lib/office-brand";
import { sendNewListingEmail } from "@/lib/marketing-mailer";

/**
 * POST /api/mails/new-listing — kişi detayındaki "Uygun İlanlar" bölümünden
 * manuel portföy önerisi. Body: { contactId, listingId }
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.contactId || !body?.listingId) {
    return NextResponse.json(
      { error: "contactId ve listingId zorunlu." },
      { status: 400 },
    );
  }

  const db = forTenant(session.tenantId);
  const [contact, listing] = await Promise.all([
    db.contact.findUnique({
      where: { id: String(body.contactId) },
      select: { id: true, fullName: true, email: true },
    }),
    db.listing.findUnique({
      where: { id: String(body.listingId) },
      select: { id: true, title: true, slug: true, status: true },
    }),
  ]);

  if (!contact || !listing) {
    return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
  }
  if (!contact.email) {
    return NextResponse.json(
      { error: "Bu kişinin kayıtlı e-postası yok." },
      { status: 400 },
    );
  }

  const office = await officeBrand(session.tenantId);
  if (!office) return NextResponse.json({ error: "Ofis bulunamadı" }, { status: 404 });

  const publicId = listing.slug ? `${listing.id}-${listing.slug}` : listing.id;
  const { sent } = await sendNewListingEmail(
    contact.email,
    contact.fullName,
    listing.title,
    `${office.showcase}/ilan/${publicId}`,
    office.brand,
    {
      tenantId: session.tenantId,
      kind: "new-listing",
      contactId: contact.id,
      listingId: listing.id,
    },
  );

  if (!sent) {
    return NextResponse.json(
      { error: "E-posta gönderilemedi — tekrar deneyin." },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true });
}
