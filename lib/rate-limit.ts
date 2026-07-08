import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function redisOrNull(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = redisOrNull();

function makeLimiter(
  prefix: string,
  requests: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1],
) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix,
    analytics: true,
  });
}

export const loginLimiter = makeLimiter("rl:login", 5, "15 m");
export const apiLimiter = makeLimiter("rl:api", 60, "1 m");
export const analyticsLimiter = makeLimiter("rl:analytics", 120, "1 m");
export const leadLimiter = makeLimiter("rl:lead", 10, "1 m");

export type RateLimitResult = { ok: boolean; remaining: number };

export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<RateLimitResult> {
  if (!limiter) return { ok: true, remaining: 999 };
  const { success, remaining } = await limiter.limit(identifier);
  return { ok: success, remaining };
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}
