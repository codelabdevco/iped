"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface ThemeContextType {
  theme: "dark";
  toggleTheme: () => void;
  isDark: true;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Force dark mode
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.style.backgroundColor = "#0a0a0a";
    document.documentElement.style.color = "#fff";
    localStorage.setItem("iped-theme", "dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "dark", toggleTheme: () => {}, isDark: true, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const c = useContext(ThemeContext);
  if (!c) throw new Error("useTheme must be used within ThemeProvider");
  return c;
}
