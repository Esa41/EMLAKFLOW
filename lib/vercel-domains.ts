/**
 * Vercel Domains API — Super Admin white-label kurulumu.
 * Env: VERCEL_TOKEN + VERCEL_PROJECT_ID (veya VERCEL_PROJECT_ID_EMLAKFLOW)
 * Yoksa null döner; admin UI manuel DNS talimatı gösterir.
 */

export type VercelDomainResult = {
  ok: boolean;
  name?: string;
  verified?: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason?: string;
  }>;
  error?: string;
  skipped?: boolean;
};

function vercelConfig() {
  const token = process.env.VERCEL_TOKEN?.trim();
  const projectId =
    process.env.VERCEL_PROJECT_ID?.trim() ||
    process.env.VERCEL_PROJECT_ID_EMLAKFLOW?.trim();
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  return { token, projectId, teamId };
}

export function vercelDomainsConfigured(): boolean {
  const { token, projectId } = vercelConfig();
  return Boolean(token && projectId);
}

function teamQuery(teamId?: string) {
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
}

/** Projeye domain ekler (idempotent — zaten varsa mevcut kaydı döner). */
export async function addVercelDomain(
  domain: string,
): Promise<VercelDomainResult> {
  const { token, projectId, teamId } = vercelConfig();
  if (!token || !projectId) {
    return {
      ok: false,
      skipped: true,
      error: "VERCEL_TOKEN / VERCEL_PROJECT_ID tanımlı değil — manuel ekleyin.",
    };
  }

  const res = await fetch(
    `https://api.vercel.com/v10/projects/${projectId}/domains${teamQuery(teamId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    },
  );

  const data = (await res.json().catch(() => ({}))) as {
    name?: string;
    verified?: boolean;
    verification?: VercelDomainResult["verification"];
    error?: { code?: string; message?: string };
    message?: string;
  };

  // Domain zaten ekli
  if (res.status === 409 || data.error?.code === "domain_already_in_use") {
    return getVercelDomain(domain);
  }

  if (!res.ok) {
    return {
      ok: false,
      error:
        data.error?.message ||
        data.message ||
        `Vercel ${res.status}`,
    };
  }

  return {
    ok: true,
    name: data.name ?? domain,
    verified: data.verified ?? false,
    verification: data.verification,
  };
}

export async function getVercelDomain(
  domain: string,
): Promise<VercelDomainResult> {
  const { token, projectId, teamId } = vercelConfig();
  if (!token || !projectId) {
    return { ok: false, skipped: true, error: "Vercel API yapılandırılmamış." };
  }

  const q = teamId
    ? `?teamId=${encodeURIComponent(teamId)}`
    : "";
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}${q}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const data = (await res.json().catch(() => ({}))) as {
    name?: string;
    verified?: boolean;
    verification?: VercelDomainResult["verification"];
    error?: { message?: string };
  };

  if (!res.ok) {
    return {
      ok: false,
      error: data.error?.message || `Vercel ${res.status}`,
    };
  }

  return {
    ok: true,
    name: data.name ?? domain,
    verified: data.verified ?? false,
    verification: data.verification,
  };
}

/** Admin UI için sabit DNS özeti (API yoksa). */
export function manualDnsInstructions(domain: string) {
  const isApex = domain.split(".").length === 2;
  return {
    domain,
    steps: isApex
      ? [
          "Vercel Dashboard → Project → Settings → Domains → Add",
          `${domain} ekleyin`,
          "DNS'te A kaydı: 76.76.21.21 (Vercel)",
          "www için CNAME: cname.vercel-dns.com",
        ]
      : [
          "Vercel Dashboard → Project → Settings → Domains → Add",
          `${domain} ekleyin`,
          `DNS CNAME: ${domain.split(".")[0]} → cname.vercel-dns.com`,
        ],
    cnameTarget: "cname.vercel-dns.com",
    aTarget: "76.76.21.21",
  };
}
