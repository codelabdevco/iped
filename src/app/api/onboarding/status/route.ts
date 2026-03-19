import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Receipt from "@/models/Receipt";
import GoogleAccount from "@/models/GoogleAccount";

// GET /api/onboarding/status — auto-detect which onboarding steps are complete
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await connectDB();
  const userId = session.userId;

  const [user, receiptCount, googleAccounts] = await Promise.all([
    User.findById(userId)
      .select("lineUserId googleEmail googleConnectedAt monthlyBudget businessName orgId")
      .lean() as any,
    Receipt.countDocuments({ userId }),
    GoogleAccount.find({ userId, status: "active" }).select("email").lean(),
  ]);

  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  const hasLine = !!user.lineUserId;
  const hasGoogle = !!user.googleEmail || googleAccounts.length > 0;
  const hasDrive = hasGoogle; // Drive uses same OAuth
  const hasGmail = hasGoogle; // Gmail uses same OAuth
  const hasReceipts = receiptCount > 0;
  const hasBudget = !!user.monthlyBudget;
  const hasCompany = !!user.businessName || !!user.orgId;

  return NextResponse.json({
    line: hasLine,
    google: hasGoogle,
    drive: hasDrive,
    gmail: hasGmail,
    receipts: hasReceipts,
    receiptCount,
    budget: hasBudget,
    company: hasCompany,
  });
}
