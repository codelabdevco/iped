import { NextRequest, NextResponse } from "next/server";
import { getSession, JWTPayload, canViewAdmin } from "./auth";

// Standard API response helpers
export function apiSuccess(data: Record<string, unknown>, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// Auth middleware for API routes
// Reads x-account-type header from client to determine personal/business mode
export async function withAuth(
  request: NextRequest,
  handler: (session: JWTPayload, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("กรุณาเข้าสู่ระบบ", 401);
    }
    // Read accountType from client header (personal/business mode toggle)
    const headerMode = request.headers.get("x-account-type");
    if (headerMode === "personal" || headerMode === "business") {
      session.accountType = headerMode;
    }
    return await handler(session, request);
  } catch (error) {
    console.error("API Error:", error);
    return apiError("เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง", 500);
  }
}

export async function withAdmin(
  request: NextRequest,
  handler: (session: JWTPayload, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("กรุณาเข้าสู่ระบบ", 401);
    }
    if (!canViewAdmin(session.role)) {
      return apiError("ไม่มีสิทธิ์เข้าถึง", 403);
    }
    return await handler(session, request);
  } catch (error) {
    console.error("Admin API Error:", error);
    return apiError("เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง", 500);
  }
}

// Pagination helpers
export function getPagination(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
