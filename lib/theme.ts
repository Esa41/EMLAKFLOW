/** Uygulama teması — tek kaynak (cookie + localStorage aynı anahtar). */
export const THEME_COOKIE = "emlakflow-theme";
export const THEME_STORAGE_KEY = THEME_COOKIE;

export type AppTheme = "light" | "dark";

export function parseAppTheme(value: string | null | undefined): AppTheme {
  return value === "dark" ? "dark" : "light";
}

export function themeCookieValue(theme: AppTheme): string {
  return `${THEME_COOKIE}=${theme};path=/;max-age=31536000;SameSite=Lax`;
}
