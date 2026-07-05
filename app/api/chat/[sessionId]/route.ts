import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Vitrin ziyaretçi sohbeti (public). sessionId rastgele ("v_xxx") olduğundan
// tahmin edilemez; ek güvenlik için tenantId (?t=) ile de daraltılır.
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ sessionId: string }> },
) {
  const params = await props.params;
  const tenantId = req.nextUrl.searchParams.get("t");

  // En eski 200 yerine en yeni 200 mesajı al: desc çekip sonra tekrar
  // sohbet sırasına (asc) çevir, aksi halde uzun sohbetlerde son mesajlar kaybolur.
  const messages = await prisma.message.findMany({
    where: {
      sessionId: params.sessionId,
      ...(tenantId ? { tenantId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(messages.reverse());
}
