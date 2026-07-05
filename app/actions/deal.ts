"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createManualDeal(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const contactId = formData.get("contactId") as string;
  const listingId = formData.get("listingId") as string;
  const value = formData.get("value") as string;

  if (!contactId) return;

  const numericValue = value ? Number(value) : null;

  await prisma.deal.create({
    data: {
      tenantId: session.tenantId,
      contactId,
      listingId: listingId || null,
      stage: "NEW",
      agentId: session.userId, // assign to the current user
      value: numericValue && !isNaN(numericValue) ? numericValue : null,
    },
  });

  revalidatePath(`/kisiler/${contactId}`);
  revalidatePath(`/musteriler`);
  revalidatePath(`/dashboard`);
}
