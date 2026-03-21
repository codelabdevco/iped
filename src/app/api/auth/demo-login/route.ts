import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { createToken, setTokenCookie } from "@/lib/auth";
import { logAuthAction } from "@/lib/audit";
import { logger } from "@/lib/logger";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "กรุณากรอก Email" }, { status: 400 });
    }

    await connectDB();

    // Find or create demo user
    let user = await User.findOne({ email });

    if (!user) {
      // Auto-create user for demo
      user = await User.create({
        email,
        displayName: email.split("@")[0],
        name: email.split("@")[0],
        role: email.includes("admin") ? "admin" : "user",
        accountType: "personal",
        status: "active",
        pdpaConsent: true,
        pdpaConsentDate: new Date(),
      });
    }

    const token = await createToken({
      userId: user._id.toString(),
      role: user.role,
      accountType: user.accountType || "personal",
      orgId: user.orgId?.toString(),
    });

    await logAuthAction("login", `Demo login: ${email}`, user._id.toString(), { method: "demo", email });

    const response = NextResponse.json({ success: true, user: { displayName: user.displayName, role: user.role } });

    // Set cookie
    const cookieHeaders = setTokenCookie(token);
    response.headers.set("Set-Cookie", cookieHeaders["Set-Cookie"]);

    return response;
  } catch (error) {
    logger.error("Demo login error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
