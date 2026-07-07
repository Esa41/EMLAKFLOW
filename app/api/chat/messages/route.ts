import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  TEAM_SESSION,
  dmSessionId,
  isDmSession,
  isInternalSession,
} from "@/lib/chat-sessions";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = new URL(req.url).searchParams.get("session");
  if (!sessionId || !isInternalSession(sessionId)) {
    return NextResponse.json({ error: "Geçersiz oturum" }, { status: 400 });
  }

  if (isDmSession(sessionId)) {
    const parts = sessionId.split(":");
    if (parts.length !== 3) {
      return NextResponse.json({ error: "Geçersiz oturum" }, { status: 400 });
    }
    const [, id1, id2] = parts;
    if (id1 !== session.userId && id2 !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const expected = dmSessionId(id1, id2);
    if (expected !== sessionId) {
      return NextResponse.json({ error: "Geçersiz oturum" }, { status: 400 });
    }
  }

  const messages = await prisma.message.findMany({
    where: { tenantId: session.tenantId, sessionId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(messages.reverse());
}
