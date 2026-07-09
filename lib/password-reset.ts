import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

/**
 * Stateless şifre sıfırlama token'ı — DB tablosu gerektirmez.
 * Tek kullanımlık garanti: token, mevcut passwordHash'in parmak izini taşır;
 * şifre değiştiği an parmak izi tutmaz ve token geçersizleşir. 30 dk geçerli.
 */

const PURPOSE = "pwreset";
const TTL = "30m";

function secret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "emlakflow-dev-secret",
  );
}

/** passwordHash → kısa parmak izi (token içine ham hash koymamak için). */
export function passwordFingerprint(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

export async function createResetToken(
  userId: string,
  passwordHash: string,
): Promise<string> {
  return new SignJWT({ purpose: PURPOSE, fp: passwordFingerprint(passwordHash) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(secret());
}

/**
 * Token'ı doğrular; geçerliyse userId + beklenen parmak izini döner.
 * Çağıran taraf, kullanıcının GÜNCEL passwordHash parmak iziyle karşılaştırır
 * (eşleşmiyorsa şifre zaten değişmiş → token kullanılmış sayılır).
 */
export async function verifyResetToken(
  token: string,
): Promise<{ userId: string; fp: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== PURPOSE) return null;
    const userId = payload.sub;
    const fp = payload.fp;
    if (typeof userId !== "string" || !userId) return null;
    if (typeof fp !== "string" || !fp) return null;
    return { userId, fp };
  } catch {
    return null;
  }
}
