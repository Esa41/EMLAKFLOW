import { NextResponse } from "next/server";
import type { Ratelimit } from "@upstash/ratelimit";
import { checkRateLimit, clientIp } from "./rate-limit";

export async function withRateLimit(
  req: Request,
  limiter: Ratelimit | null,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  const ip = clientIp(req);
  const { ok, remaining } = await checkRateLimit(limiter, ip);
  if (!ok) {
    return NextResponse.json(
      { error: "Çok fazla istek. Lütfen bekleyin." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Remaining": String(remaining),
        },
      },
    );
  }
  const res = await handler();
  res.headers.set("X-RateLimit-Remaining", String(remaining));
  return res;
}
