import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiError } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import User from "@/models/User";

// GET /api/user — get current user profile
export async function GET(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const user = await User.findById(session.userId)
      .select("-passwordHash -googleAccessToken -googleRefreshToken")
      .lean() as any;
    if (!user) return apiError("User not found", 404);
    return NextResponse.json({ user: { ...user, _id: String(user._id) } });
  });
}

// PUT /api/user — update current user profile & settings
export async function PUT(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const body = await req.json();

    // Whitelist of updatable fields
    const allowed: Record<string, boolean> = {
      name: true,
      phone: true,
      occupation: true,
      gender: true,
      birthDate: true,
      accountType: true,
      businessName: true,
      monthlyBudget: true,
      "settings.language": true,
      "settings.currency": true,
      "settings.timezone": true,
      "settings.notifications.lineAlerts": true,
      "settings.notifications.emailAlerts": true,
      "settings.notifications.budgetWarning": true,
      "settings.notifications.dailySummary": true,
      "settings.notifications.dailySummaryTime": true,
      "settings.pdpaConsent": true,
      "settings.dataRetentionDays": true,
    };

    const update: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (allowed[key]) {
        update[key] = value;
      }
    }

    if (Object.keys(update).length === 0) {
      return apiError("No valid fields to update", 400);
    }

    const user = await User.findByIdAndUpdate(
      session.userId,
      { $set: update },
      { new: true, runValidators: true }
    ).select("-passwordHash -googleAccessToken -googleRefreshToken").lean() as any;

    if (!user) return apiError("User not found", 404);

    return NextResponse.json({ success: true, user: { ...user, _id: String(user._id) } });
  });
}
