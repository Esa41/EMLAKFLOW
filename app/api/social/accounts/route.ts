import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const db = forTenant(session.tenantId);

  const accounts = await db.socialAccount.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      platform: true,
      username: true,
      displayName: true,
      lastSyncedAt: true,
      expiresAt: true,
    },
  });

  return NextResponse.json({ accounts });
}
