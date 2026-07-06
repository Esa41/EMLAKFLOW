"use server";

import { revalidatePath } from "next/cache";
import type { ActivityType } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MANUAL_TYPES: ActivityType[] = ["NOTE", "CALL", "MEETING", "WHATSAPP", "EMAIL"];

type LogResult =
  | {
      ok: true;
      activity: { id: string; type: string; body: string; createdAt: string };
    }
  | { ok: false; error: string };

/**
 * Bir varlığa (deal/contact/listing/lead) elle faaliyet ekler ve oluşturulan
 * kaydı döndürür — deal drawer gibi optimistic UI'ların anında göstermesi için.
 */
export async function logActivity(input: {
  entity: string;
  entityId: string;
  type: string;
  body: string;
}): Promise<LogResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Oturum bulunamadı." };

  const body = input.body?.trim();
  if (!body) return { ok: false, error: "Not boş olamaz." };
  if (body.length > 2000) return { ok: false, error: "Not çok uzun." };

  const type: ActivityType = MANUAL_TYPES.includes(input.type as ActivityType)
    ? (input.type as ActivityType)
    : "NOTE";

  const act = await prisma.activity.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      type,
      entity: input.entity || null,
      entityId: input.entityId || null,
      body,
    },
  });

  if (input.entity === "deal") revalidatePath("/musteriler");
  else if (input.entityId) revalidatePath(`/kisiler/${input.entityId}`);

  return {
    ok: true,
    activity: {
      id: act.id,
      type: act.type,
      body: act.body,
      createdAt: act.createdAt.toISOString(),
    },
  };
}

export async function addActivity(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const entityId = formData.get("entityId") as string;
  const entity = formData.get("entity") as string;
  const body = formData.get("body") as string;

  if (!body || !body.trim()) return;

  await prisma.activity.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      type: "NOTE",
      entity,
      entityId,
      body: body.trim(),
    },
  });

  // Revalidate the page so the new note shows up immediately
  revalidatePath(`/kisiler/${entityId}`);
}
