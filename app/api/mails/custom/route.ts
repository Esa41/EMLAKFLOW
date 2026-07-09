import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { officeBrand } from "@/lib/office-brand";
import { sendCustomEmail } from "@/lib/marketing-mailer";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/mails/custom — E-postalar sekmesinden serbest gönderim.
 * Body: { to, toName?, subject, message }
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  // Hesap ele geçirilse bile toplu spam atılamasın
  const limited = enforceRateLimit(req, "custom-mail", {
    limit: 20,
    windowMs: 60 * 60_000,
  });
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const to = String(body?.to ?? "").trim().toLowerCase();
  const toName = body?.toName ? String(body.toName).trim() : undefined;
  const subject = String(body?.subject ?? "").trim().slice(0, 150);
  const message = String(body?.message ?? "").trim().slice(0, 5000);

  if (!to.includes("@") || !subject || !message) {
    return NextResponse.json(
      { error: "Geçerli e-posta, konu ve mesaj gerekli." },
      { status: 400 },
    );
  }

  const office = await officeBrand(session.tenantId);
  if (!office) return NextResponse.json({ error: "Ofis bulunamadı" }, { status: 404 });

  const { sent } = await sendCustomEmail(to, toName, subject, message, office.brand, {
    tenantId: session.tenantId,
    kind: "custom",
  });

  if (!sent) {
    return NextResponse.json(
      { error: "E-posta gönderilemedi — tekrar deneyin." },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true });
}
