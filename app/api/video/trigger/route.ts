import { NextResponse } from "next/server";
import { Client } from "@upstash/qstash";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { buildMapboxStaticImageUrl } from "@/lib/mapbox-static";
import { getBaseUrl } from "@/lib/url";

export const runtime = "nodejs";

type TriggerBody = {
  listingId?: string;
  lat?: number;
  lng?: number;
};

function parseCoords(body: TriggerBody): { lat: number; lng: number } | null {
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  let body: TriggerBody;
  try {
    body = (await req.json()) as TriggerBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const listingId = body.listingId?.trim();
  if (!listingId) {
    return NextResponse.json({ error: "listingId zorunlu" }, { status: 400 });
  }

  const coords = parseCoords(body);
  if (!coords) {
    return NextResponse.json(
      { error: "Geçerli lat ve lng koordinatları gerekli" },
      { status: 400 },
    );
  }

  const db = forTenant(session.tenantId);
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { id: true, aiVideoStatus: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "İlan bulunamadı" }, { status: 404 });
  }

  if (listing.aiVideoStatus === "PROCESSING") {
    return NextResponse.json(
      { error: "Video zaten üretiliyor", status: "PROCESSING" },
      { status: 409 },
    );
  }

  const qstashToken = process.env.QSTASH_TOKEN?.trim();
  if (!qstashToken) {
    return NextResponse.json(
      { error: "QStash yapılandırması eksik" },
      { status: 500 },
    );
  }

  try {
    const imageUrl = buildMapboxStaticImageUrl({
      lat: coords.lat,
      lng: coords.lng,
      zoom: 16,
      pitch: 60,
      bearing: 45,
      width: 1280,
      height: 720,
      retina: true,
    });

    await db.listing.update({
      where: { id: listingId },
      data: { aiVideoStatus: "PROCESSING", aiDroneVideoUrl: null },
    });

    const client = new Client({
      token: qstashToken,
      baseUrl: process.env.QSTASH_URL?.trim() || undefined,
    });
    const webhookUrl = `${getBaseUrl()}/api/video/webhook`;

    await client.publishJSON({
      url: webhookUrl,
      body: {
        listingId,
        tenantId: session.tenantId,
        imageUrl,
      },
      retries: 2,
    });

    return NextResponse.json({
      ok: true,
      status: "PROCESSING",
      message: "AI drone videosu kuyruğa alındı.",
    });
  } catch (err) {
    console.error("[video/trigger]", err);

    await db.listing
      .update({
        where: { id: listingId },
        data: { aiVideoStatus: "FAILED" },
      })
      .catch(() => {});

    const message =
      err instanceof Error ? err.message : "Video tetikleme başarısız";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Yalnızca POST" }, { status: 405 });
}
