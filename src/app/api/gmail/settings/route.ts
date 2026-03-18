import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

// GET /api/gmail/settings — get Gmail scan settings
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.userId)
    .select("googleEmail googleConnectedAt lastGmailScan autoGmailScan")
    .lean() as any;

  return NextResponse.json({
    connected: !!user?.googleEmail,
    email: user?.googleEmail || null,
    connectedAt: user?.googleConnectedAt || null,
    lastGmailScan: user?.lastGmailScan || null,
    autoGmailScan: user?.autoGmailScan || false,
  });
}

// PUT /api/gmail/settings — toggle auto-scan
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await connectDB();
  const body = await request.json();

  await User.findByIdAndUpdate(session.userId, {
    autoGmailScan: !!body.autoGmailScan,
  });

  return NextResponse.json({ success: true, autoGmailScan: !!body.autoGmailScan });
}
