import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserIsSuperAdmin } from "@/lib/plans";
import { getSession } from "@/lib/auth";

const ALLOWED_PLANS = ["free", "trial", "starter", "pro"];

const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/** Host'a indirger. null = boş; false = geçersiz. */
function normalizeDomain(raw: string | null | undefined): string | null | false {
  if (raw === null || raw === undefined) return null;
  let d = String(raw).trim().toLowerCase();
  if (!d) return null;
  d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
  if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(d) || !d.includes(".")) {
    return false;
  }
  return d;
}

function normalizeHex(raw: string | null | undefined): string | null | false {
  if (raw === null || raw === undefined) return null;
  const v = String(raw).trim();
  if (!v) return null;
  const withHash = v.startsWith("#") ? v : `#${v}`;
  if (!HEX_COLOR.test(withHash)) return false;
  return withHash.toLowerCase();
}

const WHITE_LABEL_SELECT = {
  customDomain: true,
  brandName: true,
  logoUrl: true,
  primaryColor: true,
  brandColor: true,
} as const;

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
      ...WHITE_LABEL_SELECT,
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

// Plan, Pro bitiş, admin notları veya white-label ayarlarını güncelle
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await currentUserIsSuperAdmin())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const plan = body.plan as string | undefined;
  const adminNotes = body.adminNotes as string | undefined;
  const hasProExpiresAt = "proExpiresAt" in body;
  const proExpiresAtRaw = body.proExpiresAt as string | null | undefined;

  const hasWhiteLabel =
    "customDomain" in body ||
    "brandName" in body ||
    "logoUrl" in body ||
    "primaryColor" in body;

  const existing = await prisma.tenant.findUnique({
    where: { id },
    select: {
      id: true,
      plan: true,
      proExpiresAt: true,
      proStartedAt: true,
    },
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
    customDomain?: string | null;
    brandName?: string | null;
    logoUrl?: string | null;
    primaryColor?: string | null;
    brandColor?: string | null;
  } = {};

  // Plan değişikliği
  if (plan && ALLOWED_PLANS.includes(plan) && plan !== existing.plan) {
    updateData.plan = plan;

    if (plan === "pro") {
      updateData.proStartedAt = new Date();
    } else {
      updateData.proStartedAt = null;
      updateData.proExpiresAt = null;
    }

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

  // Mutlak Pro bitiş tarihi
  if (hasProExpiresAt) {
    if (proExpiresAtRaw === null || proExpiresAtRaw === "") {
      updateData.proExpiresAt = null;
      await prisma.planChangeLog.create({
        data: {
          tenantId: id,
          fromPlan: existing.plan,
          toPlan: updateData.plan ?? existing.plan,
          changedBy: session?.name ?? "Admin",
          reason: "Pro bitiş tarihi temizlendi",
          expiresAt: null,
        },
      });
    } else if (typeof proExpiresAtRaw === "string") {
      const parsed = new Date(proExpiresAtRaw);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: "Geçersiz bitiş tarihi." },
          { status: 400 },
        );
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(proExpiresAtRaw)) {
        parsed.setHours(23, 59, 59, 999);
      }
      updateData.proExpiresAt = parsed;
      if ((updateData.plan ?? existing.plan) === "pro" && !existing.proStartedAt) {
        updateData.proStartedAt = new Date();
      }
      if (!updateData.plan && existing.plan !== "pro") {
        updateData.plan = "pro";
      }
      await prisma.planChangeLog.create({
        data: {
          tenantId: id,
          fromPlan: existing.plan,
          toPlan: updateData.plan ?? existing.plan,
          changedBy: session?.name ?? "Admin",
          reason: `Pro bitiş tarihi ayarlandı: ${parsed.toLocaleDateString("tr-TR")}`,
          expiresAt: parsed,
        },
      });
    }
  }

  if (adminNotes !== undefined) {
    updateData.adminNotes = adminNotes || null;
  }

  // White-label (yalnızca super-admin bu endpoint'e erişir)
  if (hasWhiteLabel) {
    if ("customDomain" in body) {
      const raw = body.customDomain as string | null;
      if (raw === null || String(raw).trim() === "") {
        updateData.customDomain = null;
      } else {
        const normalized = normalizeDomain(String(raw));
        if (normalized === false) {
          return NextResponse.json(
            { error: "Geçersiz alan adı. Örn: www.emlakofisi.com" },
            { status: 400 },
          );
        }
        updateData.customDomain = normalized;
      }
    }

    if ("brandName" in body) {
      const n = body.brandName === null ? "" : String(body.brandName ?? "").trim();
      updateData.brandName = n ? n.slice(0, 80) : null;
    }

    if ("logoUrl" in body) {
      const u = body.logoUrl === null ? "" : String(body.logoUrl ?? "").trim();
      if (!u) {
        updateData.logoUrl = null;
      } else if (!/^https?:\/\//i.test(u)) {
        return NextResponse.json(
          { error: "Logo URL http(s) ile başlamalı." },
          { status: 400 },
        );
      } else {
        updateData.logoUrl = u.slice(0, 500);
      }
    }

    if ("primaryColor" in body) {
      const color = normalizeHex(body.primaryColor as string | null);
      if (color === false) {
        return NextResponse.json(
          { error: "Geçersiz renk kodu. Örn: #1e5b3e" },
          { status: 400 },
        );
      }
      updateData.primaryColor = color;
      // Vitrin teması brandColor kullandığı için senkron tut
      updateData.brandColor = color;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "Güncellenecek alan yok." },
      { status: 400 }
    );
  }

  try {
    const tenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        plan: true,
        proStartedAt: true,
        proExpiresAt: true,
        adminNotes: true,
        ...WHITE_LABEL_SELECT,
      },
    });
    return NextResponse.json({ tenant });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "Bu alan adı başka bir ofiste kayıtlı." },
        { status: 409 },
      );
    }
    console.error("[admin/tenants PATCH]", err);
    return NextResponse.json({ error: "Güncellenemedi." }, { status: 500 });
  }
}
