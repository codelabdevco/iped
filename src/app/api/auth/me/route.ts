import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.userId)
      .select("_id lineDisplayName lineProfilePic role accountType lineUserId email name")
      .lean();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        _id: user._id,
        displayName: user.lineDisplayName || user.name,
        pictureUrl: user.lineProfilePic || "",
        role: user.role,
        accountType: user.accountType,
        lineUserId: user.lineUserId,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error("Auth me error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
