"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

export async function dismissInsight(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  if (!id) return;

  // forTenant update → aidiyet kontrolü extension'da yapılır
  await forTenant(session.tenantId).insight.update({
    where: { id },
    data: { dismissedAt: new Date() },
  });

  revalidatePath("/dashboard");
}
