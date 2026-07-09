import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserIsSuperAdmin } from "@/lib/plans";
import type { MarketingLeadStatus } from "@prisma/client";

const ALLOWED_STATUS = new Set<MarketingLeadStatus>([
  "PENDING",
  "SENT",
  "OPENED",
  "CLICKED",
  "REJECTED",
  "DEMO_BOOKED",
]);

/** Lead listesi (super-admin). */
export async function GET() {
  if (!(await currentUserIsSuperAdmin())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const leads = await prisma.marketingLead.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ leads });
}

/** Tekil lead ekleme (super-admin). */
export async function POST(req: Request) {
  if (!(await currentUserIsSuperAdmin())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  let body: {
    firmaAdi?: string;
    yetkiliIsmi?: string;
    email?: string;
    telefon?: string;
    bolge?: string;
    status?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const firmaAdi = body.firmaAdi?.trim();
  const email = body.email?.trim().toLowerCase();

  if (!firmaAdi || !email) {
    return NextResponse.json(
      { error: "Firma adı ve e-posta zorunludur." },
      { status: 400 },
    );
  }

  const status =
    body.status && ALLOWED_STATUS.has(body.status as MarketingLeadStatus)
      ? (body.status as MarketingLeadStatus)
      : "PENDING";

  try {
    const lead = await prisma.marketingLead.create({
      data: {
        firmaAdi,
        email,
        yetkiliIsmi: body.yetkiliIsmi?.trim() || null,
        telefon: body.telefon?.trim() || null,
        bolge: body.bolge?.trim() || null,
        status,
      },
    });
    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "Bu e-posta zaten kayıtlı." },
        { status: 409 },
      );
    }
    console.error("[admin/leads] create:", err);
    return NextResponse.json({ error: "Kayıt oluşturulamadı." }, { status: 500 });
  }
}
