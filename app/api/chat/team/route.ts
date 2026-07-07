import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Ofis içi ekip sohbeti — kimlik doğrulamalı ve tenant'a izole.
// Public /api/chat/[sessionId] rotasının aksine burada mesajlar
// yalnızca oturum açan kullanıcının ofisine (tenantId) göre filtrelenir.
import { TEAM_SESSION } from "@/lib/chat-sessions";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await prisma.message.findMany({
    where: { tenantId: session.tenantId, sessionId: TEAM_SESSION },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(messages.reverse());
}
