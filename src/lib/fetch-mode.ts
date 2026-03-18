/**
 * Patches global fetch to automatically inject x-account-type header
 * based on the current mode stored in localStorage (iped-mode).
 * This ensures all API calls include the personal/business context.
 */
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    // Only inject header for same-origin API calls
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
    if (url.startsWith("/api/") || url.startsWith(window.location.origin + "/api/")) {
      const mode = localStorage.getItem("iped-mode") || "personal";
      const headers = new Headers(init?.headers);
      if (!headers.has("x-account-type")) {
        headers.set("x-account-type", mode);
      }
      return originalFetch.call(this, input, { ...init, headers });
    }
    return originalFetch.call(this, input, init);
  };
}

export {};
