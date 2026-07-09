import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createResetToken } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { getBaseUrl } from "@/lib/url";

/**
 * POST /api/auth/forgot-password — Body: { email }
 * Kullanıcı olsa da olmasa da AYNI yanıt döner (hesap keşfini engeller).
 * Not: App Router'da bu statik rota, /api/auth/[...nextauth] catch-all'ından
 * önceliklidir; NextAuth ile çakışmaz.
 */
export async function POST(req: Request) {
  // Brute-force/enum koruması: IP başına 10 dakikada 3 istek
  const limited = enforceRateLimit(req, "forgot-password", {
    limit: 3,
    windowMs: 10 * 60_000,
  });
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Geçerli bir e-posta girin." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  let devLink: string | undefined;
  if (user) {
    const token = await createResetToken(user.id, user.passwordHash);
    const link = `${getBaseUrl()}/sifre-sifirla?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail(email, link);
    // Yalnızca lokal geliştirmede: e-posta servisi yokken akışı test edebilmek
    // için link yanıtta döner. Production'da ASLA dönmez.
    if (process.env.NODE_ENV !== "production") devLink = link;
  }

  return NextResponse.json({
    ok: true,
    message:
      "Bu e-posta sistemde kayıtlıysa şifre sıfırlama bağlantısı gönderildi.",
    ...(devLink ? { devLink } : {}),
  });
}
