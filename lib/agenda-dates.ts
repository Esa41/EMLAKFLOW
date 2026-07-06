/** Ajanda takvim yardımcıları — hafta navigasyonu ve gün anahtarları. */

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dateKeyFromIso(iso: string): string {
  return dateKey(new Date(iso));
}

/** Hafta Pazartesi'den başlar (TR). */
export function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  if (weekStart.getFullYear() !== end.getFullYear()) {
    return `${weekStart.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} – ${end.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}`;
  }
  if (weekStart.getMonth() === end.getMonth()) {
    return `${weekStart.getDate()} – ${end.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}`;
  }
  return `${weekStart.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} – ${end.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}`;
}

export function dayLabelTr(key: string): string {
  const date = parseDateKey(key);
  const today = new Date();
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((date.getTime() - t.getTime()) / 86400000);
  const base = date.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  if (diff === 0) return `Bugün · ${base}`;
  if (diff === 1) return `Yarın · ${base}`;
  if (diff === -1) return `Dün · ${base}`;
  return base;
}

export function isToday(d: Date): boolean {
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

export function shortDayLabel(d: Date): string {
  return d.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric" });
}
