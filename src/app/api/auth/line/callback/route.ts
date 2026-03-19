import { NextRequest, NextResponse } from "next/server";
import { exchangeLineCode, getLineProfile, createToken, setTokenCookie } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.url;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
      return NextResponse.redirect(new URL("/login?error=auth_failed", baseUrl));
    }

    // Exchange code for tokens
    const tokenData = await exchangeLineCode(code);
    console.log("LINE token response:", JSON.stringify(tokenData));
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/login?error=token_failed", baseUrl));
    }

    // Get LINE profile
    const profile = await getLineProfile(tokenData.access_token);
    console.log("LINE profile response:", JSON.stringify(profile));
    if (!profile.userId) {
      return NextResponse.redirect(new URL("/login?error=profile_failed", baseUrl));
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
        accountType: "personal",
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
      accountType: user.accountType === "business" ? "business" : "personal",
      orgId: user.orgId?.toString(),
    });

    // Set cookie and redirect to dashboard
    const redirectUrl = new URL("/personal/dashboard", baseUrl);
    const response = NextResponse.redirect(redirectUrl);
    const cookie = setTokenCookie(token);
    response.headers.set("Set-Cookie", cookie["Set-Cookie"]);
    return response;
  } catch (err: any) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.url;
    console.error("LINE callback error:", err instanceof Error ? err.message : JSON.stringify(err));
    return NextResponse.redirect(new URL("/login?error=server_error", baseUrl));
  }
}
