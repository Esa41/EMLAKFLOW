import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Vitrin ziyaretçi sohbeti (public). sessionId rastgele ("v_xxx") olduğundan
// tahmin edilemez; ek güvenlik için tenantId (?t=) ile de daraltılır.
export async function GET(req: NextRequest, props: { params: Promise<{ sessionId: string }> }) {
  const params = await props.params;
  const tenantId = req.nextUrl.searchParams.get("t");

  const messages = await prisma.message.findMany({
    where: {
      sessionId: params.sessionId,
      ...(tenantId ? { tenantId } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}
