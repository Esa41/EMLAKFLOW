"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle group relative flex h-9 w-9 items-center justify-center rounded-xl text-ink/55 transition-colors hover:bg-ink/[0.05] hover:text-ink/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 dark:hover:bg-white/[0.08] dark:hover:text-white/80"
      aria-label={isDark ? "Gündüz moduna geç" : "Gece moduna geç"}
      title={isDark ? "Gündüz modu" : "Gece modu"}
    >
      <span className="relative h-[18px] w-[18px]">
        <Sun
          size={18}
          strokeWidth={1.75}
          className={`absolute inset-0 transition-all duration-300 ease-out ${
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          }`}
        />
        <Moon
          size={18}
          strokeWidth={1.75}
          className={`absolute inset-0 transition-all duration-300 ease-out ${
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </span>
    </button>
  );
}
