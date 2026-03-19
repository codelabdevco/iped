import { useState, useEffect, useCallback } from "react";

/**
 * Hook that syncs state with server-provided initial data and re-fetches on mode change.
 * Use in client components that receive data from server components.
 *
 * @param initialData - Data from server component props
 * @param onModeChange - Optional callback to re-fetch data when mode changes
 * @returns [data, setData]
 */
export function useReactiveData<T>(
  initialData: T,
  onModeChange?: () => void
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [data, setData] = useState<T>(initialData);

  // Sync when server re-renders with new props (e.g. mode switch → router.refresh())
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Re-fetch on mode change if callback provided
  useEffect(() => {
    if (!onModeChange) return;
    const handler = () => onModeChange();
    window.addEventListener("iped-mode-change", handler);
    return () => window.removeEventListener("iped-mode-change", handler);
  }, [onModeChange]);

  return [data, setData];
}

/**
 * Hook that listens for mode changes and returns current mode.
 */
export function useAccountMode() {
  const [mode, setMode] = useState<"personal" | "business">("personal");

  useEffect(() => {
    const saved = localStorage.getItem("iped-mode");
    if (saved === "business") setMode("business");

    const handler = (e: Event) => {
      setMode((e as CustomEvent).detail as "personal" | "business");
    };
    window.addEventListener("iped-mode-change", handler);
    return () => window.removeEventListener("iped-mode-change", handler);
  }, []);

  return mode;
}
