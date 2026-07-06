import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  exchangeMetaCode,
  findInstagramAccount,
  fetchInstagramMedia,
} from "@/lib/social";

/** Meta OAuth callback */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const stateRaw = req.nextUrl.searchParams.get("state");
  const err = req.nextUrl.searchParams.get("error");

  if (err || !code || !stateRaw) {
    return NextResponse.redirect(new URL("/icerik?error=oauth", req.nextUrl.origin));
  }

  let tenantId: string;
  try {
    const state = JSON.parse(Buffer.from(stateRaw, "base64url").toString());
    tenantId = state.tenantId;
  } catch {
    return NextResponse.redirect(new URL("/icerik?error=state", req.nextUrl.origin));
  }

  const redirectUri = `${req.nextUrl.origin}/api/social/callback`;

  try {
    const tokenRes = await exchangeMetaCode(code, redirectUri);
    const ig = await findInstagramAccount(tokenRes.access_token);
    if (!ig) {
      return NextResponse.redirect(
        new URL("/icerik?error=no_instagram", req.nextUrl.origin),
      );
    }

    const expiresAt = tokenRes.expires_in
      ? new Date(Date.now() + tokenRes.expires_in * 1000)
      : null;

    await prisma.socialAccount.upsert({
      where: {
        tenantId_platform_externalId: {
          tenantId,
          platform: "INSTAGRAM",
          externalId: ig.igUserId,
        },
      },
      create: {
        tenantId,
        platform: "INSTAGRAM",
        externalId: ig.igUserId,
        username: ig.username,
        displayName: ig.username,
        accessToken: tokenRes.access_token,
        expiresAt,
        pageId: ig.pageId,
      },
      update: {
        username: ig.username,
        accessToken: tokenRes.access_token,
        expiresAt,
        pageId: ig.pageId,
        lastSyncedAt: new Date(),
      },
    });

    // İlk medya içe aktarımı
    const media = await fetchInstagramMedia(ig.igUserId, tokenRes.access_token);
    const account = await prisma.socialAccount.findFirst({
      where: { tenantId, platform: "INSTAGRAM", externalId: ig.igUserId },
    });

    for (const m of media) {
      if (!m.permalink) continue;
      await prisma.socialPost.upsert({
        where: {
          tenantId_platform_externalId: {
            tenantId,
            platform: "INSTAGRAM",
            externalId: m.id,
          },
        },
        create: {
          tenantId,
          accountId: account?.id,
          platform: "INSTAGRAM",
          externalId: m.id,
          url: m.permalink,
          kind: m.media_type === "VIDEO" ? "video" : "post",
          caption: m.caption ?? null,
          thumbnailUrl: m.thumbnail_url ?? m.media_url ?? null,
          publishedAt: m.timestamp ? new Date(m.timestamp) : null,
        },
        update: {
          caption: m.caption ?? null,
          thumbnailUrl: m.thumbnail_url ?? m.media_url ?? null,
        },
      });
    }

    return NextResponse.redirect(new URL("/icerik?connected=1", req.nextUrl.origin));
  } catch {
    return NextResponse.redirect(new URL("/icerik?error=token", req.nextUrl.origin));
  }
}
