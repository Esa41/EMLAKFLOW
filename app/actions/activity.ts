"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
