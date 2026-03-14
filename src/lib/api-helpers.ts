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
export async function withAuth(
  request: NextRequest,
  handler: (session: JWTPayload, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return apiError("กรุณาเข้าสู่ระบบ", 401);
  }
  return handler(session, request);
}

export async function withAdmin(
  request: NextRequest,
  handler: (session: JWTPayload, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return apiError("กรุณาเข้าสู่ระบบ", 401);
  }
  if (!canViewAdmin(session.role)) {
    return apiError("ไม่มีสิทธิ์เข้าถึง", 403);
  }
  return handler(session, request);
}

// Pagination helpers
export function getPagination(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// Date range helpers
export function getDateRange(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const period = searchParams.get("period"); // today, week, month, year

  const now = new Date();
  let start: Date;
  let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    switch (period) {
      case "today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case "month":
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
  }

  return { start, end };
}
