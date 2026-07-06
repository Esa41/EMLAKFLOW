import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

/**
 * Vitrin son kullanıcı (alıcı/kiracı) oturumu — emlakçı NextAuth oturumundan
 * tamamen bağımsız, jose ile imzalanan hafif JWT cookie.
 * Token tenantId taşır; başka ofisin vitrininde geçersizdir.
 */

const COOKIE = "ef_site_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 gün

function secret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "emlakflow-dev-secret",
  );
}

export interface SiteSession {
  siteUserId: string;
  tenantId: string;
}

export async function createSiteSession(
  siteUserId: string,
  tenantId: string,
): Promise<void> {
  const token = await new SignJWT({ siteUserId, tenantId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSiteSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** Oturumu okur; tenantId verilirse o ofise ait olduğunu da doğrular. */
export async function getSiteSession(
  tenantId?: string,
): Promise<SiteSession | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const s: SiteSession = {
      siteUserId: String(payload.siteUserId ?? ""),
      tenantId: String(payload.tenantId ?? ""),
    };
    if (!s.siteUserId || !s.tenantId) return null;
    if (tenantId && s.tenantId !== tenantId) return null;
    return s;
  } catch {
    return null;
  }
}

/** Oturumdaki SiteUser kaydını döner (yoksa/başka ofisinse null). */
export async function getSiteUser(tenantId: string) {
  const s = await getSiteSession(tenantId);
  if (!s) return null;
  return prisma.siteUser.findFirst({
    where: { id: s.siteUserId, tenantId },
    select: { id: true, name: true, email: true, phone: true },
  });
}
