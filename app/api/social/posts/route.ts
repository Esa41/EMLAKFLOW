import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);

  const posts = await db.socialPost.findMany({
    orderBy: { publishedAt: "desc" },
    include: {
      listing: { select: { id: true, refCode: true, title: true } },
      account: { select: { username: true, platform: true } },
    },
  });

  return NextResponse.json({ posts });
}

/** Body: { url, platform?, kind?, caption?, listingId?, publishedAt? } */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);
  const body = await req.json().catch(() => null);

  if (!body?.url?.trim()) {
    return NextResponse.json({ error: "url zorunlu." }, { status: 400 });
  }

  const post = await db.socialPost.create({
    data: {
      tenantId: session.tenantId,
      platform: body.platform ?? "INSTAGRAM",
      url: body.url.trim(),
      kind: body.kind ?? "video",
      caption: body.caption || null,
      listingId: body.listingId || null,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
    },
    include: {
      listing: { select: { id: true, refCode: true, title: true } },
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
