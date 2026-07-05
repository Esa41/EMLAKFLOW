import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { presignUpload } from "@/lib/r2";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_NAME = 100;

/** Body: { fileName, contentType } → { uploadUrl, key } */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.fileName || !body?.contentType) {
    return NextResponse.json({ error: "fileName ve contentType zorunlu" }, { status: 400 });
  }
  if (!ALLOWED.includes(body.contentType)) {
    return NextResponse.json(
      { error: "Sadece JPEG, PNG veya WebP yüklenebilir." },
      { status: 415 }
    );
  }

  const ext = String(body.fileName).split(".").pop()?.toLowerCase().slice(0, 5) ?? "jpg";
  const safe = String(body.fileName)
    .slice(0, MAX_NAME)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 24);
  const key = `${session.tenantId}/listings/${Date.now()}-${safe}.${ext}`;

  const uploadUrl = await presignUpload(key, body.contentType);
  return NextResponse.json({ uploadUrl, key });
}
