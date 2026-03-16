"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
type Theme = "dark" | "light";
interface ThemeContextType { theme: Theme; toggleTheme: () => void; isDark: boolean; }
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => { const s = localStorage.getItem("iped-theme") as Theme; if (s) setTheme(s); }, []);
  const toggleTheme = () => { const n = theme === "dark" ? "light" : "dark"; setTheme(n); localStorage.setItem("iped-theme", n); };
  useEffect(() => {
    document.documentElement.style.setProperty("--color-border", theme === "dark" ? "rgba(255,255,255,0.04)" : "hsl(0, 0%, 88%)");
  }, [theme]);
  return (<ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>{children}</ThemeContext.Provider>);
}
export function useTheme() { const c = useContext(ThemeContext); if (!c) throw new Error("useTheme must be used within ThemeProvider"); return c; }
