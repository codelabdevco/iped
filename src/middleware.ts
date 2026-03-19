import { NextRequest, NextResponse } from "next/server";

const publicPaths = ["/login", "/register", "/pricing", "/api-docs", "/api/auth", "/api/line/webhook", "/api/line", "/api/health"];

const businessOnlyPages = [
  "/dashboard/tax", "/dashboard/customers", "/dashboard/quotations",
  "/dashboard/invoices", "/dashboard/receivables", "/dashboard/team",
  "/dashboard/payroll", "/dashboard/approvals", "/dashboard/reimbursement",
  "/dashboard/accounting", "/dashboard/admin", "/dashboard/billing",
  "/dashboard/org-control",
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

  // ── /personal/... and /business/... → rewrite to /dashboard/... + set cookie ──
  const modeMatch = pathname.match(/^\/(personal|business)(\/.*)?$/);
  if (modeMatch) {
    const mode = modeMatch[1] as "personal" | "business";
    const rest = modeMatch[2] || "/dashboard";

    if (!token) return NextResponse.redirect(new URL("/login", request.url));

    // Route guard: personal mode blocks business-only pages
    if (mode === "personal") {
      const pagePath = rest.replace(/\/$/, "") || "/dashboard";
      for (const bp of businessOnlyPages) {
        if (pagePath === bp || pagePath.startsWith(bp + "/")) {
          return NextResponse.redirect(new URL("/personal/dashboard", request.url));
        }
      }
    }

    // Rewrite to actual page + set cookie (preserve query string)
    const rewriteUrl = new URL(rest, request.url);
    rewriteUrl.search = request.nextUrl.search;
    const response = NextResponse.rewrite(rewriteUrl);
    response.cookies.set("iped-mode", mode, { path: "/", maxAge: 365 * 24 * 60 * 60, sameSite: "lax" });
    return response;
  }

  // ── Legacy /dashboard/... → redirect to /{mode}/dashboard/... ──
  if (pathname.startsWith("/dashboard")) {
    if (!token) return NextResponse.redirect(new URL("/login", request.url));
    const mode = request.cookies.get("iped-mode")?.value || "personal";
    return NextResponse.redirect(new URL(`/${mode}${pathname}`, request.url));
  }

  // ── Root / ──
  if (pathname === "/") {
    if (!token) return NextResponse.redirect(new URL("/login", request.url));
    const mode = request.cookies.get("iped-mode")?.value || "personal";
    return NextResponse.redirect(new URL(`/${mode}/dashboard`, request.url));
  }

  // Other protected
  if (!token) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
