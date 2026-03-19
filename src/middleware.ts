import { NextRequest, NextResponse } from "next/server";

const publicPaths = ["/login", "/register", "/api/auth", "/api/line/webhook", "/api/line"];

// Business-only pages
const businessOnlyPages = [
  "/dashboard/tax", "/dashboard/customers", "/dashboard/quotations",
  "/dashboard/invoices", "/dashboard/receivables", "/dashboard/team",
  "/dashboard/payroll", "/dashboard/approvals", "/dashboard/reimbursement",
  "/dashboard/accounting", "/dashboard/admin", "/dashboard/billing",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Skip static & API
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/api/") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("iped-token")?.value;

  // ── /personal/... and /business/... → set cookie + redirect to /dashboard/... ──
  const modeMatch = pathname.match(/^\/(personal|business)(\/.*)?$/);
  if (modeMatch) {
    const mode = modeMatch[1];
    const rest = modeMatch[2] || "/dashboard";
    if (!token) return NextResponse.redirect(new URL("/login", request.url));

    // Redirect to clean URL + set cookie
    const response = NextResponse.redirect(new URL(rest, request.url));
    response.cookies.set("iped-mode", mode, { path: "/", maxAge: 365 * 24 * 60 * 60, sameSite: "lax" });
    return response;
  }

  // ── Dashboard routes ──
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Route guard: block business-only pages in personal mode
    const mode = request.cookies.get("iped-mode")?.value || "personal";
    if (mode === "personal") {
      for (const bp of businessOnlyPages) {
        if (pathname === bp || pathname.startsWith(bp + "/")) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }
    }

    return NextResponse.next();
  }

  // Root
  if (pathname === "/") {
    if (!token) return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Other protected
  if (!token) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
