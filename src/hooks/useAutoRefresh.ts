import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Auto-refresh hook — polls an API endpoint and updates state.
 * Pauses when tab is hidden, resumes when visible.
 *
 * @param fetchUrl - API endpoint to poll
 * @param transform - Transform response JSON to desired shape
 * @param interval - Poll interval in ms (default: 10000 = 10s)
 * @returns [data, setData, isRefreshing]
 */
export function useAutoRefresh<T>(
  initialData: T,
  fetchUrl: string,
  transform: (json: any) => T,
  interval: number = 10000,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [data, setData] = useState<T>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mountedRef = useRef(true);
  const visibleRef = useRef(true);

  // Sync initial data
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const refetch = useCallback(async () => {
    if (!mountedRef.current || !visibleRef.current) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(fetchUrl);
      if (res.ok && mountedRef.current) {
        const json = await res.json();
        setData(transform(json));
      }
    } catch {} finally {
      if (mountedRef.current) setIsRefreshing(false);
    }
  }, [fetchUrl, transform]);

  // Poll timer
  useEffect(() => {
    if (interval <= 0) return;
    const timer = setInterval(refetch, interval);
    return () => clearInterval(timer);
  }, [refetch, interval]);

  // Pause on tab hidden, resume on visible
  useEffect(() => {
    const handler = () => {
      visibleRef.current = document.visibilityState === "visible";
      if (visibleRef.current) refetch(); // immediate refresh on tab focus
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [refetch]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  return [data, setData, isRefreshing];
}
