import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiError } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import Notification from "@/models/Notification";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { $set: body },
      { new: true }
    ).lean();

    if (!notification) return apiError("ไม่พบการแจ้งเตือน", 404);

    return NextResponse.json({ success: true, notification: { ...notification, _id: String(notification._id) } });
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const { id } = await params;

    const result = await Notification.findOneAndDelete({ _id: id, userId: session.userId });
    if (!result) return apiError("ไม่พบการแจ้งเตือน", 404);

    return NextResponse.json({ success: true });
  });
}
