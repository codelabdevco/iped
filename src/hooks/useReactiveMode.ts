import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook that syncs state with server-provided initial data.
 * Supports: mode change re-fetch, auto-polling, and manual state updates.
 *
 * @param initialData - Data from server component props (first load)
 * @param fetchUrl - Optional API URL to re-fetch on mode change / polling
 * @param transform - Optional transform function for API response
 * @param pollInterval - Optional polling interval in ms (default: 0 = disabled)
 * @returns [data, setData]
 */
export function useReactiveData<T>(
  initialData: T,
  fetchUrl?: string,
  transform?: (json: any) => T,
  pollInterval?: number
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [data, setData] = useState<T>(initialData);
  const mountedRef = useRef(true);

  // Sync when server re-renders with new props
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Shared fetch function
  const refetch = useCallback(async () => {
    if (!fetchUrl || !mountedRef.current) return;
    try {
      const res = await fetch(fetchUrl);
      if (res.ok && mountedRef.current) {
        const json = await res.json();
        setData(transform ? transform(json) : json);
      }
    } catch {}
  }, [fetchUrl, transform]);

  // Re-fetch from API on mode change
  useEffect(() => {
    if (!fetchUrl) return;
    window.addEventListener("iped-mode-change", refetch);
    return () => window.removeEventListener("iped-mode-change", refetch);
  }, [fetchUrl, refetch]);

  // Auto-polling
  useEffect(() => {
    if (!fetchUrl || !pollInterval || pollInterval <= 0) return;
    const timer = setInterval(refetch, pollInterval);
    return () => clearInterval(timer);
  }, [fetchUrl, pollInterval, refetch]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

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
