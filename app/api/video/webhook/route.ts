import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { generateDroneVideoFromImage } from "@/lib/vertex-veo";

export const runtime = "nodejs";
/** Veo üretimi 3–6 dk sürebilir — Vercel Pro planında maksimum süre */
export const maxDuration = 300;

type WebhookPayload = {
  listingId?: string;
  tenantId?: string;
  imageUrl?: string;
};

async function verifyQStashSignature(
  req: Request,
  rawBody: string,
): Promise<boolean> {
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY?.trim();
  const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY?.trim();

  if (!currentKey || !nextKey) {
    console.warn(
      "[video/webhook] QStash imza anahtarları tanımlı değil — geliştirme modunda atlanıyor.",
    );
    return process.env.NODE_ENV === "development";
  }

  const signature = req.headers.get("upstash-signature");
  if (!signature) return false;

  const receiver = new Receiver({
    currentSigningKey: currentKey,
    nextSigningKey: nextKey,
  });

  return receiver.verify({
    signature,
    body: rawBody,
  });
}

async function markListingFailed(listingId: string, tenantId?: string) {
  const where = tenantId ? { id: listingId, tenantId } : { id: listingId };
  await prisma.listing.update({
    where,
    data: { aiVideoStatus: "FAILED" },
  });
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  if (!(await verifyQStashSignature(req, rawBody))) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const listingId = payload.listingId?.trim();
  const tenantId = payload.tenantId?.trim();
  const imageUrl = payload.imageUrl?.trim();

  if (!listingId || !imageUrl) {
    return NextResponse.json(
      { error: "listingId ve imageUrl zorunlu" },
      { status: 400 },
    );
  }

  const listing = await prisma.listing.findFirst({
    where: tenantId ? { id: listingId, tenantId } : { id: listingId },
    select: { id: true, tenantId: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "İlan bulunamadı" }, { status: 404 });
  }

  try {
    const video = await generateDroneVideoFromImage(imageUrl);

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (!blobToken) {
      throw new Error("BLOB_READ_WRITE_TOKEN tanımlı değil.");
    }

    const filename = `ai-drone/${listing.tenantId}/${listingId}-${Date.now()}.mp4`;
    const blob = await put(filename, video.buffer, {
      access: "public",
      contentType: video.mimeType,
      token: blobToken,
    });

    await prisma.listing.update({
      where: { id: listing.id },
      data: {
        aiDroneVideoUrl: blob.url,
        aiVideoStatus: "COMPLETED",
      },
    });

    return NextResponse.json({
      ok: true,
      status: "COMPLETED",
      videoUrl: blob.url,
    });
  } catch (err) {
    console.error("[video/webhook]", err);

    try {
      await markListingFailed(listing.id, listing.tenantId);
    } catch (updateErr) {
      console.error("[video/webhook] FAILED güncellenemedi:", updateErr);
    }

    const message =
      err instanceof Error ? err.message : "Video üretimi başarısız";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Yalnızca POST" }, { status: 405 });
}
