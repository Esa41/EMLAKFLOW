import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TEAM_SESSION, isInternalSession } from "@/lib/chat-sessions";

async function unreadSince(
  tenantId: string,
  userId: string,
  sessionId: string,
  since: Date,
) {
  return prisma.message.count({
    where: {
      tenantId,
      sessionId,
      createdAt: { gt: since },
      senderId: { not: userId },
    },
  });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reads = await prisma.teamChatRead.findMany({
    where: { tenantId: session.tenantId, userId: session.userId },
    select: { sessionId: true, lastReadAt: true },
  });
  const readMap = new Map(reads.map((r) => [r.sessionId, r.lastReadAt]));

  const sessions = await prisma.message.findMany({
    where: {
      tenantId: session.tenantId,
      OR: [
        { sessionId: TEAM_SESSION },
        { sessionId: { startsWith: `DM:${session.userId}:` } },
        {
          sessionId: { startsWith: "DM:", endsWith: `:${session.userId}` },
        },
      ],
    },
    distinct: ["sessionId"],
    select: { sessionId: true },
  });

  let total = 0;
  for (const { sessionId } of sessions) {
    if (!sessionId || !isInternalSession(sessionId)) continue;
    const since = readMap.get(sessionId) ?? new Date(0);
    total += await unreadSince(
      session.tenantId,
      session.userId,
      sessionId,
      since,
    );
  }

  return NextResponse.json({ unread: total });
}

/** Sohbeti "okundu" işaretle — body: { sessionId?: string } */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let sessionId = TEAM_SESSION;
  try {
    const body = await req.json();
    if (body?.sessionId && isInternalSession(body.sessionId)) {
      sessionId = body.sessionId;
    }
  } catch {
    /* varsayılan TEAM */
  }

  const now = new Date();
  await prisma.teamChatRead.upsert({
    where: {
      tenantId_userId_sessionId: {
        tenantId: session.tenantId,
        userId: session.userId,
        sessionId,
      },
    },
    create: {
      tenantId: session.tenantId,
      userId: session.userId,
      sessionId,
      lastReadAt: now,
    },
    update: { lastReadAt: now },
  });

  return NextResponse.json({ ok: true });
}
