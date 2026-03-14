import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const user = await User.findById(session.userId).select("-passwordHash").lean();
    if (!user) return apiError("ไม่พบผู้ใช้", 404);
    return apiSuccess({ user });
  });
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const body = await req.json();

    // Only allow safe field updates
    const allowedFields = ["displayName", "email", "phone", "notifyLine", "notifyEmail", "notifyBudgetAlert", "language", "timezone"];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    const user = await User.findByIdAndUpdate(session.userId, { $set: updates }, { new: true })
      .select("-passwordHash")
      .lean();

    if (!user) return apiError("ไม่พบผู้ใช้", 404);
    return apiSuccess({ user });
  });
}
