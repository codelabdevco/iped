import { NextRequest, NextResponse } from "next/server";
import { exchangeLineCode, getLineProfile, createToken, setTokenCookie } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
      return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
    }

    // Exchange code for tokens
    const tokenData = await exchangeLineCode(code);
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/login?error=token_failed", req.url));
    }

    // Get LINE profile
    const profile = await getLineProfile(tokenData.access_token);
    if (!profile.userId) {
      return NextResponse.redirect(new URL("/login?error=profile_failed", req.url));
    }

    await connectDB();

    // Find or create user
    let user = await User.findOne({ lineUserId: profile.userId });
    if (!user) {
      user = await User.create({
        lineUserId: profile.userId,
        lineDisplayName: profile.displayName || "",
        lineProfilePic: profile.pictureUrl || "",
        name: profile.displayName || "",
        role: "user",
        accountType: "individual",
        onboardingStep: 0,
        onboardingComplete: false,
      });
    } else {
      // Update profile info
      if (profile.displayName) user.lineDisplayName = profile.displayName;
      if (profile.pictureUrl) user.lineProfilePic = profile.pictureUrl;
      user.lastLogin = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      await user.save();
    }

    // Create JWT token
    const token = await createToken({
      userId: user._id.toString(),
      role: user.role || "user",
      accountType: user.accountType || "individual",
      orgId: user.orgId?.toString(),
    });

    // Set cookie and redirect
    const response = NextResponse.redirect(new URL("/", req.url));
    const cookie = setTokenCookie(token);
    response.headers.set("Set-Cookie", cookie["Set-Cookie"]);
    return response;
  } catch (err) {
    console.error("LINE callback error:", err);
    return NextResponse.redirect(new URL("/login?error=server_error", req.url));
  }
}
