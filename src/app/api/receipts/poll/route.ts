import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";

// Lightweight endpoint — returns only count + latest _id
// Client polls this to detect changes, then refreshes page data
export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    await connectDB();
    const accountType = session.accountType || "personal";
    const [countResult, latest] = await Promise.all([
      Receipt.countDocuments({ userId: session.userId, accountType }),
      Receipt.findOne({ userId: session.userId, accountType }).sort({ updatedAt: -1 }).select("_id updatedAt").lean(),
    ]);

    return NextResponse.json({
      count: countResult,
      latestId: latest ? String(latest._id) : null,
      latestUpdatedAt: latest?.updatedAt ? new Date(latest.updatedAt).toISOString() : null,
    });
  });
}
