import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";

// Lightweight endpoint — returns only count + latest _id
// Client polls this to detect changes, then refreshes page data
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await connectDB();
  const [countResult, latest] = await Promise.all([
    Receipt.countDocuments({ userId: session.userId }),
    Receipt.findOne({ userId: session.userId }).sort({ updatedAt: -1 }).select("_id updatedAt").lean(),
  ]);

  return NextResponse.json({
    count: countResult,
    latestId: latest ? String(latest._id) : null,
    latestUpdatedAt: latest?.updatedAt ? new Date(latest.updatedAt).toISOString() : null,
  });
}
