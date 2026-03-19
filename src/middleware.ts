import { NextRequest, NextResponse } from "next/server";

// Routes ที่ไม่ต้อง login
const publicPaths = ["/login", "/register", "/api/auth", "/api/line/webhook", "/api/line"];

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

    // ถ้ายังไม่ login → redirect ไป login
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
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

  // ── Legacy /dashboard/... → redirect to /personal/dashboard/... or /business/... ──
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Read current mode from cookie to maintain user's last choice
    const mode = request.cookies.get("iped-mode")?.value || "personal";
    const redirectUrl = new URL(`/${mode}${pathname}`, request.url);
    return NextResponse.redirect(redirectUrl);
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
