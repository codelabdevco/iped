import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import Notification from "@/models/Notification";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const notifications = await Notification.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({ userId: session.userId, read: false });

    return NextResponse.json({
      notifications: notifications.map((n: any) => ({ ...n, _id: String(n._id) })),
      unreadCount,
    });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const body = await req.json();

    if (!body.title || !body.type) {
      return apiError("กรุณาระบุ title และ type", 400);
    }

    const notification = await Notification.create({
      userId: session.userId,
      type: body.type,
      title: body.title,
      description: body.description || "",
      read: false,
    });

    return NextResponse.json({ success: true, notification: { ...notification.toObject(), _id: String(notification._id) } }, { status: 201 });
  });
}
