import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Ofis içi ekip sohbeti — kimlik doğrulamalı ve tenant'a izole.
// Public /api/chat/[sessionId] rotasının aksine burada mesajlar
// yalnızca oturum açan kullanıcının ofisine (tenantId) göre filtrelenir.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // En eski 200 yerine en yeni 200 mesajı al: desc çekip sonra tekrar
  // sohbet sırasına (asc) çevir, aksi halde uzun sohbetlerde son mesajlar kaybolur.
  const messages = await prisma.message.findMany({
    where: { tenantId: session.tenantId, sessionId: "TEAM" },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(messages.reverse());
}
