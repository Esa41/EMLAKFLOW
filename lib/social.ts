/**
 * Sosyal medya entegrasyonu — Meta (Instagram/Facebook) Graph API.
 * Token'lar SocialAccount tablosunda saklanır; senkron cron ile metrik çekilir.
 */

const GRAPH = "https://graph.facebook.com/v21.0";

export interface MetaTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface MetaMediaInsight {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
}

/** OAuth authorization URL (Instagram Business via Facebook Login). */
export function metaAuthUrl(state: string, redirectUri: string): string {
  const appId = process.env.META_APP_ID;
  if (!appId) throw new Error("META_APP_ID tanımlı değil.");
  const scopes = [
    "instagram_basic",
    "instagram_manage_insights",
    "pages_show_list",
    "pages_read_engagement",
  ].join(",");
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: "code",
    state,
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params}`;
}

export async function exchangeMetaCode(
  code: string,
  redirectUri: string,
): Promise<MetaTokenResponse> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new Error("Meta OAuth yapılandırması eksik.");

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`${GRAPH}/oauth/access_token?${params}`);
  if (!res.ok) throw new Error("Meta token alınamadı.");
  const short = (await res.json()) as MetaTokenResponse;

  // Kısa ömürlü token (~1 saat) → uzun ömürlü token (~60 gün).
  // Başarısız olursa akışı bozmadan kısa ömürlü token ile devam edilir.
  const long = await exchangeForLongLivedToken(short.access_token).catch(
    () => null,
  );
  return long ?? short;
}

/** Kısa ömürlü kullanıcı token'ını ~60 günlük uzun ömürlü token'a çevirir. */
export async function exchangeForLongLivedToken(
  shortToken: string,
): Promise<MetaTokenResponse> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new Error("Meta OAuth yapılandırması eksik.");

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortToken,
  });
  const res = await fetch(`${GRAPH}/oauth/access_token?${params}`);
  if (!res.ok) throw new Error("Uzun ömürlü token alınamadı.");
  return res.json();
}

async function graphGet<T>(path: string, token: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${GRAPH}${path}${sep}access_token=${token}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph API: ${err}`);
  }
  return res.json();
}

/** Bağlı Facebook sayfalarından Instagram Business hesabını bul. */
export async function findInstagramAccount(accessToken: string): Promise<{
  igUserId: string;
  username: string;
  pageId: string;
} | null> {
  const pages = await graphGet<{
    data: Array<{
      id: string;
      instagram_business_account?: { id: string; username?: string };
    }>;
  }>("/me/accounts", accessToken);

  for (const page of pages.data ?? []) {
    const ig = page.instagram_business_account;
    if (ig?.id) {
      let username = ig.username ?? "";
      if (!username) {
        const detail = await graphGet<{ username?: string }>(
          `/${ig.id}?fields=username`,
          accessToken,
        );
        username = detail.username ?? "";
      }
      return { igUserId: ig.id, username, pageId: page.id };
    }
  }
  return null;
}

/** IG medya listesi (son 25). */
export async function fetchInstagramMedia(
  igUserId: string,
  token: string,
): Promise<
  Array<{
    id: string;
    caption?: string;
    media_type: string;
    media_url?: string;
    thumbnail_url?: string;
    permalink?: string;
    timestamp?: string;
  }>
> {
  const data = await graphGet<{
    data: Array<{
      id: string;
      caption?: string;
      media_type: string;
      media_url?: string;
      thumbnail_url?: string;
      permalink?: string;
      timestamp?: string;
    }>;
  }>(
    `/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=25`,
    token,
  );
  return data.data ?? [];
}

/** Tek medya için insight metrikleri. */
export async function fetchMediaInsights(
  mediaId: string,
  token: string,
): Promise<MetaMediaInsight> {
  const out: MetaMediaInsight = {
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    reach: 0,
  };

  try {
    const insights = await graphGet<{
      data: Array<{ name: string; values: Array<{ value: number }> }>;
    }>(
      `/${mediaId}/insights?metric=reach,likes,comments,shares,saved,plays,total_interactions`,
      token,
    );
    for (const row of insights.data ?? []) {
      const v = row.values?.[0]?.value ?? 0;
      if (row.name === "reach") out.reach = v;
      if (row.name === "likes") out.likes = v;
      if (row.name === "comments") out.comments = v;
      if (row.name === "shares") out.shares = v;
      if (row.name === "plays") out.views = v;
    }
  } catch {
    // Reels dışı medyalarda plays olmayabilir — engagement fallback
    try {
      const basic = await graphGet<{
        like_count?: number;
        comments_count?: number;
      }>(`/${mediaId}?fields=like_count,comments_count`, token);
      out.likes = basic.like_count ?? 0;
      out.comments = basic.comments_count ?? 0;
    } catch {
      /* ignore */
    }
  }
  return out;
}
