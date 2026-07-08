import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { EventType } from "@prisma/client";

// Vitrin funnel olay toplama ucu (public, sendBeacon uyumlu).
// Body: { t: tenantId, l?: listingId, e: EventType, s?: sessionId }
// Tek INSERT'ten fazlasını yapmaz — vitrin performansını etkilememeli.

const VALID: Set<string> = new Set(["IMPRESSION", "VIEW", "CLICK", "CONTACT", "CHAT"]);

// Basit bot filtresi: bilinen crawler UA'ları sayma (analitiği kirletir).
const BOT_RE = /bot|crawler|spider|crawling|facebookexternalhit|whatsapp|telegram|preview|curl|wget/i;

export async function POST(req: NextRequest) {
  let body: { t?: string; l?: string; e?: string; s?: string; d?: number; u?: number };
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const { t, l, e, s, d, u } = body;
  if (!t || !e || !VALID.has(e)) return new NextResponse(null, { status: 400 });

  const ua = req.headers.get("user-agent") ?? "";
  if (BOT_RE.test(ua)) return new NextResponse(null, { status: 204 });

  try {
    if (u === 1 && e === "VIEW" && l && s) {
      // Kalma süresi güncellemesi: bu oturumun bu ilandaki son VIEW kaydına yaz
      const last = await prisma.listingEvent.findFirst({
        where: { tenantId: t, listingId: l, sessionId: s, type: "VIEW" },
        orderBy: { createdAt: "desc" },
        select: { id: true, durationMs: true },
      });
      if (last) {
        const dur = Math.min(Math.max(Number(d) || 0, 0), 3_600_000); // 0–60 dk sınırı
        if (dur > (last.durationMs ?? 0)) {
          await prisma.listingEvent.update({
            where: { id: last.id },
            data: { durationMs: dur },
          });
        }
      }
    } else {
      await prisma.listingEvent.create({
        data: {
          tenantId: t,
          listingId: l || null,
          type: e as EventType,
          sessionId: s?.slice(0, 40) || null,
          source: "vitrin",
        },
      });
    }
  } catch {
    // Geçersiz tenant/listing id (FK hatası) → sessizce yut; vitrin akışı asla bozulmaz.
  }

  return new NextResponse(null, { status: 204 });
}
