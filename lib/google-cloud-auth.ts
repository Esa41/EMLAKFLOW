import { GoogleAuth } from "google-auth-library";

let authClient: GoogleAuth | null = null;

function parseServiceAccountCredentials(): Record<string, unknown> {
  const raw =
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();

  if (!raw) {
    throw new Error(
      "Google Cloud kimlik bilgisi eksik (GOOGLE_SERVICE_ACCOUNT_KEY veya GOOGLE_APPLICATION_CREDENTIALS_JSON).",
    );
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("Google service account JSON geçersiz.");
  }
}

function getGoogleAuth(): GoogleAuth {
  if (!authClient) {
    authClient = new GoogleAuth({
      credentials: parseServiceAccountCredentials(),
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
  }
  return authClient;
}

/** Vertex AI REST çağrıları için OAuth2 access token. */
export async function getGoogleAccessToken(): Promise<string> {
  const auth = getGoogleAuth();
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token =
    typeof tokenResponse === "string" ? tokenResponse : tokenResponse?.token;

  if (!token) {
    throw new Error("Google Cloud access token alınamadı.");
  }

  return token;
}

export function getGoogleCloudProjectId(): string {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error("GOOGLE_CLOUD_PROJECT_ID tanımlı değil.");
  }
  return projectId;
}

export function getGoogleCloudLocation(): string {
  return process.env.GOOGLE_CLOUD_LOCATION?.trim() || "us-central1";
}

export function getVeoModelId(): string {
  return process.env.VERTEX_AI_VEO_MODEL?.trim() || "veo-2.0-generate-001";
}
