// CSRF protection via double-submit cookie pattern
// For API routes: check Origin/Referer header matches our domain
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = process.env.NEXT_PUBLIC_APP_URL || "";

  // Skip for non-mutation requests
  if (request.method === "GET" || request.method === "HEAD") return true;

  // Skip for server-to-server (no origin = same origin in Next.js)
  if (!origin && !referer) return true;

  // Validate origin matches
  if (origin && host && origin.startsWith(host)) return true;
  if (referer && host && referer.startsWith(host)) return true;

  // Allow localhost in dev
  if (process.env.NODE_ENV !== "production") return true;

  return false;
}
