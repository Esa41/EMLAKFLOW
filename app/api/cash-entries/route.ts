import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

const CATEGORIES = [
  "komisyon-disi",
  "reklam",
  "kira",
  "ofis",
  "maas",
  "vergi",
  "diger",
] as const;

/**
 * POST /api/cash-entries — manuel gelir/gider ekle (OWNER/BROKER).
 * Body: { type: "income"|"expense", amount, title, note?, category?, occurredAt? }
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!["OWNER", "BROKER"].includes(session.role)) {
    return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const type = body?.type === "expense" ? "expense" : body?.type === "income" ? "income" : null;
  const amount = Number(body?.amount);
  const title = String(body?.title ?? "").trim().slice(0, 120);
  const note = body?.note ? String(body.note).trim().slice(0, 500) : null;
  const categoryRaw = body?.category ? String(body.category).trim() : null;
  const category =
    categoryRaw && (CATEGORIES as readonly string[]).includes(categoryRaw)
      ? categoryRaw
      : categoryRaw
        ? "diger"
        : null;

  let occurredAt = new Date();
  if (body?.occurredAt) {
    const d = new Date(String(body.occurredAt));
    if (!Number.isNaN(d.getTime())) occurredAt = d;
  }

  if (!type || !title || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Tür, başlık ve pozitif tutar gerekli." },
      { status: 400 },
    );
  }

  const db = forTenant(session.tenantId);
  const entry = await db.cashEntry.create({
    data: {
      tenantId: session.tenantId,
      type,
      amount,
      title,
      note,
      category,
      occurredAt,
      createdById: session.userId,
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
