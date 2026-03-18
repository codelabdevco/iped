import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ connected: false });

  await connectDB();
  const user = await User.findById(session.userId).select("googleEmail googleConnectedAt").lean();
  const email = (user as any)?.googleEmail;

  return NextResponse.json({
    connected: !!email,
    email: email || null,
    connectedAt: (user as any)?.googleConnectedAt || null,
  });
}
