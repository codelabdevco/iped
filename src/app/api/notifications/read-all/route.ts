import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import Notification from "@/models/Notification";

export async function POST(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    await Notification.updateMany({ userId: session.userId, read: false }, { $set: { read: true } });
    return NextResponse.json({ success: true });
  });
}
