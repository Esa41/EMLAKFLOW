import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

// /api/chat: vitrin ziyaretçisi (auth yok) mesajlarını okuyabilsin diye public.
// /api/chat/team kendi içinde getSession ile korunur (auth yoksa 401 döner).
const PUBLIC_PATHS = ["/login", "/register", "/api/register", "/api/auth", "/api/feed", "/api/chat", "/api/e", "/api/cron", "/ofis"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!req.auth && !isPublic) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  if (req.auth && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|webp)).*)"],
};
