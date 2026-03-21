import { NextRequest, NextResponse } from "next/server";
import { exchangeLineCode, getLineProfile, createToken, setTokenCookie } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.url;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
      return NextResponse.redirect(new URL("/login?error=auth_failed", baseUrl));
    }

    // Rate limit: 5 login attempts per minute per IP
    const rl = rateLimitByIP(req, "auth");
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many login attempts" }, { status: 429 });
    }

    // Exchange code for tokens
    const tokenData = await exchangeLineCode(code);
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/login?error=token_failed", baseUrl));
    }

    // Get LINE profile
    const profile = await getLineProfile(tokenData.access_token);
    if (!profile.userId) {
      return NextResponse.redirect(new URL("/login?error=profile_failed", baseUrl));
    }

    logger.info("LINE login success", { lineUserId: profile.userId });

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
    logger.error("LINE callback error", { error: err instanceof Error ? err.message : JSON.stringify(err) });
    return NextResponse.redirect(new URL("/login?error=server_error", baseUrl));
  }
}
