import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * Okunmamış ekip sohbeti mesaj sayısı.
 * Kullanıcının lastReadAt imlecinden sonra gelen, kendisine ait olmayan
 * TEAM mesajları sayılır.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const read = await prisma.teamChatRead.findUnique({
    where: { tenantId_userId: { tenantId: session.tenantId, userId: session.userId } },
    select: { lastReadAt: true },
  });
  const since = read?.lastReadAt ?? new Date(0);

  const unread = await prisma.message.count({
    where: {
      tenantId: session.tenantId,
      sessionId: "TEAM",
      createdAt: { gt: since },
      senderId: { not: session.userId },
    },
  });

  return NextResponse.json({ unread });
}

/** Ekip sohbetini "okundu" işaretle — lastReadAt = şimdi. */
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  await prisma.teamChatRead.upsert({
    where: { tenantId_userId: { tenantId: session.tenantId, userId: session.userId } },
    create: { tenantId: session.tenantId, userId: session.userId, lastReadAt: now },
    update: { lastReadAt: now },
  });

  return NextResponse.json({ ok: true });
}
