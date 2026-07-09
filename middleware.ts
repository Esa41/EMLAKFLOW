import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

// /api/chat: vitrin ziyaretçisi (auth yok) mesajlarını okuyabilsin diye public.
// /api/chat/team kendi içinde getSession ile korunur (auth yoksa 401 döner).
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/sifremi-unuttum",
  "/sifre-sifirla",
  "/platform",
  "/api/register",
  "/api/auth",
  "/api/feed",
  "/api/chat",
  "/api/ofis",
  "/api/social/callback",
  "/api/e",
  "/api/cron",
  "/api/admin/webhooks",
  "/ofis",
  "/galeri",
  "/blog",
  "/robots.txt",
  "/sitemap.xml",
  // Dosya-tabanlı metadata görselleri — crawler'lar auth'suz erişebilmeli
  "/opengraph-image",
  "/twitter-image",
  "/icon",
  "/apple-icon",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) =>
    p === "/" ? pathname === "/" : pathname.startsWith(p),
  );

  // Giriş yapmış kullanıcı ana sayfada landing görmez — panele gider
  if (req.auth && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  // Eski /platform yönlendirmesi
  if (pathname === "/platform") {
    const dest = req.auth ? "/dashboard" : "/";
    return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
  }

  if (!req.auth && !isPublic) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  if (req.auth && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }
  if (pathname === "/takvim" || pathname.startsWith("/takvim/")) {
    const url = new URL("/ajanda", req.nextUrl.origin);
    req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|svg|webp)).*)",
  ],
};
