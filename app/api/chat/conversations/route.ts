import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  TEAM_SESSION,
  dmSessionId,
  isDmSession,
  peerFromDmSession,
} from "@/lib/chat-sessions";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [members, messages, reads] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
    prisma.message.findMany({
      where: {
        tenantId: session.tenantId,
        OR: [
          { sessionId: TEAM_SESSION },
          {
            sessionId: {
              startsWith: `DM:${session.userId}:`,
            },
          },
          {
            sessionId: {
              endsWith: `:${session.userId}`,
              startsWith: "DM:",
            },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        sessionId: true,
        body: true,
        createdAt: true,
        senderId: true,
        senderName: true,
      },
    }),
    prisma.teamChatRead.findMany({
      where: { tenantId: session.tenantId, userId: session.userId },
      select: { sessionId: true, lastReadAt: true },
    }),
  ]);

  const readMap = new Map(reads.map((r) => [r.sessionId, r.lastReadAt]));

  const lastBySession = new Map<
    string,
    { body: string; createdAt: Date; senderId: string | null; senderName: string | null }
  >();
  for (const m of messages) {
    if (!m.sessionId || lastBySession.has(m.sessionId)) continue;
    lastBySession.set(m.sessionId, m);
  }

  // Hoisted fonksiyon içinde TS null daraltması kaybolmasın diye yerel kopya
  const currentUserId = session.userId;
  function unreadFor(sessionId: string): number {
    const since = readMap.get(sessionId) ?? new Date(0);
    return messages.filter(
      (m) =>
        m.sessionId === sessionId &&
        m.createdAt > since &&
        m.senderId !== currentUserId,
    ).length;
  }

  const teamLast = lastBySession.get(TEAM_SESSION);
  const conversations = [
    {
      sessionId: TEAM_SESSION,
      type: "group" as const,
      label: "Tüm ekip",
      lastBody: teamLast?.body ?? null,
      lastAt: teamLast?.createdAt.toISOString() ?? null,
      unread: unreadFor(TEAM_SESSION),
    },
    ...members
      .filter((m) => m.id !== session.userId)
      .map((m) => {
        const sid = dmSessionId(session.userId, m.id);
        const last = lastBySession.get(sid);
        return {
          sessionId: sid,
          type: "dm" as const,
          peerId: m.id,
          peerName: m.name,
          peerRole: m.role,
          label: m.name,
          lastBody: last?.body ?? null,
          lastAt: last?.createdAt?.toISOString() ?? null,
          unread: unreadFor(sid),
        };
      })
      .sort((a, b) => {
        if (a.unread !== b.unread) return b.unread - a.unread;
        const atA = a.lastAt ? new Date(a.lastAt).getTime() : 0;
        const atB = b.lastAt ? new Date(b.lastAt).getTime() : 0;
        return atB - atA;
      }),
  ];

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  return NextResponse.json({
    members: members.filter((m) => m.id !== session.userId),
    conversations,
    totalUnread,
  });
}
