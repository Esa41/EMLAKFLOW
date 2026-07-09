import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import {
  CUSTOM_DOMAIN_BLOCKED_PREFIXES,
  isPlatformHost,
  normalizeHost,
} from "@/lib/platform-host";

const { auth } = NextAuth(authConfig);

// /api/chat: vitrin ziyaretçisi (auth yok) mesajlarını okuyabilsin diye public.
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
  "/api/domain-lookup",
  "/api/social/callback",
  "/api/e",
  "/api/cron",
  "/api/admin/webhooks",
  "/ofis",
  "/galeri",
  "/blog",
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image",
  "/twitter-image",
  "/icon",
  "/apple-icon",
];

type DomainLookup = { slug: string | null };

async function lookupSlugByHost(
  origin: string,
  host: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${origin}/api/domain-lookup?host=${encodeURIComponent(host)}`,
      {
        headers: { Accept: "application/json" },
        // Edge fetch — kısa timeout yok; Vercel edge cache s-maxage=60
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as DomainLookup;
    return data.slug || null;
  } catch {
    return null;
  }
}

function rewriteToOfis(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: any,
  slug: string,
  pathname: string,
) {
  const url = req.nextUrl.clone();

  if (pathname === "/" || pathname === "") {
    url.pathname = `/ofis/${slug}`;
  } else if (pathname.startsWith("/ilan/")) {
    url.pathname = `/ofis/${slug}${pathname}`;
  } else if (pathname === "/favorilerim" || pathname.startsWith("/favorilerim/")) {
    url.pathname = `/ofis/${slug}${pathname}`;
  } else if (pathname.startsWith("/ofis/") || pathname.startsWith("/galeri/")) {
    // Zaten ofis yolu — dokunma
    return null;
  } else if (pathname.startsWith("/api/")) {
    // API'ler slug ile çalışır; rewrite yok
    return null;
  } else {
    // Bilinmeyen yol → vitrin ana sayfa
    url.pathname = `/ofis/${slug}`;
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-showcase-slug", slug);
  requestHeaders.set("x-showcase-custom-domain", "1");
  requestHeaders.set("x-showcase-host", normalizeHost(req.headers.get("host")));

  return NextResponse.rewrite(url, {
    request: { headers: requestHeaders },
  });
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const host = normalizeHost(req.headers.get("host"));
  const customHost = host && !isPlatformHost(host);

  // ── Custom domain: vitrin rewrite ──
  if (customHost) {
    // CRM / auth yollarını platforma yönlendir
    if (
      CUSTOM_DOMAIN_BLOCKED_PREFIXES.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
      )
    ) {
      const platform =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
        "https://emlakflow.app";
      return NextResponse.redirect(new URL(pathname, platform));
    }

    const slug = await lookupSlugByHost(req.nextUrl.origin, host);
    if (!slug) {
      return new NextResponse("Bu alan adı EmlakFlow'ta tanımlı değil.", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    const rewritten = rewriteToOfis(req, slug, pathname);
    if (rewritten) return rewritten;
    // /api/* vb. — public devam
    return NextResponse.next();
  }

  // ── Platform host: mevcut auth akışı ──
  const isPublic = PUBLIC_PATHS.some((p) =>
    p === "/" ? pathname === "/" : pathname.startsWith(p),
  );

  if (req.auth && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

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
