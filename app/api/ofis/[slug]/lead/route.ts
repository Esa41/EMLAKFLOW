import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forTenant } from "@/lib/tenant";
import { findMatchingListings } from "@/lib/matching";

/**
 * Public vitrin formu → CRM.
 * kind: "listing" → { name, phone, message?, listingId }
 * kind: "search"  → { name, phone, purpose, district?, rooms?, maxPrice?, note? }
 * Spam önlemi: honeypot ("website" dolu gelirse sessizce kabul edilmiş gibi yanıtlanır).
 */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const body = await req.json().catch(() => null);

  // Honeypot — bot doldurduysa başarılı görünüp hiçbir şey yazma
  if (body?.website) return NextResponse.json({ ok: true });

  const name = String(body?.name ?? "").trim().slice(0, 80);
  const phone = String(body?.phone ?? "").trim().slice(0, 24);
  if (!name || phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json(
      { error: "Ad ve geçerli bir telefon numarası gerekli." },
      { status: 400 }
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!tenant) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  // Kişiyi telefonla eşle — aynı müşteri iki kez form doldurursa çoğaltma
  const contact =
    (await prisma.contact.findFirst({
      where: { tenantId: tenant.id, phone },
    })) ??
    (await prisma.contact.create({
      data: { tenantId: tenant.id, type: "BUYER", fullName: name, phone },
    }));

  // OWNER'ı bul (bildirim hedefi yedeği)
  const owner = await prisma.user.findFirst({
    where: { tenantId: tenant.id, role: "OWNER", isActive: true },
    select: { id: true },
  });

  if (body.kind === "listing") {
    const listing = await prisma.listing.findUnique({
      where: { id: String(body.listingId ?? "") },
      select: {
        id: true, tenantId: true, refCode: true, title: true, price: true,
        purpose: true, type: true, city: true, district: true, agentId: true,
      },
    });
    if (!listing || listing.tenantId !== tenant.id) {
      return NextResponse.json({ error: "İlan bulunamadı." }, { status: 404 });
    }

    const message = body.message ? String(body.message).slice(0, 500) : null;
    const lead = await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        contactId: contact.id,
        source: "vitrin",
        purpose: listing.purpose,
        type: listing.type,
        city: listing.city,
        district: listing.district,
        note: `[Vitrin · ${listing.refCode}] ${listing.title}${message ? ` — "${message}"` : ""}`,
      },
    });

    const targetUser = listing.agentId ?? owner?.id;
    
    await prisma.deal.create({
      data: {
        tenantId: tenant.id,
        stage: "NEW",
        listingId: listing.id,
        leadId: lead.id,
        contactId: contact.id,
        agentId: targetUser,
        value: listing.price,
      },
    });

    if (targetUser) {
      await prisma.notification.create({
        data: {
          tenantId: tenant.id,
          userId: targetUser,
          title: `Vitrinden talep: ${listing.refCode}`,
          body: `${name} (${phone}) "${listing.title}" için bilgi istedi.`,
          href: `/portfoy/${listing.id}`,
        },
      });
    }
    await prisma.activity.create({
      data: {
        tenantId: tenant.id,
        type: "NOTE",
        entity: "listing",
        entityId: listing.id,
        body: `Vitrin formu: ${name} (${phone}) → ${listing.refCode}.`,
      },
    });
    // Funnel: CONTACT olayı (sunucu tarafı → bot/adblock'tan etkilenmez)
    await prisma.listingEvent.create({
      data: { tenantId: tenant.id, listingId: listing.id, type: "CONTACT", source: "vitrin" },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  // kind: "search" — kriterli talep
  const purpose = body.purpose === "RENT" ? "RENT" : "SALE";
  const maxPrice = body.maxPrice ? Number(body.maxPrice) : null;
  const lead = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      contactId: contact.id,
      source: "vitrin",
      purpose,
      type: "APARTMENT",
      district: body.district ? String(body.district).slice(0, 60) : null,
      rooms: body.rooms ? String(body.rooms).slice(0, 10) : null,
      maxPrice: maxPrice && !isNaN(maxPrice) && maxPrice > 0 ? maxPrice : null,
      note: `[Vitrin · genel talep]${body.note ? ` "${String(body.note).slice(0, 500)}"` : ""}`,
    },
  });
  
  await prisma.deal.create({
    data: {
      tenantId: tenant.id,
      stage: "NEW",
      leadId: lead.id,
      contactId: contact.id,
      agentId: owner?.id,
      value: maxPrice && !isNaN(maxPrice) && maxPrice > 0 ? maxPrice : null,
    },
  });

  // Funnel: ilandan bağımsız genel talep de CONTACT sayılır
  await prisma.listingEvent.create({
    data: { tenantId: tenant.id, type: "CONTACT", source: "vitrin" },
  });

  // Ters eşleştirme: talebe uyan aktif ilanlar (danışmana ipucu)
  const matchCount = await findMatchingListings(forTenant(tenant.id), lead, 55)
    .then((m) => m.length)
    .catch(() => 0);

  if (owner) {
    await prisma.notification.create({
      data: {
        tenantId: tenant.id,
        userId: owner.id,
        title: "Vitrinden yeni arama talebi",
        body: `${name} (${phone}) — ${purpose === "SALE" ? "satılık" : "kiralık"}${
          body.district ? `, ${body.district}` : ""
        }${body.rooms ? `, ${body.rooms}` : ""} arıyor.${
          matchCount > 0 ? ` Portföyde ${matchCount} uygun ilan var.` : ""
        }`,
        href: `/kisiler/${contact.id}`,
      },
    });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
