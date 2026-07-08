import { NextResponse } from "next/server";

/**
 * In-memory sliding-window rate limiter — brute-force ve spam koruması.
 *
 * Bellek lambda instance'ına özeldir: Vercel'de eşzamanlı instance'lar ayrı
 * sayaç tutar, yani gerçek limit "limit × instance sayısı"na kadar gevşer.
 * Login/register gibi düşük trafikli uçlar için bu yeterli bir ilk katmandır;
 * dağıtık kesinlik gerekirse @upstash/ratelimit'e geçiş planı
 * docs/seo-buyume-plani.md'de.
 */

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

// Bellek şişmesin: 10 dakikada bir süresi dolmuş kayıtları temizle
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;
let lastSweep = Date.now();

function sweep(windowMs: number) {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  /** Pencere sıfırlanana kadar saniye — Retry-After başlığı için */
  retryAfterSec: number;
};

/** `key` başına `windowMs` içinde en fazla `limit` istek. */
export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  sweep(windowMs);

  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return {
    ok: true,
    remaining: limit - bucket.timestamps.length,
    retryAfterSec: 0,
  };
}

/** Vercel/proxy arkasında gerçek istemci IP'si. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Route handler başında çağır; limit aşıldıysa hazır 429 yanıtı döner.
 *
 *   const limited = enforceRateLimit(req, "login", { limit: 10, windowMs: 60_000 });
 *   if (limited) return limited;
 */
export function enforceRateLimit(
  req: Request,
  scope: string,
  opts: { limit: number; windowMs: number },
): NextResponse | null {
  const result = rateLimit(`${scope}:${clientIp(req)}`, opts);
  if (result.ok) return null;
  return NextResponse.json(
    { error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSec) },
    },
  );
}
