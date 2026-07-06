/**
 * Basit hex renk manipülasyonu — harici bağımlılık gerektirmez.
 * Vitrin marka rengi paletini (brand-50…brand-700) tek bir hex'ten türetir.
 */

function hexToHsl(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let hue = 0;
  let sat = 0;

  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) hue = ((b - r) / d + 2) / 6;
    else hue = ((r - g) / d + 4) / 6;
  }
  return [hue * 360, sat * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Rengi açar (amount: 0-1 arası, ör. 0.85 → çok açık, 0.15 → biraz açık) */
export function lighten(hex: string | null | undefined, amount: number): string {
  if (!hex) return lighten("#1e5b3e", amount);
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, Math.max(0, s - amount * 30), Math.min(100, l + (100 - l) * amount));
}

/** Rengi koyulaştırır (amount: 0-1 arası) */
export function darken(hex: string | null | undefined, amount: number): string {
  if (!hex) return darken("#1e5b3e", amount);
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, l * (1 - amount)));
}

/**
 * Tek bir brand hex'ten CSS custom property seti üretir.
 * Layout'ta `style` prop'una spread edilir.
 */
export function brandPalette(hex: string | null | undefined): Record<string, string> {
  const base = hex || "#1e5b3e";
  return {
    "--color-brand-50": lighten(base, 0.88),
    "--color-brand-100": lighten(base, 0.72),
    "--color-brand-500": lighten(base, 0.12),
    "--color-brand-600": base,
    "--color-brand-700": darken(base, 0.2),
  };
}
