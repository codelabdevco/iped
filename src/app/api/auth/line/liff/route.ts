import { NextRequest, NextResponse } from "next/server";
import { createToken, setTokenCookie } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { logger } from "@/lib/logger";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();
    if (!accessToken) {
      return NextResponse.json({ error: "ไม่พบ access token" }, { status: 400 });
    }

    // Verify token + get profile from LINE
    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      return NextResponse.json({ error: "token ไม่ถูกต้อง" }, { status: 401 });
    }

    const profile = await profileRes.json();
    const lineUserId = profile.userId;
    const displayName = profile.displayName;
    const pictureUrl = profile.pictureUrl;

    if (!lineUserId) {
      return NextResponse.json({ error: "ไม่สามารถดึงข้อมูล LINE ได้" }, { status: 400 });
    }

    // Find or create user
    await connectDB();
    let user = await User.findOne({ lineUserId });

    if (!user) {
      user = await User.create({
        lineUserId,
        lineDisplayName: displayName,
        lineProfilePic: pictureUrl,
        name: displayName,
        role: "user",
        accountType: "personal",
        status: "active",
        lastLogin: new Date(),
        loginCount: 1,
      });
    } else {
      // Update profile + login stats
      user.lineDisplayName = displayName;
      user.lineProfilePic = pictureUrl;
      user.lastLogin = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      await user.save();
    }

    // Create JWT session
    const token = await createToken({
      userId: String(user._id),
      role: user.role || "user",
      accountType: user.accountType || "personal",
      orgId: user.orgId ? String(user.orgId) : undefined,
    });

    const res = NextResponse.json({ success: true });
    const cookie = setTokenCookie(token);
    res.headers.set("Set-Cookie", cookie["Set-Cookie"]);
    return res;
  } catch (error: any) {
    logger.error("LIFF auth error", { error: error.message });
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
