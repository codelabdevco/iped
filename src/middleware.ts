import { NextRequest, NextResponse } from "next/server";

// Routes ที่ไม่ต้อง login
const publicPaths = ["/login", "/register", "/api/auth", "/api/line/webhook"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ข้าม public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ข้าม static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // เช็ค auth token
  const token = request.cookies.get("auth-token")?.value;
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
