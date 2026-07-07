"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  parseAppTheme,
  THEME_STORAGE_KEY,
  themeCookieValue,
  type AppTheme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function persistTheme(theme: AppTheme) {
  document.cookie = themeCookieValue(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: AppTheme;
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<AppTheme>(initialTheme);

  useEffect(() => {
    try {
      const stored = parseAppTheme(localStorage.getItem(THEME_STORAGE_KEY));
      if (stored !== initialTheme) {
        setThemeState(stored);
        document.cookie = themeCookieValue(stored);
      }
    } catch {
      /* ignore */
    }
  }, [initialTheme]);

  const setTheme = useCallback((next: AppTheme) => {
    setThemeState(next);
    persistTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: AppTheme = prev === "dark" ? "light" : "dark";
      persistTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <div className="app-shell" data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
