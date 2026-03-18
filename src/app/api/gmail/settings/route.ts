import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import GoogleAccount from "@/models/GoogleAccount";

// GET /api/gmail/settings — get Gmail scan settings (multi-account)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await connectDB();
  const accounts = await GoogleAccount.find({ userId: session.userId }).lean();
  const user = await User.findById(session.userId)
    .select("googleEmail googleConnectedAt lastGmailScan autoGmailScan")
    .lean() as any;

  return NextResponse.json({
    accounts: accounts.map((a: any) => ({
      _id: String(a._id),
      email: a.email,
      connectedAt: a.connectedAt,
      lastScanAt: a.lastScanAt,
      autoScan: a.autoScan,
      status: a.status,
    })),
    // Backward compat
    connected: accounts.length > 0 || !!user?.googleEmail,
    email: accounts[0]?.email || user?.googleEmail || null,
    lastGmailScan: accounts[0]?.lastScanAt || user?.lastGmailScan || null,
    autoGmailScan: accounts[0]?.autoScan || user?.autoGmailScan || false,
  });
}

// PUT /api/gmail/settings — toggle auto-scan (supports per-account or all)
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await connectDB();
  const body = await request.json();

  if (body.accountId) {
    // Update specific account
    await GoogleAccount.findOneAndUpdate(
      { _id: body.accountId, userId: session.userId },
      { autoScan: !!body.autoGmailScan }
    );
  } else {
    // Update all accounts
    await GoogleAccount.updateMany(
      { userId: session.userId },
      { autoScan: !!body.autoGmailScan }
    );
    // Backward compat
    await User.findByIdAndUpdate(session.userId, { autoGmailScan: !!body.autoGmailScan });
  }

  return NextResponse.json({ success: true, autoGmailScan: !!body.autoGmailScan });
}
