import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { passwordFingerprint, verifyResetToken } from "@/lib/password-reset";

/**
 * POST /api/auth/reset-password — Body: { token, password }
 * Token 30 dk geçerli ve tek kullanımlık: içindeki parmak izi kullanıcının
 * GÜNCEL passwordHash'iyle eşleşmiyorsa (şifre zaten değişmiş) reddedilir.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "reset-password", {
    limit: 5,
    windowMs: 10 * 60_000,
  });
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const token = String(body?.token ?? "");
  const password = String(body?.password ?? "");

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Şifre en az 8 karakter olmalı." },
      { status: 400 },
    );
  }

  const parsed = token ? await verifyResetToken(token) : null;
  if (!parsed) {
    return NextResponse.json(
      { error: "Bağlantı geçersiz veya süresi dolmuş. Yeni bağlantı isteyin." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: { id: true, passwordHash: true },
  });
  if (!user || passwordFingerprint(user.passwordHash) !== parsed.fp) {
    return NextResponse.json(
      { error: "Bağlantı geçersiz veya süresi dolmuş. Yeni bağlantı isteyin." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hash(password, 10) },
  });

  return NextResponse.json({ ok: true });
}
