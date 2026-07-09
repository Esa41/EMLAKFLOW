import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserIsSuperAdmin } from "@/lib/plans";
import { getSession } from "@/lib/auth";

const ALLOWED_PLANS = ["free", "trial", "starter", "pro"];

// Tenant detayları - admin paneli için
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await currentUserIsSuperAdmin())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      proStartedAt: true,
      proExpiresAt: true,
      adminNotes: true,
      city: true,
      district: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          listings: true,
          users: true,
          deals: true,
          contacts: true,
          leads: true,
        },
      },
      users: {
        where: { role: "OWNER" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { email: true, name: true, createdAt: true },
      },
      planChanges: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          fromPlan: true,
          toPlan: true,
          changedBy: true,
          reason: true,
          expiresAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Ofis bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ tenant });
}

// Plan veya admin notlarını güncelle
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await currentUserIsSuperAdmin())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const plan = body?.plan as string | undefined;
  const adminNotes = body?.adminNotes as string | undefined;

  const existing = await prisma.tenant.findUnique({
    where: { id },
    select: { id: true, plan: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Ofis bulunamadı." }, { status: 404 });
  }

  const session = await getSession();
  const updateData: {
    plan?: string;
    adminNotes?: string | null;
    proStartedAt?: Date | null;
    proExpiresAt?: Date | null;
  } = {};

  // Plan değişikliği
  if (plan && ALLOWED_PLANS.includes(plan) && plan !== existing.plan) {
    updateData.plan = plan;
    
    if (plan === "pro") {
      updateData.proStartedAt = new Date();
      // Manuel pro yapma - süre yok, extend-pro endpoint'inden eklenir
    } else {
      // Free'ye alınca pro tarihlerini temizle
      updateData.proStartedAt = null;
      updateData.proExpiresAt = null;
    }

    // Log değişikliği
    await prisma.planChangeLog.create({
      data: {
        tenantId: id,
        fromPlan: existing.plan,
        toPlan: plan,
        changedBy: session?.name ?? "Admin",
        reason: "Manuel plan değişikliği",
      },
    });
  }

  // Not güncelleme
  if (adminNotes !== undefined) {
    updateData.adminNotes = adminNotes || null;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "Güncellenecek alan yok." },
      { status: 400 }
    );
  }

  const tenant = await prisma.tenant.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      plan: true,
      proStartedAt: true,
      proExpiresAt: true,
      adminNotes: true,
    },
  });

  return NextResponse.json({ tenant });
}
