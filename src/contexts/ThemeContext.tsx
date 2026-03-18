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

function getInitialTheme(): Theme {
  if (typeof window !== "undefined") {
    // Read from data-theme set by inline script, or localStorage, or default dark
    const attr = document.documentElement.getAttribute("data-theme") as Theme;
    if (attr === "light" || attr === "dark") return attr;
    const saved = localStorage.getItem("iped-theme") as Theme;
    if (saved) return saved;
  }
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const n = theme === "dark" ? "light" : "dark";
    setTheme(n);
    localStorage.setItem("iped-theme", n);
    document.documentElement.setAttribute("data-theme", n);
    document.documentElement.style.backgroundColor = n === "dark" ? "#0a0a0a" : "#f7f7f7";
    document.documentElement.style.color = n === "dark" ? "#fff" : "#111";
  };

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.backgroundColor = theme === "dark" ? "#0a0a0a" : "#f7f7f7";
    document.documentElement.style.color = theme === "dark" ? "#fff" : "#111";
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
