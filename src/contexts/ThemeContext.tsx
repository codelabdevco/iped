"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("iped-theme") as Theme;
    if (s) setTheme(s);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const n = theme === "dark" ? "light" : "dark";
    setTheme(n);
    localStorage.setItem("iped-theme", n);
  };

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.style.setProperty(
      "--color-border",
      theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
    );
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark", mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const c = useContext(ThemeContext);
  if (!c) throw new Error("useTheme must be used within ThemeProvider");
  return c;
}
