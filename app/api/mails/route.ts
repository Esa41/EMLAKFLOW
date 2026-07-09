import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/mails — ofisin giden e-posta listesi (E-postalar sekmesi). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const mails = await prisma.emailLog.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      to: true,
      toName: true,
      kind: true,
      subject: true,
      preview: true,
      status: true,
      error: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ mails });
}
