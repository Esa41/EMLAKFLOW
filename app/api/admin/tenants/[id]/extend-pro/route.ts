import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserIsSuperAdmin } from "@/lib/plans";
import { getSession } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await currentUserIsSuperAdmin())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const days = Number(body?.days);

  // Pozitif: süre ekle · Negatif: süre düş (yanlış eklemeyi düzelt)
  if (!Number.isFinite(days) || days === 0 || days < -3650 || days > 3650) {
    return NextResponse.json(
      { error: "days -3650 ile 3650 arasında, 0 olamaz." },
      { status: 400 },
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { id: true, plan: true, proExpiresAt: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Ofis bulunamadı." }, { status: 404 });
  }

  const session = await getSession();
  const now = new Date();
  const baseDate =
    tenant.proExpiresAt && tenant.proExpiresAt > now
      ? tenant.proExpiresAt
      : now;
  const expiresAt = new Date(baseDate);
  expiresAt.setDate(expiresAt.getDate() + days);

  const wasPaid = tenant.plan === "pro" || tenant.plan === "premium";
  const nextPlan = wasPaid ? tenant.plan : "pro";

  const updated = await prisma.tenant.update({
    where: { id },
    data: {
      plan: nextPlan,
      proStartedAt: wasPaid ? undefined : now,
      proExpiresAt: expiresAt,
    },
    select: { id: true, plan: true, proStartedAt: true, proExpiresAt: true },
  });

  const abs = Math.abs(days);
  const planLabel = nextPlan === "premium" ? "Premium" : "Pro";
  const reasonText =
    days < 0
      ? `${abs} gün ${planLabel} süresi düşüldü (düzeltme)`
      : days === 365
        ? `1 Yıl ${planLabel} eklendi`
        : days === 30
          ? `30 Gün ${planLabel} eklendi`
          : days === 90
            ? `90 Gün (3 Ay) ${planLabel} eklendi`
            : `${days} gün ${planLabel} eklendi`;

  await prisma.planChangeLog.create({
    data: {
      tenantId: id,
      fromPlan: tenant.plan,
      toPlan: nextPlan,
      changedBy: session?.name ?? "Admin",
      reason: reasonText,
      expiresAt,
    },
  });

  return NextResponse.json({ tenant: updated });
}
