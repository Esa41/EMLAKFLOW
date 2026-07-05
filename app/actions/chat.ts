"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function sendTeamMessage(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const body = formData.get("body") as string;
  if (!body || !body.trim()) return;

  await prisma.message.create({
    data: {
      tenantId: session.tenantId,
      senderId: session.userId,
      senderName: session.name,
      sessionId: "TEAM",
      body: body.trim(),
    },
  });

  revalidatePath("/ekip");
}

export async function sendVitrinMessage(tenantId: string, sessionId: string, senderName: string, body: string) {
  if (!body || !body.trim()) return;

  // Funnel: oturumun ilk mesajıysa CHAT olayı kaydet
  const existing = await prisma.message.findFirst({
    where: { tenantId, sessionId },
    select: { id: true },
  });

  await prisma.message.create({
    data: {
      tenantId,
      senderName,
      sessionId,
      body: body.trim(),
    },
  });

  if (!existing) {
    await prisma.listingEvent
      .create({ data: { tenantId, type: "CHAT", sessionId, source: "vitrin" } })
      .catch(() => {}); // analitik asla sohbeti bozmasın
  }
}

// Ajanın vitrin ziyaretçisine verdiği yanıt. Kimlik doğrulamalı ve
// tenant'a izole: sadece kendi ofisinin ziyaretçi oturumuna yazılabilir.
// senderId dolu olduğu için widget bunu "danışman" balonu olarak gösterir.
export async function sendAgentReply(sessionId: string, body: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!body || !body.trim() || !sessionId) return;

  // Oturumun bu tenant'a ait olduğunu doğrula (çapraz-tenant yazımı engelle).
  const belongs = await prisma.message.findFirst({
    where: { tenantId: session.tenantId, sessionId },
    select: { id: true },
  });
  if (!belongs) throw new Error("Not found");

  await prisma.message.create({
    data: {
      tenantId: session.tenantId,
      senderId: session.userId,
      senderName: session.name,
      sessionId,
      body: body.trim(),
    },
  });

  revalidatePath("/sohbet");
}
