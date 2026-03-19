import { NextRequest, NextResponse } from "next/server";

// Routes ที่ไม่ต้อง login
const publicPaths = ["/login", "/register", "/api/auth", "/api/line/webhook", "/api/line"];

// ── Route permissions by mode ──
// Pages that ONLY exist in personal mode
const personalOnlyPages = new Set<string>([
  // (currently all personal pages also exist in business)
]);

// Pages that ONLY exist in business mode
const businessOnlyPages = new Set([
  "/dashboard/tax",
  "/dashboard/customers",
  "/dashboard/quotations",
  "/dashboard/invoices",
  "/dashboard/receivables",
  "/dashboard/team",
  "/dashboard/payroll",
  "/dashboard/approvals",
  "/dashboard/reimbursement",
  "/dashboard/accounting",
  "/dashboard/admin",
  "/dashboard/billing",
]);

// Pages shared between both modes
// /dashboard, /dashboard/income, /dashboard/expenses, /dashboard/savings,
// /dashboard/drive, /dashboard/receipts, /dashboard/matching,
// /dashboard/duplicates, /dashboard/reports, /dashboard/settings,
// /dashboard/scan, /dashboard/budget, /dashboard/categories,
// /dashboard/email-scanner, etc.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ข้าม public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ข้าม static files & API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // เช็ค auth token
  const token = request.cookies.get("iped-token")?.value;

  // ── Mode routing: /personal/... and /business/... ──
  const modeMatch = pathname.match(/^\/(personal|business)(\/.*)?$/);
  if (modeMatch) {
    const mode = modeMatch[1] as "personal" | "business";
    const rest = modeMatch[2] || "/dashboard";

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ── Route guard: check if page is allowed for this mode ──
    // Find the matching page path (strip trailing slash, handle sub-paths)
    const pagePath = rest.replace(/\/$/, "") || "/dashboard";

    if (mode === "personal") {
      // Check if this is a business-only page
      for (const bp of businessOnlyPages) {
        if (pagePath === bp || pagePath.startsWith(bp + "/")) {
          return NextResponse.redirect(new URL("/personal/dashboard", request.url));
        }
      }
    } else {
      // Check if this is a personal-only page
      for (const pp of personalOnlyPages) {
        if (pagePath === pp || pagePath.startsWith(pp + "/")) {
          return NextResponse.redirect(new URL("/business/dashboard", request.url));
        }
      }
    }

    // Rewrite to the actual page path + set cookie
    const rewriteUrl = new URL(rest, request.url);
    const response = NextResponse.rewrite(rewriteUrl);
    response.cookies.set("iped-mode", mode, {
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
      sameSite: "lax",
    });
    return response;
  }

  // ── Legacy /dashboard/... → redirect to /{mode}/dashboard/... ──
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const mode = request.cookies.get("iped-mode")?.value || "personal";
    return NextResponse.redirect(new URL(`/${mode}${pathname}`, request.url));
  }

  // ── Root / → redirect to /personal/dashboard ──
  if (pathname === "/") {
    if (!token) return NextResponse.redirect(new URL("/login", request.url));
    const mode = request.cookies.get("iped-mode")?.value || "personal";
    return NextResponse.redirect(new URL(`/${mode}/dashboard`, request.url));
  }

  // ── Other protected routes ──
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
