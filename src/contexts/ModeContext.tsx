"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { usePathname } from "next/navigation";

type Mode = "personal" | "business";

interface ModeContextValue {
  mode: Mode;
  switchMode: (m: Mode) => void;
  version: number;
}

const ModeContext = createContext<ModeContextValue>({
  mode: "personal",
  switchMode: () => {},
  version: 0,
});

/** Read mode from URL pathname: /business/... → "business", else "personal" */
function getModeFromPath(pathname: string): Mode {
  return pathname.startsWith("/business") ? "business" : "personal";
}

export function ModeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Initialize from URL — no flash, no useEffect needed
  const [mode, setMode] = useState<Mode>(() => getModeFromPath(pathname));
  const [version, setVersion] = useState(0);

  // Keep in sync if pathname changes (e.g. browser back/forward)
  useEffect(() => {
    const newMode = getModeFromPath(pathname);
    if (newMode !== mode) setMode(newMode);
  }, [pathname]);

  // Listen for external mode changes
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
