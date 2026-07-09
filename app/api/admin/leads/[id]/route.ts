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

/**
 * PATCH /api/admin/leads/[id] — lead alanları / durum / not.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await currentUserIsSuperAdmin())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const existing = await prisma.marketingLead.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Lead bulunamadı." }, { status: 404 });
  }

  const data: {
    firmaAdi?: string;
    yetkiliIsmi?: string | null;
    telefon?: string | null;
    bolge?: string | null;
    notes?: string | null;
    status?: MarketingLeadStatus;
  } = {};

  if (typeof body.firmaAdi === "string" && body.firmaAdi.trim()) {
    data.firmaAdi = body.firmaAdi.trim();
  }
  if ("yetkiliIsmi" in body) {
    data.yetkiliIsmi = body.yetkiliIsmi
      ? String(body.yetkiliIsmi).trim()
      : null;
  }
  if ("telefon" in body) {
    data.telefon = body.telefon ? String(body.telefon).trim() : null;
  }
  if ("bolge" in body) {
    data.bolge = body.bolge ? String(body.bolge).trim() : null;
  }
  if ("notes" in body) {
    data.notes = body.notes ? String(body.notes).trim().slice(0, 2000) : null;
  }
  if (
    typeof body.status === "string" &&
    ALLOWED_STATUS.has(body.status as MarketingLeadStatus)
  ) {
    data.status = body.status as MarketingLeadStatus;
  }

  const lead = await prisma.marketingLead.update({
    where: { id },
    data,
  });

  return NextResponse.json({ lead });
}
