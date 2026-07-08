import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { buildCspHeader } from "@/lib/security-headers";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/platform",
  "/api/register",
  "/api/auth",
  "/api/feed",
  "/api/chat",
  "/api/ofis",
  "/api/social/callback",
  "/api/e",
  "/api/cron",
  "/ofis",
  "/galeri",
  "/robots.txt",
  "/sitemap.xml",
];

function applySecurityHeaders(res: NextResponse, nonce: string) {
  res.headers.set("Content-Security-Policy", buildCspHeader(nonce));
  return res;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const isPublic = PUBLIC_PATHS.some((p) =>
    p === "/" ? pathname === "/" : pathname.startsWith(p),
  );

  if (req.auth && pathname === "/") {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin)),
      nonce,
    );
  }

  if (pathname === "/platform") {
    const dest = req.auth ? "/dashboard" : "/";
    return applySecurityHeaders(
      NextResponse.redirect(new URL(dest, req.nextUrl.origin)),
      nonce,
    );
  }

  if (!req.auth && !isPublic) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return applySecurityHeaders(NextResponse.redirect(url), nonce);
  }

  if (req.auth && (pathname === "/login" || pathname === "/register")) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin)),
      nonce,
    );
  }

  if (pathname === "/takvim" || pathname.startsWith("/takvim/")) {
    const url = new URL("/ajanda", req.nextUrl.origin);
    req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));
    return applySecurityHeaders(NextResponse.redirect(url), nonce);
  }

  return applySecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    nonce,
  );
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|svg|webp)).*)",
  ],
};
