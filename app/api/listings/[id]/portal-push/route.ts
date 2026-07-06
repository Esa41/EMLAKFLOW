import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pushListingToPortal, type FeedPortal } from "@/lib/feed";

/** POST /api/listings/[id]/portal-push — partner API stub (Faz 4) */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const portal = (body.portal ?? "sahibinden") as FeedPortal;

  const result = await pushListingToPortal(portal, id);
  return NextResponse.json(result, { status: 501 });
}
