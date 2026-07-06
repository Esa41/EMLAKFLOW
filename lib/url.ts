/**
 * Vercel-uyumlu base URL çözümleyici.
 * Öncelik: AUTH_URL > VERCEL_PROJECT_PRODUCTION_URL > VERCEL_URL > localhost
 */
export function getBaseUrl(): string {
  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL.replace(/\/$/, "");
  }
  // Vercel, deploy edilen her URL'i VERCEL_URL olarak enjekte eder (protocol yok)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
