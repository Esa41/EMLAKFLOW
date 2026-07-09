import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserIsSuperAdmin } from "@/lib/plans";

/**
 * GET /api/admin/leads/[id]/emails — lead gönderim geçmişi.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await currentUserIsSuperAdmin())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { id } = await params;
  const lead = await prisma.marketingLead.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!lead) {
    return NextResponse.json({ error: "Lead bulunamadı." }, { status: 404 });
  }

  const rows = await prisma.marketingOutboundEmail.findMany({
    where: { leadId: id },
    orderBy: { sentAt: "desc" },
    take: 50,
  });

  const emails = rows.map((e) => ({
    ...e,
    sentAt: e.sentAt.toISOString(),
    openedAt: e.openedAt?.toISOString() ?? null,
    clickedAt: e.clickedAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
  }));

  return NextResponse.json({ emails });
}
