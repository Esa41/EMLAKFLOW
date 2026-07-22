import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/**
 * Komut paleti (⌘K) global araması — kiracıya izole.
 * GET /api/search?q=...  → { results: [{ type, id, title, subtitle, href }] }
 * Şimdilik İlan + Müşteri (Contact). İkisinin de temiz detay rotası var.
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const db = forTenant(session.tenantId);
  const like = { contains: q, mode: "insensitive" as const };

  const [listings, contacts] = await Promise.all([
    db.listing.findMany({
      where: {
        OR: [
          { title: like },
          { refCode: like },
          { city: like },
          { district: like },
          { neighborhood: like },
          { address: like },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, title: true, refCode: true, city: true, district: true },
    }),
    db.contact.findMany({
      where: {
        OR: [{ fullName: like }, { phone: like }, { email: like }],
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, fullName: true, phone: true, email: true },
    }),
  ]);

  const results = [
    ...listings.map((l) => ({
      type: "listing" as const,
      id: l.id,
      title: l.title,
      subtitle: [l.refCode, [l.city, l.district].filter(Boolean).join(" / ")]
        .filter(Boolean)
        .join(" · "),
      href: `/portfoy/${l.id}`,
    })),
    ...contacts.map((c) => ({
      type: "contact" as const,
      id: c.id,
      title: c.fullName,
      subtitle: c.phone || c.email || "Müşteri",
      href: `/kisiler/${c.id}`,
    })),
  ];

  return NextResponse.json({ results });
}
