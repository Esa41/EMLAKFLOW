"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notificationLinks } from "@/lib/notification-links";
import { revalidatePath } from "next/cache";

const MAX_BODY_LEN = 2000;

type ChatResult = { ok: true } | { ok: false; error: string };

// Ortak gövde doğrulaması: boş/aşırı uzun mesajları reddeder.
function validateBody(
  raw: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const value = raw.trim();
  if (!value) return { ok: false, error: "Mesaj boş olamaz." };
  if (value.length > MAX_BODY_LEN)
    return { ok: false, error: "Mesaj çok uzun." };
  return { ok: true, value };
}

export async function sendTeamMessage(formData: FormData): Promise<ChatResult> {
  try {
    const session = await getSession();
    if (!session) return { ok: false, error: "Oturum bulunamadı." };

    const raw = formData.get("body");
    const check = validateBody(typeof raw === "string" ? raw : "");
    if (!check.ok) return check;

    await prisma.message.create({
      data: {
        tenantId: session.tenantId,
        senderId: session.userId,
        senderName: session.name,
        sessionId: "TEAM",
        body: check.value,
      },
    });

    // Her ekip mesajında OWNER + BROKER'a bildirim (gönderen hariç).
    // Bildirim üretimi sohbeti asla bozmamalı — hataları yut.
    try {
      const managers = await prisma.user.findMany({
        where: {
          tenantId: session.tenantId,
          role: { in: ["OWNER", "BROKER"] },
          isActive: true,
          id: { not: session.userId },
        },
        select: { id: true },
      });
      if (managers.length) {
        await prisma.notification.createMany({
          data: managers.map((m) => ({
            tenantId: session.tenantId,
            userId: m.id,
            category: "team",
            title: `${session.name} ekip sohbetinde yazdı`,
            body: check.value.slice(0, 120),
            href: notificationLinks.team(),
          })),
        });
      }
    } catch (err) {
      console.error("Ekip mesajı bildirimi oluşturulamadı:", err);
    }

    revalidatePath("/ekip");
    return { ok: true };
  } catch (err) {
    console.error("sendTeamMessage hata:", err);
    return { ok: false, error: "Mesaj gönderilemedi. Lütfen tekrar deneyin." };
  }
}

export async function sendVitrinMessage(
  tenantId: string,
  sessionId: string,
  senderName: string,
  body: string,
): Promise<ChatResult> {
  try {
    if (!tenantId || !sessionId)
      return { ok: false, error: "Geçersiz oturum." };
    const check = validateBody(body);
    if (!check.ok) return check;

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
        body: check.value,
      },
    });

    if (!existing) {
      await prisma.listingEvent
        .create({
          data: { tenantId, type: "CHAT", sessionId, source: "vitrin" },
        })
        .catch(() => {}); // analitik asla sohbeti bozmasın

      // İlk mesajda ofis sahibine bildirim gönder — bulunamazsa ya da
      // bildirim oluşturulamazsa sohbet akışını asla bozma.
      try {
        const owner = await prisma.user.findFirst({
          where: { tenantId, role: "OWNER", isActive: true },
          select: { id: true },
        });
        if (owner) {
          await prisma.notification.create({
            data: {
              tenantId,
              userId: owner.id,
              category: "chat",
              title: "Yeni vitrin sohbeti",
              body: `${senderName} yazdı: "${check.value.slice(0, 80)}"`,
              href: notificationLinks.chat(sessionId),
            },
          });
        }
      } catch (err) {
        console.error("Vitrin sohbeti bildirimi oluşturulamadı:", err);
      }
    }

    return { ok: true };
  } catch (err) {
    console.error("sendVitrinMessage hata:", err);
    return { ok: false, error: "Mesaj gönderilemedi. Lütfen tekrar deneyin." };
  }
}

// Ajanın vitrin ziyaretçisine verdiği yanıt. Kimlik doğrulamalı ve
// tenant'a izole: sadece kendi ofisinin ziyaretçi oturumuna yazılabilir.
// senderId dolu olduğu için widget bunu "danışman" balonu olarak gösterir.
export async function sendAgentReply(
  sessionId: string,
  body: string,
): Promise<ChatResult> {
  try {
    const session = await getSession();
    if (!session) return { ok: false, error: "Oturum bulunamadı." };
    if (!sessionId) return { ok: false, error: "Geçersiz oturum." };
    const check = validateBody(body);
    if (!check.ok) return check;

    // Oturumun bu tenant'a ait olduğunu doğrula (çapraz-tenant yazımı engelle).
    const belongs = await prisma.message.findFirst({
      where: { tenantId: session.tenantId, sessionId },
      select: { id: true },
    });
    if (!belongs) return { ok: false, error: "Sohbet bulunamadı." };

    await prisma.message.create({
      data: {
        tenantId: session.tenantId,
        senderId: session.userId,
        senderName: session.name,
        sessionId,
        body: check.value,
      },
    });

    revalidatePath("/sohbet");
    return { ok: true };
  } catch (err) {
    console.error("sendAgentReply hata:", err);
    return { ok: false, error: "Mesaj gönderilemedi. Lütfen tekrar deneyin." };
  }
}
