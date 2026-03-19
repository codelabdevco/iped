"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";

type Mode = "personal" | "business";

interface ModeContextValue {
  mode: Mode;
  switchMode: (m: Mode) => void;
  /** Increments on every mode change — use as dependency to trigger re-fetch */
  version: number;
}

const ModeContext = createContext<ModeContextValue>({
  mode: "personal",
  switchMode: () => {},
  version: 0,
});

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("personal");
  const [version, setVersion] = useState(0);
  const initRef = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const saved = localStorage.getItem("iped-mode") as Mode | null;
    if (saved === "business") setMode("business");
  }, []);

  // Listen for external mode changes (e.g. from Settings page)
  useEffect(() => {
    const handler = (e: Event) => {
      const newMode = (e as CustomEvent).detail as Mode;
      setMode(newMode);
      setVersion((v) => v + 1);
    };
    window.addEventListener("iped-mode-change", handler);
    return () => window.removeEventListener("iped-mode-change", handler);
  }, []);

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setVersion((v) => v + 1);
    localStorage.setItem("iped-mode", m);
    document.cookie = `iped-mode=${m}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent("iped-mode-change", { detail: m }));
  }, []);

  return (
    <ModeContext.Provider value={{ mode, switchMode, version }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}
