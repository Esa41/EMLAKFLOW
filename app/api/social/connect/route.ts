import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { metaAuthUrl } from "@/lib/social";

/** GET — Meta OAuth başlat */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/social/callback`;
  const state = Buffer.from(
    JSON.stringify({ tenantId: session.tenantId, userId: session.userId }),
  ).toString("base64url");

  try {
    const url = metaAuthUrl(state, redirectUri);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "OAuth yapılandırması eksik." },
      { status: 503 },
    );
  }
}
