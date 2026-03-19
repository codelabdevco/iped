import { useState, useEffect, useCallback } from "react";

/**
 * Hook that syncs state with server-provided initial data.
 * Listens for mode changes and calls onModeChange callback or fetchUrl to re-fetch.
 *
 * @param initialData - Data from server component props (first load)
 * @param fetchUrl - Optional API URL to re-fetch when mode changes
 * @param transform - Optional transform function for API response
 * @returns [data, setData]
 */
export function useReactiveData<T>(
  initialData: T,
  fetchUrl?: string,
  transform?: (json: any) => T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [data, setData] = useState<T>(initialData);

  // Sync when server re-renders with new props
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Re-fetch from API on mode change
  useEffect(() => {
    if (!fetchUrl) return;
    const handler = async () => {
      try {
        const res = await fetch(fetchUrl);
        if (res.ok) {
          const json = await res.json();
          setData(transform ? transform(json) : json);
        }
      } catch {}
    };
    window.addEventListener("iped-mode-change", handler);
    return () => window.removeEventListener("iped-mode-change", handler);
  }, [fetchUrl, transform]);

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
