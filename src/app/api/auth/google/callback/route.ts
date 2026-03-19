import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import GoogleAccount from "@/models/GoogleAccount";
import { encrypt } from "@/lib/encrypt";

// GET /api/auth/google/callback — handle OAuth callback
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // userId
  const error = searchParams.get("error");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  if (error || !code || !state) {
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?google=error`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: `${baseUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      console.error("Google token error:", tokens);
      return NextResponse.redirect(`${baseUrl}/dashboard/settings?google=error`);
    }

    // Get user email
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();

    // Save tokens
    await connectDB();

    // Upsert GoogleAccount (multi-account support) — encrypt tokens before storage
    await GoogleAccount.findOneAndUpdate(
      { userId: state, email: profile.email },
      {
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
        connectedAt: new Date(),
        status: "active",
      },
      { upsert: true, new: true }
    );

    // Also keep backward-compat: save to User (for existing code) — encrypt tokens
    await User.findByIdAndUpdate(state, {
      googleAccessToken: encrypt(tokens.access_token),
      googleRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
      googleEmail: profile.email,
      googleConnectedAt: new Date(),
    });

    console.log("Google connected:", profile.email, "for user:", state);
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?google=success`);
  } catch (err: any) {
    console.error("Google callback error:", err.message);
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?google=error`);
  }
}
