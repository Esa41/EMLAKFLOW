"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className="flex h-9 items-center rounded-full border border-[var(--app-border)] bg-[var(--app-input-bg)] p-0.5"
      role="group"
      aria-label="Görünüm modu"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-pressed={!isDark}
        className={`flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold transition-all ${
          !isDark
            ? "bg-[var(--app-surface-hover)] text-ink shadow-sm"
            : "text-ink/45 hover:text-ink/65"
        }`}
      >
        <Sun size={14} strokeWidth={2} />
        <span className="hidden sm:inline">Gündüz</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-pressed={isDark}
        className={`flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold transition-all ${
          isDark
            ? "bg-[var(--app-surface-hover)] text-ink shadow-sm"
            : "text-ink/45 hover:text-ink/65"
        }`}
      >
        <Moon size={14} strokeWidth={2} />
        <span className="hidden sm:inline">Gece</span>
      </button>
    </div>
  );
}
